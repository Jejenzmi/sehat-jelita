/**
 * SIMRS ZEN -- WHO ICD-11 API Service
 *
 * Authentication : OAuth 2 client_credentials
 * Token endpoint : https://icdaccessmanagement.who.int/connect/token
 * API base       : https://id.who.int
 * Docs           : https://icd.who.int/docs/icd-api/
 *
 * Provides:
 *  - search(q, lang)        -> autocomplete / fulltext search
 *  - getEntity(entityId)    -> fetch entity details by WHO URI/ID
 *  - getCodeInfo(code)      -> decode an ICD-11 code string
 *  - lookupByCode(code)     -> find linearization entity by alphanumeric code
 *
 * Token is cached in-process for (expiry - 60 s) to minimise round-trips.
 */

const TOKEN_URL = process.env.ICD11_TOKEN_URL || 'https://icdaccessmanagement.who.int/connect/token';
const BASE_URL = process.env.ICD11_BASE_URL || 'https://id.who.int';
const LINEARIZATION = process.env.ICD11_LINEARIZATION || 'mms';
const RELEASE = process.env.ICD11_RELEASE || '2024-01';

// Mutable credentials -- updated by saveConfiguration() and loadConfiguration()
// Must NOT be const: process.env is evaluated at module-load time, making
// const values frozen. Use let so updateCredentials() can change them.
let _clientId = process.env.ICD11_CLIENT_ID || '';
let _clientSecret = process.env.ICD11_CLIENT_SECRET || '';

// ---- Token cache ----------------------------------------------------------
export let _cachedToken: string | null = null;
export let _tokenExpiresAt = 0;

export interface ICD11SearchResult {
  entity_id: string | null;
  icd11_code: string | null;
  icd10_code: string | null;
  title: string;
  definition: string;
  synonyms: string[];
  chapter: string | null;
  is_leaf: boolean;
  lang: string;
}

export interface ICD11Entity {
  entity_id: string;
  icd11_code: string | null;
  title: string;
  definition: string;
  synonyms: string[];
  inclusions?: string[];
  exclusions?: string[];
  parent_code?: string | null;
}

/** Replace in-process credentials and reset token cache. */
export function updateCredentials(clientId: string, clientSecret: string): void {
  _clientId = clientId;
  _clientSecret = clientSecret;
  _cachedToken = null;
  _tokenExpiresAt = 0;
}

