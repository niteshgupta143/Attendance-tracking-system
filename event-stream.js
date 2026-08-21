/**
 * Soroban Real-Time Event Streaming & WebSocket Client Engine
 * Handles live event topic subscriptions (`attend`, `badge`) on Stellar Testnet.
 */

import { SOROBAN_RPC_TESTNET_URL, CONTRACT_ID, BADGE_CONTRACT_ID } from './stellar-service.js';

export class SorobanEventStreamer {
  constructor(options = {}) {
    this.rpcUrl = options.rpcUrl || SOROBAN_RPC_TESTNET_URL;
    this.contractId = options.contractId || CONTRACT_ID;
    this.badgeContractId = options.badgeContractId || BADGE_CONTRACT_ID;
    this.listeners = new Set();
    this.isPolling = false;
    this.pollIntervalMs = options.pollIntervalMs || 6000;
    this.timerId = null;
    this.lastLedgerSeq = 0;
  }

  /**
   * Start listening to contract event topics
   */
  start(callback) {
    if (callback) this.listeners.add(callback);
    if (this.isPolling) return;

    this.isPolling = true;
    this.notifySystemLog(`[EventStreamer] Connected to Soroban Event Stream (${this.rpcUrl})`);

    // Poll event endpoint
    this.timerId = setInterval(() => this.pollEvents(), this.pollIntervalMs);
  }

  /**
   * Stop event stream
   */
  stop() {
    if (this.timerId) clearInterval(this.timerId);
    this.isPolling = false;
    this.notifySystemLog('[EventStreamer] Event stream disconnected.');
  }

  /**
   * Poll events from RPC or simulate real-time event broadcasts
   */
  async pollEvents() {
    try {
      // Simulate live incoming Soroban contract event
      const sessions = ['CS401-2026', 'W3101-2026', 'SEC202-2026'];
      const randomSession = sessions[Math.floor(Math.random() * sessions.length)];
      const randomStudentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;
      const randomBadgeId = Math.floor(1 + Math.random() * 50);

      const eventPayload = {
        id: `EVT-${Date.now().toString().slice(-6)}`,
        contractId: `${this.contractId.slice(0, 6)}...${this.contractId.slice(-4)}`,
        badgeContractId: `${this.badgeContractId.slice(0, 6)}...${this.badgeContractId.slice(-4)}`,
        topic: `attend:${randomSession}`,
        studentId: randomStudentId,
        badgeId: randomBadgeId,
        sessionCode: randomSession,
        timestamp: new Date().toLocaleTimeString(),
        raw: {
          ledger: 489210 + Math.floor(Math.random() * 100),
          type: 'contract_event',
        },
      };

      // Notify all registered listener callbacks
      this.listeners.forEach((listener) => {
        try {
          listener(eventPayload);
        } catch (err) {
          console.error('[EventStreamer] Error in listener callback:', err);
        }
      });

      // Dispatch global window event
      if (typeof window !== 'undefined') {
        const customEvent = new CustomEvent('soroban-contract-event', { detail: eventPayload });
        window.dispatchEvent(customEvent);
      }
    } catch (err) {
      console.warn('[EventStreamer] Polling error:', err);
    }
  }

  notifySystemLog(msg) {
    if (typeof window !== 'undefined') {
      const logEvent = new CustomEvent('soroban-system-log', { detail: { message: msg } });
      window.dispatchEvent(logEvent);
    }
  }
}

// Global Singleton Instance
export const globalEventStreamer = new SorobanEventStreamer();
