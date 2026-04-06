/**
 * SIMRS ZEN — WHO ICD-11 API Service
 *
 * Authentication : OAuth 2 client_credentials
 * Token endpoint : https://icdaccessmanagement.who.int/connect/token
 * API base       : https://id.who.int
 * Docs           : https://icd.who.int/docs/icd-api/
 *
 * Provides:
 *  - search(q, lang)        → autocomplete / fulltext search
 *  - getEntity(entityId)    → fetch entity details by WHO URI/ID
 *  - getCodeInfo(code)      → decode an ICD-11 code string
 *  - lookupByCode(code)     → find linearization entity by alphanumeric code
 *
 * Token is cached in-process for (expiry − 60 s) to minimise round-trips.
 */

const TOKEN_URL    = process.env.ICD11_TOKEN_URL   || 'https://icdaccessmanagement.who.int/connect/token';
const BASE_URL     = process.env.ICD11_BASE_URL    || 'https://id.who.int';
const LINEARIZATION= process.env.ICD11_LINEARIZATION || 'mms';
const RELEASE      = process.env.ICD11_RELEASE      || '2024-01';

// Mutable credentials — updated by saveConfiguration() and loadConfiguration()
// Must NOT be const: process.env is evaluated at module-load time, making
// const values frozen. Use let so updateCredentials() can change them.
let _clientId     = process.env.ICD11_CLIENT_ID     || '';
let _clientSecret = process.env.ICD11_CLIENT_SECRET || '';

// ---- Token cache ----------------------------------------------------------
export let _cachedToken   = null;
export let _tokenExpiresAt= 0;

/** Replace in-process credentials and reset token cache. */
export function updateCredentials(clientId, clientSecret) {
  _clientId     = clientId;
  _clientSecret = clientSecret;
  _cachedToken    = null;
  _tokenExpiresAt = 0;
}

async function getAccessToken(overrideId, overrideSecret) {
  const id     = overrideId     || _clientId;
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

  const json = await res.json();
  // Only cache when using default credentials
  if (!overrideId) {
    _cachedToken    = json.access_token;
    _tokenExpiresAt = Date.now() + ((json.expires_in - 60) * 1000);
  }
  return json.access_token;
}

// ---- Core fetch helper ----------------------------------------------------
async function icdFetch(path, lang = 'id') {
  const token = await getAccessToken();
  const url   = path.startsWith('http') ? path : `${BASE_URL}${path}`;

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'API-Version':   'v2',
      'Accept':        'application/json',
      'Accept-Language': lang,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ICD-11 API error: ${res.status} ${text}`);
  }
  return res.json();
}

// ---- Normalise a search destination entity --------------------------------
function normaliseSearchEntity(entity, lang = 'id') {
  // The search API returns destinationEntities[]
  return {
    entity_id:    entity.id        || entity['@id'] || null,
    icd11_code:   entity.code      || null,
    icd10_code:   entity.matchingPVs?.find(p => p.propertyId === 'http://id.who.int/icd/schema/mapsToICD10')?.label || null,
    title:        entity.title?._value || entity.title || '',
    definition:   entity.definition?._value || '',
    synonyms:     (entity.synonym || []).map(s => s._value || s),
    chapter:      entity.chapter   || null,
    is_leaf:      entity.isLeaf    ?? true,
    lang,
  };
}

// ---- Public methods -------------------------------------------------------

/**
 * Full-text / autocomplete search.
 * Returns up to `limit` entities matching `q`.
 *
 * @param {string} q      Search term (min 2 chars recommended)
 * @param {string} lang   'id' (Indonesian) | 'en' (English)
 * @param {number} limit  Max results (default 20)
 */
export async function search(q, lang = 'id', limit = 20) {
  if (!q || q.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: q.trim(),
    useFlexisearch:  'true',
    flatResults:     'true',
    highlightingEnabled: 'false',
    includeKeywordResult: 'true',
    chapterFilter:   '',
    subtreesFilter:  '',
    releaseId:       RELEASE,
  });

  const path = `/icd/release/11/${RELEASE}/${LINEARIZATION}/search?${params.toString()}`;

  const json = await icdFetch(path, lang);

  const entities = json.destinationEntities || [];
  return entities.slice(0, limit).map(e => normaliseSearchEntity(e, lang));
}

/**
 * Get detailed entity information by WHO entity URI or numeric ID.
 *
 * @param {string} entityId  e.g. 'http://id.who.int/icd/entity/1384900665' or just '1384900665'
 */
export async function getEntity(entityId, lang = 'id') {
  // Resolve full URI if only numeric ID given
  const uri = entityId.startsWith('http')
    ? entityId
    : `http://id.who.int/icd/entity/${entityId}`;

  // Use the linearization lookup to get the code + details
  const encoded = encodeURIComponent(uri);
  const path    = `/icd/release/11/${RELEASE}/${LINEARIZATION}/lookup?foundationUri=${encoded}`;

  const json = await icdFetch(path, lang);

  return {
    entity_id:   uri,
    icd11_code:  json.code      || null,
    title:       json.title?._value || json.title || '',
    definition:  json.definition?._value || '',
    synonyms:    (json.synonym || []).map(s => s._value || s),
    inclusions:  (json.inclusion || []).map(i => i.label?._value || i.label || ''),
    exclusions:  (json.exclusion || []).map(e => e.label?._value || e.label || ''),
    parent_code: json.parent?.[0] ? null : null,
  };
}

/**
 * Decode / analyse a full postcoordinated ICD-11 code string.
 */
export async function getCodeInfo(code, lang = 'id') {
  const path = `/icd/release/11/${RELEASE}/${LINEARIZATION}/${encodeURIComponent(code)}`;
  const json = await icdFetch(path, lang);
  return {
    icd11_code: json.code      || code,
    title:      json.title?._value || json.title || '',
    definition: json.definition?._value || '',
  };
}

/**
 * Check whether ICD-11 credentials are configured and the API is reachable.
 * Pass overrideId/overrideSecret to test without persisting the credentials.
 */
export async function testConnection(overrideId, overrideSecret) {
  const token = await getAccessToken(overrideId, overrideSecret);
  const res = await fetch(`${BASE_URL}/icd/release/11/${RELEASE}/${LINEARIZATION}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'API-Version':   'v2',
      'Accept':        'application/json',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) throw new Error(`ICD-11 ping failed: ${res.status}`);
  return true;
}

/**
 * Save/update the ICD-11 credentials in system_settings (from the Pengaturan UI).
 */
export async function saveConfiguration(clientId, clientSecret) {
  const { prisma } = await import('../config/database.js');
  await prisma.system_settings.upsert({
    where:  { setting_key: 'integration_icd11' },
    update: { setting_value: JSON.stringify({ client_id: clientId, client_secret: clientSecret, enabled: true }) },
    create: { setting_key: 'integration_icd11', setting_value: JSON.stringify({ client_id: clientId, client_secret: clientSecret, enabled: true }) },
  });
  // Update in-process mutable credentials (never touch process.env from here)
  updateCredentials(clientId, clientSecret);
}

/**
 * Load credentials from DB (called at service startup).
 */
export async function loadConfiguration() {
  try {
    const { prisma } = await import('../config/database.js');
    const row = await prisma.system_settings.findUnique({ where: { setting_key: 'integration_icd11' } });
    if (!row?.setting_value) return;
    const cfg = JSON.parse(row.setting_value);
    if (cfg.client_id && cfg.client_secret) updateCredentials(cfg.client_id, cfg.client_secret);
  } catch {
    // DB not ready yet — env vars will be used
  }
}