async function getAccessToken(overrideId?: string, overrideSecret?: string): Promise<string> {
  const id = overrideId || _clientId;
  const secret = overrideSecret || _clientSecret;

  // Return cached token only when using default credentials (no override)
  if (!overrideId && _cachedToken && Date.now() < _tokenExpiresAt) {
    return _cachedToken;
  }

  if (!id || !secret) {
    throw new Error('ICD-11 credentials belum dikonfigurasi (ICD11_CLIENT_ID / ICD11_CLIENT_SECRET)');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'icdapi_access',
    client_id: id,
    client_secret: secret,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal mendapat token ICD-11: ${res.status} ${text}`);
  }

  const json = await res.json() as { access_token: string; expires_in: number };
  // Only cache when using default credentials
  if (!overrideId) {
    _cachedToken = json.access_token;
    _tokenExpiresAt = Date.now() + ((json.expires_in - 60) * 1000);
  }
  return json.access_token;
}

// ---- Core fetch helper ----------------------------------------------------
async function icdFetch(path: string, lang: string = 'id'): Promise<Record<string, unknown>> {
  const token = await getAccessToken();
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'API-Version': 'v2',
      'Accept': 'application/json',
      'Accept-Language': lang,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ICD-11 API error: ${res.status} ${text}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

// ---- Normalise a search destination entity --------------------------------
function normaliseSearchEntity(entity: Record<string, unknown>, lang: string = 'id'): ICD11SearchResult {
  // The search API returns destinationEntities[]
  const title = entity.title as Record<string, unknown> | string | undefined;
  const definition = entity.definition as Record<string, unknown> | string | undefined;
  const synonym = entity.synonym as Array<Record<string, unknown>> | undefined;
  const matchingPVs = entity.matchingPVs as Array<Record<string, unknown>> | undefined;

  return {
    entity_id: (entity.id as string) || (entity['@id'] as string) || null,
    icd11_code: (entity.code as string) || null,
    icd10_code: matchingPVs?.find(p => p.propertyId === 'http://id.who.int/icd/schema/mapsToICD10')?.label as string || null,
    title: typeof title === 'object' ? (title?._value as string) : (title || ''),
    definition: typeof definition === 'object' ? (definition?._value as string) : (definition || ''),
    synonyms: (synonym || []).map(s => (s._value as string) || s) as string[],
    chapter: (entity.chapter as string) || null,
    is_leaf: (entity.isLeaf as boolean) ?? true,
    lang,
  };
}

// ---- Public methods -------------------------------------------------------

/**
 * Full-text / autocomplete search.
 * Returns up to `limit` entities matching `q`.
 */
export async function search(q: string, lang: string = 'id', limit: number = 20): Promise<ICD11SearchResult[]> {
  if (!q || q.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: q.trim(),
    useFlexisearch: 'true',
    flatResults: 'true',
    highlightingEnabled: 'false',
    includeKeywordResult: 'true',
    chapterFilter: '',
    subtreesFilter: '',
    releaseId: RELEASE,
  });

  const path = `/icd/release/11/${RELEASE}/${LINEARIZATION}/search?${params.toString()}`;

  const json = await icdFetch(path, lang);

  const entities = (json.destinationEntities || []) as Array<Record<string, unknown>>;
  return entities.slice(0, limit).map(e => normaliseSearchEntity(e, lang));
}

/**
 * Get detailed entity information by WHO entity URI or numeric ID.
 */
export async function getEntity(entityId: string, lang: string = 'id'): Promise<ICD11Entity> {
  // Resolve full URI if only numeric ID given
  const uri = entityId.startsWith('http')
    ? entityId
    : `http://id.who.int/icd/entity/${entityId}`;

  // Use the linearization lookup to get the code + details
  const encoded = encodeURIComponent(uri);
  const path = `/icd/release/11/${RELEASE}/${LINEARIZATION}/lookup?foundationUri=${encoded}`;

  const json = await icdFetch(path, lang);

  const title = json.title as Record<string, unknown> | string | undefined;
  const definition = json.definition as Record<string, unknown> | string | undefined;
  const synonym = json.synonym as Array<Record<string, unknown>> | undefined;
  const inclusion = json.inclusion as Array<Record<string, unknown>> | undefined;
  const exclusion = json.exclusion as Array<Record<string, unknown>> | undefined;
  const parent = json.parent as Array<unknown> | undefined;

  return {
    entity_id: uri,
    icd11_code: (json.code as string) || null,
    title: typeof title === 'object' ? (title?._value as string) : (title || ''),
    definition: typeof definition === 'object' ? (definition?._value as string) : (definition || ''),
    synonyms: (synonym || []).map(s => (s._value as string) || s) as string[],
    inclusions: (inclusion || []).map(i => ((i as Record<string, unknown>)?.label as string) || '') as string[],
    exclusions: (exclusion || []).map(e => ((e as Record<string, unknown>)?.label as string) || '') as string[],
    parent_code: parent?.[0] ? null : null,
  };
}

/**
 * Decode / analyse a full postcoordinated ICD-11 code string.
 */
export async function getCodeInfo(code: string, lang: string = 'id'): Promise<{ icd11_code: string; title: string; definition: string }> {
  const path = `/icd/release/11/${RELEASE}/${LINEARIZATION}/${encodeURIComponent(code)}`;
  const json = await icdFetch(path, lang);

  const title = json.title as Record<string, unknown> | string | undefined;
  const definition = json.definition as Record<string, unknown> | string | undefined;

  return {
    icd11_code: (json.code as string) || code,
    title: typeof title === 'object' ? (title?._value as string) : (title || ''),
    definition: typeof definition === 'object' ? (definition?._value as string) : (definition || ''),
  };
}

/**
 * Check whether ICD-11 credentials are configured and the API is reachable.
 * Pass overrideId/overrideSecret to test without persisting the credentials.
 */
export async function testConnection(overrideId?: string, overrideSecret?: string): Promise<boolean> {
  const token = await getAccessToken(overrideId, overrideSecret);
  const res = await fetch(`${BASE_URL}/icd/release/11/${RELEASE}/${LINEARIZATION}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'API-Version': 'v2',
      'Accept': 'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) throw new Error(`ICD-11 ping failed: ${res.status}`);
  return true;
}

/**
 * Save/update the ICD-11 credentials in system_settings (from the Pengaturan UI).
 */
export async function saveConfiguration(clientId: string, clientSecret: string): Promise<void> {
  const { prisma } = await import('../config/database.js');
  await prisma.system_settings.upsert({
    where: { setting_key: 'integration_icd11' },
    update: { setting_value: JSON.stringify({ client_id: clientId, client_secret: clientSecret, enabled: true }) },
    create: { setting_key: 'integration_icd11', setting_value: JSON.stringify({ client_id: clientId, client_secret: clientSecret, enabled: true }) },
  });
  // Update in-process mutable credentials (never touch process.env from here)
  updateCredentials(clientId, clientSecret);
}

/**
 * Load credentials from DB (called at service startup).
 */
export async function loadConfiguration(): Promise<void> {
  try {
    const { prisma } = await import('../config/database.js');
    const row = await prisma.system_settings.findUnique({ where: { setting_key: 'integration_icd11' } });
    if (!row?.setting_value) return;
    const cfg = JSON.parse(row.setting_value) as { client_id?: string; client_secret?: string };
    if (cfg.client_id && cfg.client_secret) updateCredentials(cfg.client_id, cfg.client_secret);
  } catch {
    // DB not ready yet -- env vars will be used
  }
}
