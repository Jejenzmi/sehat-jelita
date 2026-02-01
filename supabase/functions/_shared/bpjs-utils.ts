// BPJS Utilities - Signature Generation & Response Decryption
// Sesuai dokumentasi BPJS Kesehatan

import { encode as base64Encode, decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

export interface BPJSConfig {
  consumer_id: string;
  consumer_secret: string;
  user_key: string;
  provider_code: string;
  environment: string;
}

/**
 * Generate BPJS Signature
 * Pattern: HMAC-SHA256(consumerID + "&" + timestamp, consumerSecret)
 * Result: Base64 encoded
 */
export async function generateBPJSSignature(
  consumerId: string,
  consumerSecret: string,
  timestamp: string
): Promise<string> {
  const encoder = new TextEncoder();
  
  // Message = consumerID&timestamp
  const message = `${consumerId}&${timestamp}`;
  
  // Create HMAC-SHA256 key
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(consumerSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Sign the message
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(message)
  );
  
  // Return Base64 encoded signature
  return base64Encode(signature);
}

/**
 * Get BPJS HTTP Headers
 */
export async function getBPJSHeaders(config: BPJSConfig): Promise<Record<string, string>> {
  // Generate Unix timestamp (UTC)
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Generate signature
  const signature = await generateBPJSSignature(
    config.consumer_id,
    config.consumer_secret,
    timestamp
  );
  
  return {
    "Content-Type": "application/json",
    "X-cons-id": config.consumer_id,
    "X-timestamp": timestamp,
    "X-signature": signature,
    "user_key": config.user_key,
  };
}

/**
 * Generate AES-256 key from string
 * Key = SHA-256(consumerID + consumerSecret + timestamp)
 */
async function generateAESKey(consId: string, consSecret: string, timestamp: string): Promise<{ key: CryptoKey; iv: Uint8Array }> {
  const encoder = new TextEncoder();
  const keyString = `${consId}${consSecret}${timestamp}`;
  
  // Hash the key string with SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(keyString));
  const hashArray = new Uint8Array(hashBuffer);
  
  // IV is first 16 bytes of hash
  const iv = hashArray.slice(0, 16);
  
  // Import key for AES-CBC
  const key = await crypto.subtle.importKey(
    "raw",
    hashArray,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );
  
  return { key, iv };
}

/**
 * Decrypt BPJS Response
 * Step 1: AES-256 CBC decrypt
 * Step 2: LZ-String decompress
 */
export async function decryptBPJSResponse(
  encryptedData: string,
  consId: string,
  consSecret: string,
  timestamp: string
): Promise<string> {
  try {
    // Generate AES key
    const { key, iv } = await generateAESKey(consId, consSecret, timestamp);
    
    // Decode Base64
    const cipherTextUint8 = base64Decode(encryptedData);
    
    // Create a proper ArrayBuffer copy
    const cipherTextBuffer = new ArrayBuffer(cipherTextUint8.length);
    new Uint8Array(cipherTextBuffer).set(cipherTextUint8);
    
    // Create proper IV ArrayBuffer
    const ivBuffer = new ArrayBuffer(iv.length);
    new Uint8Array(ivBuffer).set(iv);
    
    // Decrypt AES-256-CBC
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv: ivBuffer },
      key,
      cipherTextBuffer
    );
    
    // Convert to string
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decrypted);
    
    // Decompress LZ-String (decompressFromEncodedURIComponent)
    // Note: For full LZ-String support, you may need to implement or import lz-string
    // For now, try to decode as URI component
    try {
      return decompressFromEncodedURIComponent(decryptedString);
    } catch {
      return decryptedString;
    }
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt BPJS response");
  }
}

/**
 * LZ-String decompressFromEncodedURIComponent implementation
 * Simplified version - for production use full lz-string library
 */
function decompressFromEncodedURIComponent(input: string): string {
  if (input === null || input === "") return "";
  
  try {
    // Try to decode as standard URI component first
    const decoded = decodeURIComponent(input);
    return decoded;
  } catch {
    // If that fails, return as-is (might already be plain text)
    return input;
  }
}

/**
 * Get Base URL based on environment
 */
export function getBPJSBaseUrl(environment: string, service: string): string {
  const isDev = environment === "development";
  
  const urls: Record<string, { dev: string; prod: string }> = {
    vclaim: {
      dev: "https://apijkn-dev.bpjs-kesehatan.go.id/vclaim-rest-dev",
      prod: "https://apijkn.bpjs-kesehatan.go.id/vclaim-rest",
    },
    antreanrs: {
      dev: "https://apijkn-dev.bpjs-kesehatan.go.id/antreanrs_dev",
      prod: "https://apijkn.bpjs-kesehatan.go.id/antreanrs",
    },
    icare: {
      dev: "https://apijkn-dev.bpjs-kesehatan.go.id/ihs_dev",
      prod: "https://apijkn.bpjs-kesehatan.go.id/ihs",
    },
    pcare: {
      dev: "https://apijkn-dev.bpjs-kesehatan.go.id/pcare-rest-dev",
      prod: "https://apijkn.bpjs-kesehatan.go.id/pcare-rest",
    },
    apotek: {
      dev: "https://apijkn-dev.bpjs-kesehatan.go.id/apotek-rest-dev",
      prod: "https://apijkn.bpjs-kesehatan.go.id/apotek-rest",
    },
    erekammedis: {
      dev: "https://apijkn-dev.bpjs-kesehatan.go.id/erekammedis_dev",
      prod: "https://apijkn.bpjs-kesehatan.go.id/erekammedis",
    },
  };
  
  const serviceUrls = urls[service];
  if (!serviceUrls) {
    throw new Error(`Unknown BPJS service: ${service}`);
  }
  
  return isDev ? serviceUrls.dev : serviceUrls.prod;
}
