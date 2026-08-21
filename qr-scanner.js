/**
 * StellarAttend Contactless QR Code Generator & Verification Engine
 */

import { CONTRACT_ID } from './stellar-service.js';

export class QRAttendanceEngine {
  constructor() {
    this.activeQrPayload = null;
  }

  /**
   * Generate QR Code Payload for a Class Session
   */
  generateSessionQRPayload(sessionCode, teacherAddress = 'GC32...3F4G') {
    const payload = {
      type: 'STELLAR_ATTEND_QR',
      version: '2.0',
      sessionCode,
      contractId: CONTRACT_ID,
      teacherAddress,
      timestamp: Date.now(),
      nonce: Math.floor(Math.random() * 100000),
    };
    this.activeQrPayload = payload;
    return JSON.stringify(payload);
  }

  /**
   * Validate and Parse Scanned QR Code String
   */
  parseAndValidateQRPayload(qrJsonString) {
    try {
      const data = JSON.parse(qrJsonString);
      if (data.type !== 'STELLAR_ATTEND_QR' || !data.sessionCode) {
        return { valid: false, error: 'Invalid QR Code payload structure.' };
      }
      
      // Check payload freshness (QR valid for 30 minutes)
      const ageMs = Date.now() - (data.timestamp || 0);
      if (ageMs > 30 * 60 * 1000) {
        return { valid: false, error: 'Scanned QR Code has expired. Request a new session QR code.' };
      }

      return {
        valid: true,
        sessionCode: data.sessionCode,
        contractId: data.contractId || CONTRACT_ID,
        timestamp: data.timestamp,
      };
    } catch (e) {
      return { valid: false, error: 'Failed to decode QR Code format.' };
    }
  }
}

export const globalQREngine = new QRAttendanceEngine();
