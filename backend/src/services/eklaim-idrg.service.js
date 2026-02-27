/**
 * SIMRS ZEN - E-Klaim IDRG Service
 * Integration with local E-Klaim server via ws.php webservice
 * 
 * Migrated from Supabase Edge Function: eklaim-idrg
 */

import crypto from 'crypto';
import axios from 'axios';

class EklaimIDRGService {
  constructor() {
    this.baseUrl = process.env.EKLAIM_BASE_URL || 'http://localhost';
    this.encryptionKey = process.env.EKLAIM_ENCRYPTION_KEY || '';
    this.debugMode = process.env.EKLAIM_DEBUG === 'true';
  }

  /**
   * Encrypt request payload using AES-256-CBC
   */
  encrypt(plaintext) {
    const keyHash = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const iv = keyHash.slice(0, 16);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyHash, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  /**
   * Decrypt response payload using AES-256-CBC
   */
  decrypt(ciphertext) {
    const cleaned = ciphertext
      .replace('----BEGIN ENCRYPTED DATA------', '')
      .replace('----END ENCRYPTED DATA------', '')
      .trim();
    const keyHash = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const iv = keyHash.slice(0, 16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', keyHash, iv);
    let decrypted = decipher.update(cleaned, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  /**
   * Send request to E-Klaim ws.php
   */
  async send(method, data = {}) {
    const jsonRequest = JSON.stringify({ metadata: { method }, data });
    const debugParam = this.debugMode ? '?mode=debug' : '';
    const url = `${this.baseUrl}/E-Klaim/ws.php${debugParam}`;

    let body;
    if (this.debugMode) {
      body = jsonRequest;
    } else {
      body = this.encrypt(jsonRequest);
    }

    console.log(`[eKlaim-IDRG] ${method} -> ${url}`);

    const response = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
    });

    if (this.debugMode) {
      return response.data;
    }

    try {
      return this.decrypt(response.data);
    } catch (e) {
      console.error('[eKlaim-IDRG] Decrypt error:', e.message);
      return { raw: response.data, error: 'Failed to decrypt response' };
    }
  }
}

export default EklaimIDRGService;
