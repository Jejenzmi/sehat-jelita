/**
 * SIMRS ZEN - BPJS VClaim Service
 * Integration with BPJS Kesehatan VClaim API
 *
 * BPJS VClaim service
 */

import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import crypto from 'crypto-js';
import { format } from 'date-fns';
import { bpjsBreaker } from '../utils/circuit-breaker.js';

export interface BPJSSignature {
  signature: string;
  timestamp: string;
}

export interface BPJSConfig {
  consumer_id: string;
  consumer_secret: string;
  user_key: string;
  environment: string;
  provider_code?: string;
  enabled?: boolean;
}

export interface BPJSSaveConfig {
  consumer_id: string;
  consumer_secret: string;
  user_key: string;
  environment: string;
  provider_code?: string;
}

export interface BPJSRequestData {
  request?: Record<string, unknown>;
  t_sep?: Record<string, unknown>;
}

export interface BPJSResponseMetaData {
  code: string;
  message: string;
}

export interface BPJSResponse {
  metaData: BPJSResponseMetaData;
  response?: unknown;
}

class BPJSVClaimService {
  public consId: string | undefined;
  public secretKey: string | undefined;
  public userKey: string | undefined;
  public baseUrl: string;

  constructor() {
    this.consId = process.env.BPJS_CONS_ID;
    this.secretKey = process.env.BPJS_SECRET_KEY;
    this.userKey = process.env.BPJS_USER_KEY;
    this.baseUrl = process.env.BPJS_BASE_URL || 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest';
  }

