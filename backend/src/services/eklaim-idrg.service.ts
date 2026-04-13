/**
 * SIMRS ZEN - E-Klaim IDRG Service
 * Integration with local E-Klaim server via ws.php webservice
 *
 * E-Klaim IDRG service
 */

import crypto from 'crypto';
import axios, { AxiosResponse } from 'axios';

export interface EklaimRequestData {
  metadata: { method: string };
  data: Record<string, unknown>;
}

export interface EklaimResponse {
  raw?: unknown;
  error?: string;
  [key: string]: unknown;
}

class EklaimIDRGService {
  private baseUrl: string;
  private encryptionKey: string;
  private debugMode: boolean;

  constructor() {
    this.baseUrl = process.env.EKLAIM_BASE_URL || 'http://localhost';
    this.encryptionKey = process.env.EKLAIM_ENCRYPTION_KEY || '';
    this.debugMode = process.env.EKLAIM_DEBUG === 'true';
  }

  /**
   * Encrypt request payload using AES-256-CBC
   */
  encrypt(plaintext: string): string {
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
  decrypt(ciphertext: string): EklaimResponse {
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
  async send(method: string, data: Record<string, unknown> = {}): Promise<EklaimResponse> {
    const jsonRequest = JSON.stringify({ metadata: { method }, data });
    const debugParam = this.debugMode ? '?mode=debug' : '';
    const url = `${this.baseUrl}/E-Klaim/ws.php${debugParam}`;

    let body: string;
    if (this.debugMode) {
      body = jsonRequest;
    } else {
      body = this.encrypt(jsonRequest);
    }

    console.log(`[eKlaim-IDRG] ${method} -> ${url}`);

    const response: AxiosResponse = await axios.post(url, body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
    });

    if (this.debugMode) {
      return response.data as EklaimResponse;
    }

    try {
      return this.decrypt(response.data as string);
    } catch (e) {
      console.error('[eKlaim-IDRG] Decrypt error:', (e as Error).message);
      return { raw: response.data, error: 'Failed to decrypt response' };
    }
  }
}

export default EklaimIDRGService;
