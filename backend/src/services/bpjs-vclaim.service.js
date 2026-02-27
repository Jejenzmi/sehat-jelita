/**
 * SIMRS ZEN - BPJS VClaim Service
 * Integration with BPJS Kesehatan VClaim API
 * 
 * BPJS VClaim service
 */

import axios from 'axios';
import crypto from 'crypto-js';
import { format } from 'date-fns';

class BPJSVClaimService {
  constructor() {
    this.consId = process.env.BPJS_CONS_ID;
    this.secretKey = process.env.BPJS_SECRET_KEY;
    this.userKey = process.env.BPJS_USER_KEY;
    this.baseUrl = process.env.BPJS_BASE_URL || 'https://apijkn.bpjs-kesehatan.go.id/vclaim-rest';
  }

  /**
   * Generate BPJS Signature
   */
  generateSignature() {
    const timestamp = Math.floor(Date.now() / 1000);
    const message = `${this.consId}&${timestamp}`;
    const signature = crypto.HmacSHA256(message, this.secretKey);
    const encodedSignature = crypto.enc.Base64.stringify(signature);

    return {
      signature: encodedSignature,
      timestamp: timestamp.toString()
    };
  }

  /**
   * Decrypt BPJS Response
   */
  decryptResponse(encryptedData, timestamp) {
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
   * Make API Request to BPJS
   */
  async request(endpoint, method = 'GET', data = null) {
    const { signature, timestamp } = this.generateSignature();

    const headers = {
      'X-cons-id': this.consId,
      'X-timestamp': timestamp,
      'X-signature': signature,
      'user_key': this.userKey,
      'Content-Type': 'application/json'
    };

    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers,
        data
      });

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
      console.error('BPJS VClaim Error:', error.message);
      throw error;
    }
  }

  // ==========================================
  // PESERTA (PARTICIPANT) ENDPOINTS
  // ==========================================

  /**
   * Get participant by NIK
   */
  async getPesertaByNIK(nik, tanggalSEP) {
    const tgl = format(new Date(tanggalSEP), 'yyyy-MM-dd');
    return this.request(`/Peserta/nik/${nik}/tglSEP/${tgl}`);
  }

  /**
   * Get participant by BPJS Card Number
   */
  async getPesertaByKartu(noKartu, tanggalSEP) {
    const tgl = format(new Date(tanggalSEP), 'yyyy-MM-dd');
    return this.request(`/Peserta/nokartu/${noKartu}/tglSEP/${tgl}`);
  }

  // ==========================================
  // SEP (SURAT ELIGIBILITAS PESERTA) ENDPOINTS
  // ==========================================

  /**
   * Create SEP
   */
  async createSEP(sepData) {
    return this.request('/SEP/2.0/insert', 'POST', { request: { t_sep: sepData } });
  }

  /**
   * Update SEP
   */
  async updateSEP(sepData) {
    return this.request('/SEP/2.0/update', 'PUT', { request: { t_sep: sepData } });
  }

  /**
   * Delete SEP
   */
  async deleteSEP(noSEP, userDelete) {
    return this.request('/SEP/2.0/delete', 'DELETE', {
      request: { t_sep: { noSep: noSEP, user: userDelete } }
    });
  }

  /**
   * Get SEP by Number
   */
  async getSEP(noSEP) {
    return this.request(`/SEP/${noSEP}`);
  }

  // ==========================================
  // REFERENSI (REFERENCE) ENDPOINTS
  // ==========================================

  /**
   * Get Diagnosa (ICD-10)
   */
  async getDiagnosa(keyword) {
    return this.request(`/referensi/diagnosa/${keyword}`);
  }

  /**
   * Get Prosedur (ICD-9-CM)
   */
  async getProsedur(keyword) {
    return this.request(`/referensi/prosedur/${keyword}`);
  }

  /**
   * Get Poli (Clinic)
   */
  async getPoli(keyword) {
    return this.request(`/referensi/poli/${keyword}`);
  }

  /**
   * Get Faskes (Healthcare Facility)
   */
  async getFaskes(keyword, jenisFaskes) {
    return this.request(`/referensi/faskes/${keyword}/${jenisFaskes}`);
  }

  /**
   * Get DPJP (Doctor List)
   */
  async getDPJP(jnsPelayanan, tanggal, kodePoli) {
    return this.request(`/referensi/dokter/pelayanan/${jnsPelayanan}/tglPelayanan/${tanggal}/Spesialis/${kodePoli}`);
  }

  // ==========================================
  // RUJUKAN (REFERRAL) ENDPOINTS
  // ==========================================

  /**
   * Get Rujukan by Number
   */
  async getRujukan(noRujukan) {
    return this.request(`/Rujukan/${noRujukan}`);
  }

  /**
   * Get Rujukan by BPJS Card Number
   */
  async getRujukanByKartu(noKartu) {
    return this.request(`/Rujukan/List/Peserta/${noKartu}`);
  }

  // ==========================================
  // KLAIM (CLAIM) ENDPOINTS
  // ==========================================

  /**
   * Get Klaim Data
   */
  async getKlaim(noSEP) {
    return this.request(`/monitoring/Klaim/JasaRaharja/noSEP/${noSEP}`);
  }

  /**
   * Get History Pelayanan
   */
  async getHistoryPelayanan(noKartu, tanggalMulai, tanggalAkhir) {
    return this.request(`/monitoring/HistoriPelayanan/noKartu/${noKartu}/tglMulai/${tanggalMulai}/tglAkhir/${tanggalAkhir}`);
  }
}

// Export singleton instance
export const bpjsVClaim = new BPJSVClaimService();
export default BPJSVClaimService;