  /**
   * Generate BPJS Signature
   */
  generateSignature(): BPJSSignature {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${this.consId}&${timestamp}`;
    const signature = crypto.HmacSHA256(message, this.secretKey as string);
    const encodedSignature = crypto.enc.Base64.stringify(signature);

    return {
      signature: encodedSignature,
      timestamp: timestamp.toString()
    };
  }

  /**
   * Decrypt BPJS Response
   */
  decryptResponse(encryptedData: string, timestamp: string): unknown {
    const key = `${this.consId}${this.secretKey}${timestamp}`;
    const keyHash = crypto.SHA256(key);
    const iv = crypto.enc.Hex.parse(keyHash.toString().substring(0, 32));

    const decrypted = crypto.AES.decrypt(
      encryptedData,
      keyHash,
      { iv, mode: crypto.mode.CBC, padding: crypto.pad.Pkcs7 }
    );

    return JSON.parse(decrypted.toString(crypto.enc.Utf8));
  }

  /**
   * Save BPJS Configuration to database AND update service instance
   */
  async saveConfiguration(config: BPJSSaveConfig): Promise<BPJSSaveConfig> {
    const { consumer_id, consumer_secret, user_key, environment, provider_code } = config;

    const { prisma } = await import('../config/database.js');
    await prisma.system_settings.upsert({
      where: { setting_key: 'integration_bpjs' },
      update: { setting_value: JSON.stringify({ enabled: true, consumer_id, consumer_secret, user_key, environment, provider_code }) },
      create: { setting_key: 'integration_bpjs', setting_value: JSON.stringify({ enabled: true, consumer_id, consumer_secret, user_key, environment, provider_code }) }
    });

    this.consId = consumer_id;
    this.secretKey = consumer_secret;
    this.userKey = user_key;
    this.baseUrl = environment === 'production'
      ? 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest'
      : 'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev';

    return config;
  }

  /**
   * Get BPJS Configuration -- reads from DB first, falls back to env vars
   */
  async getConfiguration(): Promise<BPJSConfig | null> {
    try {
      const { prisma } = await import('../config/database.js');
      const setting = await prisma.system_settings.findUnique({
        where: { setting_key: 'integration_bpjs' }
      });
      if (setting?.setting_value) {
        const config = JSON.parse(setting.setting_value) as BPJSConfig;
        if (config.consumer_id && config.consumer_secret) return config;
      }
    } catch { /* fall through to env vars */ }

    const consId = process.env.BPJS_CONS_ID;
    const secretKey = process.env.BPJS_SECRET_KEY;
    const userKey = process.env.BPJS_USER_KEY;
    if (!consId || !secretKey) return null;
    return { consumer_id: consId, consumer_secret: secretKey, user_key: userKey, environment: 'production' };
  }

  /**
   * Make API Request to BPJS
   */
  async request(endpoint: string, method: string = 'GET', data: BPJSRequestData | null = null): Promise<unknown> {
    // Lazy-load credentials from DB if not set from env vars
    if (!this.consId || !this.secretKey) {
      const config = await this.getConfiguration();
      if (config) {
        this.consId = config.consumer_id;
        this.secretKey = config.consumer_secret;
        this.userKey = config.user_key;
        this.baseUrl = config.environment === 'production'
          ? 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest'
          : 'https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev';
      }
    }

    if (!this.consId || !this.secretKey) {
      throw new Error('Kredensial BPJS belum dikonfigurasi. Silakan isi di menu Pengaturan -> Integrasi Eksternal.');
    }

    const { signature, timestamp } = this.generateSignature();

    const headers: Record<string, string> = {
      'X-cons-id': this.consId,
      'X-timestamp': timestamp,
      'X-signature': signature,
      'user_key': this.userKey || '',
      'Content-Type': 'application/json'
    };

    try {
      const response = await bpjsBreaker.fire<AxiosResponse<BPJSResponse>>(() => axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        data,
        timeout: 15000,
      }));

      const { metaData, response: encryptedResponse } = response.data;

      if (metaData.code !== '200') {
        throw new Error(metaData.message);
      }

      // Decrypt response if encrypted
      if (encryptedResponse && typeof encryptedResponse === 'string') {
        return this.decryptResponse(encryptedResponse, timestamp);
      }

      return encryptedResponse;
    } catch (error) {
      console.error('BPJS VClaim Error:', (error as Error).message);
      throw error;
    }
  }

  // ==========================================
  // PESERTA (PARTICIPANT) ENDPOINTS
  // ==========================================

  /**
   * Get participant by NIK
   */
  async getPesertaByNIK(nik: string, tanggalSEP: string | Date): Promise<unknown> {
    const tgl = format(new Date(tanggalSEP), 'yyyy-MM-dd');
    return this.request(`/Peserta/nik/${nik}/tglSEP/${tgl}`);
  }

  /**
   * Get participant by BPJS Card Number
   */
  async getPesertaByKartu(noKartu: string, tanggalSEP: string | Date): Promise<unknown> {
    const tgl = format(new Date(tanggalSEP), 'yyyy-MM-dd');
    return this.request(`/Peserta/nokartu/${noKartu}/tglSEP/${tgl}`);
  }

  // ==========================================
  // SEP (SURAT ELIGIBILITAS PESERTA) ENDPOINTS
  // ==========================================

  /**
   * Create SEP
   */
  async createSEP(sepData: Record<string, unknown>): Promise<unknown> {
    return this.request('/SEP/2.0/insert', 'POST', { request: { t_sep: sepData } });
  }

    /**
   * Delete SEP
   */
  async deleteSEP(noSEP: string, userDelete: string): Promise<unknown> {
    return this.request('/SEP/2.0/delete', 'DELETE', {
      request: { t_sep: { noSep: noSEP, user: userDelete } }
    });
  }

  /**
   * Get SEP by Number
   */
  async getSEP(noSEP: string): Promise<unknown> {
    return this.request(`/SEP/${noSEP}`);
  }

  // ==========================================
  // REFERENSI (REFERENCE) ENDPOINTS
  // ==========================================

  /**
   * Get Diagnosa (ICD-10)
   */
  async getDiagnosa(keyword: string): Promise<unknown> {
    return this.request(`/referensi/diagnosa/${keyword}`);
  }

  /**
   * Get Prosedur (ICD-9-CM)
   */
  async getProsedur(keyword: string): Promise<unknown> {
    return this.request(`/referensi/prosedur/${keyword}`);
  }

  /**
   * Get Poli (Clinic)
   */
  async getPoli(keyword: string): Promise<unknown> {
    return this.request(`/referensi/poli/${keyword}`);
  }

  /**
   * Get Faskes (Healthcare Facility)
   */
  async getFaskes(keyword: string, jenisFaskes: string): Promise<unknown> {
    return this.request(`/referensi/faskes/${keyword}/${jenisFaskes}`);
  }

  /**
   * Get DPJP (Doctor List)
   */
  async getDPJP(jnsPelayanan: string, tanggal: string, kodePoli: string): Promise<unknown> {
    return this.request(`/referensi/dokter/pelayanan/${jnsPelayanan}/tglPelayanan/${tanggal}/Spesialis/${kodePoli}`);
  }

  // ==========================================
  // RUJUKAN (REFERRAL) ENDPOINTS
  // ==========================================

  /**
   * Get Rujukan by Number
   */
  async getRujukan(noRujukan: string): Promise<unknown> {
    return this.request(`/Rujukan/${noRujukan}`);
  }

  /**
   * Get Rujukan by BPJS Card Number
   */
  async getRujukanByKartu(noKartu: string): Promise<unknown> {
    return this.request(`/Rujukan/List/Peserta/${noKartu}`);
  }

  // ==========================================
  // KLAIM (CLAIM) ENDPOINTS
  // ==========================================

  /**
   * Get Klaim Data
   */
  async getKlaim(noSEP: string): Promise<unknown> {
    return this.request(`/monitoring/Klaim/JasaRaharja/noSEP/${noSEP}`);
  }

  /**
   * Get History Pelayanan
   */
  async getHistoryPelayanan(noKartu: string, tanggalMulai: string, tanggalAkhir: string): Promise<unknown> {
    return this.request(`/monitoring/HistoriPelayanan/noKartu/${noKartu}/tglMulai/${tanggalMulai}/tglAkhir/${tanggalAkhir}`);
  }

  // ==========================================
  // ADDITIONAL STUB METHODS
  // ==========================================

  async getRujukanByPeserta(noKartu: string): Promise<unknown> {
    return { response: { metaData: { code: '501', message: 'Endpoint not implemented' } }, data: [] };
  }

  async searchDiagnosa(keyword: string): Promise<unknown> {
    return { response: { metaData: { code: '501', message: 'Endpoint not implemented' } }, data: [] };
  }

  async searchProsedur(keyword: string): Promise<unknown> {
    return { response: { metaData: { code: '501', message: 'Endpoint not implemented' } }, data: [] };
  }

  async searchPoli(keyword: string): Promise<unknown> {
    return { response: { metaData: { code: '501', message: 'Endpoint not implemented' } }, data: [] };
  }

  async searchDokter(keyword: string): Promise<unknown> {
    return { response: { metaData: { code: '501', message: 'Endpoint not implemented' } }, data: [] };
  }

  async searchFaskes(keyword: string, jenis?: string): Promise<unknown> {
    return { response: { metaData: { code: '501', message: 'Endpoint not implemented' } }, data: [] };
  }

  async getMonitoringKunjungan(tanggal: string, jenisPelayanan?: string): Promise<unknown> {
    return { response: { metaData: { code: '501', message: 'Endpoint not implemented' } }, data: [] };
  }

  async getMonitoringKlaim(tanggal: string, jenisPelayanan?: string, status?: string): Promise<unknown> {
    return { response: { metaData: { code: '501', message: 'Endpoint not implemented' } }, data: [] };
  }

  // Fix updateSEP signature - should accept 2 parameters
  async updateSEP(noSep: string, data: Record<string, unknown>): Promise<unknown> {
    return this.request('/SEP/update', 'POST', data);
  }
}

// Export singleton instance
export const bpjsVClaim = new BPJSVClaimService();
export default BPJSVClaimService;
