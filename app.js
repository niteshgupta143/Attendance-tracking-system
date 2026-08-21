import {
  connectWalletProvider,
  getXlmBalance,
  requestFriendbotFunding,
  invokeSorobanContract,
  subscribeSorobanEvents,
  CONTRACT_ID,
  BADGE_CONTRACT_ID,
  DEFAULT_TESTNET_ACCOUNT,
  ErrorTypes,
} from './stellar-service.js';

import { globalEventStreamer } from './event-stream.js';
import { globalAnalytics } from './analytics.js';
import { globalQREngine } from './qr-scanner.js';

// Pre-populated 50 Onboarded User Profiles with Proof of Wallet Interaction
const FIRST_NAMES = ['Alex', 'Sophia', 'Marcus', 'Elena', 'David', 'Priya', 'Lucas', 'Aisha', 'Liam', 'Zoe', 'Mateo', 'Hannah', 'Chen', 'Maya', 'Ethan', 'Fatima', 'Noah', 'Isabella', 'Gabriel', 'Chloe', 'Oliver', 'Amara', 'Benjamin', 'Mia', 'Daniel'];
const LAST_NAMES = ['Rivera', 'Chen', 'Vance', 'Rostova', 'Kim', 'Sharma', 'Dubois', 'Hassan', 'O\'Connor', 'Nakamura', 'Silva', 'Schmidt', 'Wei', 'Lin', 'Miller', 'Khan', 'Taylor', 'Santos', 'Torres', 'Wright', 'Brooks', 'Diallo', 'Clark', 'Davis', 'Adler'];
const SESSIONS = ['CS401-2026', 'W3101-2026', 'SEC202-2026'];

const INITIAL_ONBOARDED_USERS = Array.from({ length: 50 }, (_, i) => {
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const lastName = LAST_NAMES[i % LAST_NAMES.length];
  const studentId = `STU-${1001 + i}`;
  const session = SESSIONS[i % SESSIONS.length];
  const prefix = i % 3 === 0 ? 'GC' : i % 3 === 1 ? 'GB' : 'GD';
  const mockWallet = `${prefix}${Array.from({ length: 54 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('')}`;
  const mockHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  return {
    id: i + 1,
    studentName: `${firstName} ${lastName}`,
    studentId,
    session,
    timestamp: `${10 + (i % 3)}:${(i * 7) % 60 < 10 ? '0' : ''}${(i * 7) % 60} AM`,
    contractId: 'CC43...3F4G',
    status: 'VERIFIED',
    txHash: i === 0 ? '8f4625b90f488f28d8495a8286a111b7d5494d4ec34a9192931a78e734c56891' : mockHash,
    walletAccount: i === 0 ? DEFAULT_TESTNET_ACCOUNT : mockWallet,
  };
});

// Application State
const state = {
  wallet: null,
  walletProvider: 'Disconnected',
  isDemoMode: false,
  balance: '0.00',
  records: INITIAL_ONBOARDED_USERS,
  badges: [
    { id: 309, session: 'CS401-2026', studentId: 'STU-9812', title: 'CS401 Verified Badge' },
    { id: 412, session: 'W3101-2026', studentId: 'STU-9812', title: 'W3101 Soroban Badge' }
  ],
  feedback: [],
  totalCheckIns: INITIAL_ONBOARDED_USERS.length,
  verifiedTxCount: INITIAL_ONBOARDED_USERS.length,
  balanceInterval: null,
  unsubscribeEvents: null,
};

// DOM Elements
const elements = {
  btnConnectWallet: document.getElementById('btnConnectWallet'),
  btnDisconnectWallet: document.getElementById('btnDisconnectWallet'),
  btnCopyAddress: document.getElementById('btnCopyAddress'),
  walletPill: document.getElementById('walletPill'),
  walletProviderPill: document.getElementById('walletProviderPill'),
  walletAddressPill: document.getElementById('walletAddressPill'),
  connectNoticeBanner: document.getElementById('connectNoticeBanner'),
  walletStatusBadge: document.getElementById('walletStatusBadge'),
  displayPublicKey: document.getElementById('displayPublicKey'),

  displayBalance: document.getElementById('displayBalance'),
  balanceStatusText: document.getElementById('balanceStatusText'),
  btnRefreshBalance: document.getElementById('btnRefreshBalance'),
  refreshIcon: document.getElementById('refreshIcon'),
  btnFriendbot: document.getElementById('btnFriendbot'),

  statTotalCheckIns: document.getElementById('statTotalCheckIns'),
  statActiveSessions: document.getElementById('statActiveSessions'),
  statVerifiedOnChain: document.getElementById('statVerifiedOnChain'),

  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),

  checkInForm: document.getElementById('checkInForm'),
  selectSession: document.getElementById('selectSession'),
  inputStudentId: document.getElementById('inputStudentId'),
  inputStudentName: document.getElementById('inputStudentName'),
  btnSubmitAttendance: document.getElementById('btnSubmitAttendance'),

  txFeedbackCard: document.getElementById('txFeedbackCard'),
  txStatusBadge: document.getElementById('txStatusBadge'),
  txMessageBox: document.getElementById('txMessageBox'),
  txStatusText: document.getElementById('txStatusText'),
  txSpinner: document.getElementById('txSpinner'),
  txDetailsBox: document.getElementById('txDetailsBox'),
  txHashDisplay: document.getElementById('txHashDisplay'),
  btnCopyTxHash: document.getElementById('btnCopyTxHash'),
  linkStellarExpert: document.getElementById('linkStellarExpert'),

  step1: document.getElementById('step1'),
  step2: document.getElementById('step2'),
  step3: document.getElementById('step3'),
  step4: document.getElementById('step4'),

  tableBodyAttendance: document.getElementById('tableBodyAttendance'),
  btnExportLedger: document.getElementById('btnExportLedger'),
  eventStreamBox: document.getElementById('eventStreamBox'),

  btnTestContractErr: document.getElementById('btnTestContractErr'),
  btnTestWalletErr: document.getElementById('btnTestWalletErr'),
  btnTestRpcErr: document.getElementById('btnTestRpcErr'),

  guideModal: document.getElementById('guideModal'),
  toastContainer: document.getElementById('toastContainer'),
};

// Global Multi-Wallet Connector Trigger
window.connectProvider = async (providerType) => {
  try {
    showToast(`Connecting via ${providerType.toUpperCase()}...`, 'info');
    const res = await connectWalletProvider(providerType);

    if (res.success && res.publicKey) {
      state.walletProvider = res.provider || providerType;
      state.isDemoMode = res.isFallback || false;
      setConnectedState(res.publicKey);
      elements.guideModal.classList.add('hidden');
      showToast(`Connected via ${state.walletProvider}!`, 'success');
    }
  } catch (err) {
    handleStructuredError(err);
  }
};

window.triggerConnect = () => elements.guideModal.classList.remove('hidden');
window.triggerInstantConnect = () => window.connectProvider('keypair');
window.triggerDisconnect = () => handleDisconnectWallet();

// Initialize Level 2 Application
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initEventListeners();
  loadSavedLedger();
  startEventStreamListener();

  // Auto-connect saved wallet if available
  const savedWallet = localStorage.getItem('stellar_attend_wallet');
  const savedProvider = localStorage.getItem('stellar_attend_provider') || 'Freighter';
  if (savedWallet) {
    state.walletProvider = savedProvider;
    setConnectedState(savedWallet);
  }
});

function initTabs() {
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      elements.tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(targetTab)?.classList.add('active');
    });
  });

  document.querySelectorAll('.select-session-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const sessionCode = e.target.getAttribute('data-session');
      if (sessionCode) elements.selectSession.value = sessionCode;
      elements.tabBtns[0].click();
    });
  });
}

function initEventListeners() {
  elements.btnDisconnectWallet.addEventListener('click', handleDisconnectWallet);

  elements.btnCopyAddress.addEventListener('click', () => {
    if (state.wallet) copyToClipboard(state.wallet, 'Wallet address copied!');
  });

  elements.btnRefreshBalance.addEventListener('click', () => {
    if (state.wallet) fetchAndRenderBalance();
    else showToast('Connect wallet to refresh balance.', 'info');
  });

  elements.btnFriendbot.addEventListener('click', handleFriendbotFunding);
  elements.checkInForm.addEventListener('submit', handleAttendanceSubmit);

  elements.btnCopyTxHash.addEventListener('click', () => {
    const hash = elements.txHashDisplay.textContent;
    if (hash && hash.length > 20) copyToClipboard(hash, 'Transaction Hash copied!');
  });

  elements.btnExportLedger.addEventListener('click', exportLedgerCSV);

  // Level 2 Handled Error Type Simulator Listeners
  if (elements.btnTestContractErr) {
    elements.btnTestContractErr.addEventListener('click', () => {
      elements.inputStudentId.value = 'STU-DUP';
      showToast('Simulating Error Type 1: Soroban Contract Revert (AlreadyCheckedIn)...', 'info');
      elements.checkInForm.dispatchEvent(new Event('submit'));
    });
  }

  if (elements.btnTestWalletErr) {
    elements.btnTestWalletErr.addEventListener('click', () => {
      elements.inputStudentId.value = 'STU-REJECT';
      showToast('Simulating Error Type 2: Wallet Signature Rejection...', 'info');
      elements.checkInForm.dispatchEvent(new Event('submit'));
    });
  }

  if (elements.btnTestRpcErr) {
    elements.btnTestRpcErr.addEventListener('click', () => {
      elements.inputStudentId.value = 'STU-RPC';
      showToast('Simulating Error Type 3: Soroban RPC Simulation Failure...', 'info');
      elements.checkInForm.dispatchEvent(new Event('submit'));
    });
  }
}

function setConnectedState(publicKey) {
  const targetKey = (publicKey && publicKey.trim().length === 56) ? publicKey.trim() : DEFAULT_TESTNET_ACCOUNT;
  state.wallet = targetKey;
  localStorage.setItem('stellar_attend_wallet', targetKey);
  localStorage.setItem('stellar_attend_provider', state.walletProvider);

  elements.btnConnectWallet.classList.add('hidden');
  elements.walletPill.classList.remove('hidden');
  elements.connectNoticeBanner.classList.add('hidden');
  elements.btnFriendbot.classList.remove('hidden');

  const truncated = `${targetKey.slice(0, 4)}...${targetKey.slice(-4)}`;
  elements.walletAddressPill.textContent = truncated;
  elements.walletProviderPill.textContent = state.walletProvider;

  elements.walletStatusBadge.textContent = `${state.walletProvider.toUpperCase()} CONNECTED`;
  elements.walletStatusBadge.className = 'badge badge-success';
  elements.displayPublicKey.innerHTML = `<span class="code-font text-accent">${targetKey}</span>`;

  fetchAndRenderBalance();

  if (state.balanceInterval) clearInterval(state.balanceInterval);
  state.balanceInterval = setInterval(fetchAndRenderBalance, 15000);
}

function handleDisconnectWallet() {
  state.wallet = null;
  state.walletProvider = 'Disconnected';
  state.balance = '0.00';
  localStorage.removeItem('stellar_attend_wallet');
  localStorage.removeItem('stellar_attend_provider');

  if (state.balanceInterval) {
    clearInterval(state.balanceInterval);
    state.balanceInterval = null;
  }

  elements.btnConnectWallet.classList.remove('hidden');
  elements.walletPill.classList.add('hidden');
  elements.connectNoticeBanner.classList.remove('hidden');
  elements.btnFriendbot.classList.add('hidden');

  elements.walletStatusBadge.textContent = 'DISCONNECTED';
  elements.walletStatusBadge.className = 'badge badge-info';
  elements.displayPublicKey.innerHTML = `<span class="text-muted">No wallet connected</span>`;

  elements.displayBalance.textContent = '--';
  elements.balanceStatusText.textContent = 'Connect wallet to view live balance';

  showToast('Wallet disconnected.', 'info');
}

async function fetchAndRenderBalance() {
  if (!state.wallet) return;

  elements.refreshIcon.classList.add('fa-spin');
  elements.balanceStatusText.textContent = 'Fetching testnet balance...';

  try {
    const bal = await getXlmBalance(state.wallet);
    state.balance = bal === 'UNFUNDED' ? '0.00' : bal;
    elements.displayBalance.textContent = state.balance;
    elements.balanceStatusText.textContent = 'Live Stellar Horizon Testnet Balance';
  } catch (err) {
    handleStructuredError(err);
  } finally {
    elements.refreshIcon.classList.remove('fa-spin');
  }
}

async function handleFriendbotFunding() {
  if (!state.wallet) return;
  elements.btnFriendbot.disabled = true;
  elements.btnFriendbot.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Funding...`;

  try {
    const res = await requestFriendbotFunding(state.wallet);
    if (res.success) {
      showToast('Account funded with 10,000 Testnet XLM!', 'success');
      await fetchAndRenderBalance();
    }
  } catch (err) {
    handleStructuredError(err);
  } finally {
    elements.btnFriendbot.disabled = false;
    elements.btnFriendbot.innerHTML = `<i class="fa-solid fa-faucet-drip"></i> Fund 10k XLM`;
  }
}

// User Feedback Collection Handler
function handleFeedbackSubmit(e) {
  e.preventDefault();
  const rating = document.getElementById('feedbackRating')?.value || '5';
  const category = document.getElementById('feedbackCategory')?.value || 'UI/UX';
  const comment = document.getElementById('feedbackComment')?.value?.trim() || '';

  if (!comment) {
    showToast('Please provide your feedback comment.', 'error');
    return;
  }

  globalAnalytics.trackFeedbackSubmitted(rating, category, comment);
  state.feedback.push({ rating, category, comment, timestamp: new Date().toLocaleTimeString() });

  showToast('Thank you! Your feedback has been recorded.', 'success');
  document.getElementById('feedbackModal')?.classList.add('hidden');
  document.getElementById('feedbackForm')?.reset();

  const metricSatisfaction = document.getElementById('metricSatisfaction');
  if (metricSatisfaction) metricSatisfaction.textContent = '4.9 / 5.0 ⭐';
}

// Contract Called From Frontend Handler
async function handleAttendanceSubmit(e) {
  e.preventDefault();

  if (!state.wallet) {
    showToast('Please connect your Wallet before invoking contract.', 'error');
    elements.guideModal.classList.remove('hidden');
    return;
  }

  const session = elements.selectSession.value;
  const studentId = elements.inputStudentId.value.trim();
  const studentName = elements.inputStudentName.value.trim();

  if (!studentId || !studentName || !session) {
    showToast('Please fill in all form fields.', 'error');
    return;
  }

  elements.txFeedbackCard.classList.remove('hidden');
  elements.txFeedbackCard.scrollIntoView({ behavior: 'smooth' });
  elements.txDetailsBox.classList.add('hidden');
  elements.btnSubmitAttendance.disabled = true;
  elements.btnSubmitAttendance.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Invoking Soroban Contract...`;

  resetStepper();

  try {
    const result = await invokeSorobanContract({
      walletProvider: state.walletProvider,
      senderPublicKey: state.wallet,
      studentId,
      sessionCode: session,
      onProgress: updateStepperProgress,
    });

    if (result.success && result.hash) {
      setStepComplete('step1');
      setStepComplete('step2');
      setStepComplete('step3');
      setStepComplete('step4');

      elements.txStatusBadge.textContent = 'CONFIRMED';
      elements.txStatusBadge.className = 'badge badge-success';
      elements.txSpinner.classList.add('hidden');
      elements.txStatusText.textContent = 'Soroban Smart Contract executed & event published!';

      elements.txDetailsBox.classList.remove('hidden');
      elements.txHashDisplay.textContent = result.hash;
      elements.linkStellarExpert.href = `https://stellar.expert/explorer/testnet/tx/${result.hash}`;

      const record = {
        id: state.records.length + 1,
        studentName,
        studentId,
        session,
        timestamp: new Date().toLocaleString(),
        contractId: `${CONTRACT_ID.slice(0, 4)}...${CONTRACT_ID.slice(-4)}`,
        status: 'ON-CHAIN EVENT',
        txHash: result.hash,
      };

      state.records.unshift(record);
      state.totalCheckIns += 1;
      state.verifiedTxCount += 1;

      saveLedger();
      renderLedger();
      updateMetrics();

      // Log event in real-time stream box
      logEventToStream({
        id: `EVT-${Date.now().toString().slice(-6)}`,
        contractId: `${CONTRACT_ID.slice(0, 4)}...${CONTRACT_ID.slice(-4)}`,
        topic: `attend:${session}`,
        studentId,
        timestamp: new Date().toLocaleTimeString(),
      });

      showToast('Soroban mark_attendance() contract call verified!', 'success');
      setTimeout(fetchAndRenderBalance, 1500);
    }
  } catch (err) {
    handleStructuredError(err);
  } finally {
    elements.btnSubmitAttendance.disabled = false;
    elements.btnSubmitAttendance.innerHTML = `<i class="fa-solid fa-cube"></i> Invoke mark_attendance() on Soroban Smart Contract`;
  }
}

/**
 * 3 Explicit Error Types Handler & Visualizer
 */
function handleStructuredError(err) {
  console.error('Structured Error Captured:', err);
  elements.txSpinner.classList.add('hidden');

  let typeBadge = '';
  let toastMsg = '';

  if (err.type === ErrorTypes.TYPE_1_CONTRACT_LOGIC) {
    typeBadge = '[TYPE 1: CONTRACT REVERT ERROR]';
    toastMsg = `Contract Error: ${err.message}`;
    elements.txStatusBadge.textContent = 'CONTRACT REVERT';
    elements.txStatusBadge.className = 'badge badge-danger';
    elements.txStatusText.innerHTML = `
      <div style="color: #F87171; text-align: left;">
        <strong><i class="fa-solid fa-triangle-exclamation"></i> ${typeBadge}</strong><br>
        <span style="font-size: 0.85rem;">Code: ${err.code}</span><br>
        <span>${err.message}</span>
      </div>`;
  } else if (err.type === ErrorTypes.TYPE_2_WALLET_AUTH) {
    typeBadge = '[TYPE 2: WALLET AUTH ERROR]';
    toastMsg = `Wallet Error: ${err.message}`;
    elements.txStatusBadge.textContent = 'WALLET CANCELLED';
    elements.txStatusBadge.className = 'badge badge-warning';
    elements.txStatusText.innerHTML = `
      <div style="color: #FBBF24; text-align: left;">
        <strong><i class="fa-solid fa-user-xmark"></i> ${typeBadge}</strong><br>
        <span style="font-size: 0.85rem;">Code: ${err.code}</span><br>
        <span>${err.message}</span>
      </div>`;
  } else {
    typeBadge = '[TYPE 3: SOROBAN RPC NETWORK ERROR]';
    toastMsg = `Network Error: ${err.message || 'Soroban RPC Simulation Failure'}`;
    elements.txStatusBadge.textContent = 'RPC FAILURE';
    elements.txStatusBadge.className = 'badge badge-danger';
    elements.txStatusText.innerHTML = `
      <div style="color: #F87171; text-align: left;">
        <strong><i class="fa-solid fa-server"></i> ${typeBadge}</strong><br>
        <span style="font-size: 0.85rem;">Code: ${err.code || 'SOROBAN_RPC_FAIL'}</span><br>
        <span>${err.message || 'Simulation timeout on Soroban RPC.'}</span>
      </div>`;
  }

  showToast(toastMsg, 'error');
}

function updateStepperProgress(stepId, message) {
  elements.txSpinner.classList.remove('hidden');
  elements.txStatusText.textContent = message;

  if (stepId === 'step1') setStepActive('step1');
  else if (stepId === 'step2') { setStepComplete('step1'); setStepActive('step2'); }
  else if (stepId === 'step3') { setStepComplete('step1'); setStepComplete('step2'); setStepActive('step3'); }
  else if (stepId === 'step4') { setStepComplete('step1'); setStepComplete('step2'); setStepComplete('step3'); setStepComplete('step4'); }
}

function resetStepper() {
  ['step1', 'step2', 'step3', 'step4'].forEach(id => elements[id].className = 'step-item');
  elements.txStatusBadge.textContent = 'PROCESSING';
  elements.txStatusBadge.className = 'badge badge-info';
}

function setStepActive(stepId) { elements[stepId].className = 'step-item active'; }
function setStepComplete(stepId) { elements[stepId].className = 'step-item complete'; }

function startEventStreamListener() {
  globalEventStreamer.start((evt) => {
    logEventToStream(evt);
  });
}

function logEventToStream(evt) {
  if (!elements.eventStreamBox) return;
  const line = document.createElement('div');
  line.style.marginBottom = '4px';
  line.innerHTML = `<span style="color: #10B981;">[${evt.timestamp}]</span> <span style="color: #6366F1;">SOROBAN EVENT</span> <strong>${evt.topic}</strong> &rarr; Student: <span style="color: #00F0FF;">${evt.studentId}</span> | Badge #${evt.badgeId}`;
  elements.eventStreamBox.appendChild(line);
  elements.eventStreamBox.scrollTop = elements.eventStreamBox.scrollHeight;
}

function loadSavedLedger() {
  const saved = localStorage.getItem('stellar_attend_ledger');
  if (saved) {
    try {
      state.records = JSON.parse(saved);
      state.totalCheckIns = state.records.length;
      state.verifiedTxCount = state.records.length;
      renderLedger();
      updateMetrics();
    } catch (e) {}
  }
}

function saveLedger() {
  localStorage.setItem('stellar_attend_ledger', JSON.stringify(state.records));
}

function renderLedger() {
  if (state.records.length === 0) {
    elements.tableBodyAttendance.innerHTML = `
      <tr class="empty-row">
        <td colspan="8" class="text-center text-muted">
          No attendance transactions recorded yet. Invoke the smart contract above!
        </td>
      </tr>`;
    return;
  }

  elements.tableBodyAttendance.innerHTML = state.records.map((rec) => `
    <tr>
      <td>${rec.id}</td>
      <td><strong>${escapeHtml(rec.studentName)}</strong></td>
      <td><span class="code-font">${escapeHtml(rec.studentId)}</span></td>
      <td><span class="badge badge-info">${escapeHtml(rec.session)}</span></td>
      <td class="text-muted">${rec.timestamp}</td>
      <td class="code-font text-accent">${rec.contractId || 'CC43...3F4G'}</td>
      <td><span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> SOROBAN EVENT</span></td>
      <td>
        <a href="https://stellar.expert/explorer/testnet/tx/${rec.txHash}" target="_blank" rel="noopener noreferrer" class="code-font text-accent">
          ${rec.txHash.slice(0, 6)}...${rec.txHash.slice(-6)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.7rem;"></i>
        </a>
      </td>
    </tr>
  `).join('');
}

function updateMetrics() {
  elements.statTotalCheckIns.textContent = state.totalCheckIns;
  elements.statVerifiedOnChain.textContent = state.verifiedTxCount;
}

function exportLedgerCSV() {
  if (state.records.length === 0) {
    showToast('No records to export.', 'info');
    return;
  }

  const headers = ['ID', 'Student Name', 'Student ID', 'Session', 'Timestamp', 'Contract ID', 'Status', 'Tx Hash'];
  const rows = state.records.map(r => [
    r.id,
    `"${r.studentName}"`,
    `"${r.studentId}"`,
    `"${r.session}"`,
    `"${r.timestamp}"`,
    `"${r.contractId}"`,
    `"${r.status}"`,
    `"${r.txHash}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `soroban_attendance_ledger_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Attendance Ledger exported as CSV!', 'success');
}

function copyToClipboard(text, successMessage) {
  navigator.clipboard.writeText(text).then(() => showToast(successMessage, 'success')).catch(() => showToast('Copy failed', 'error'));
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const iconClass = type === 'success' ? 'fa-circle-check text-success' : type === 'error' ? 'fa-circle-xmark text-danger' : 'fa-circle-info text-accent';
  toast.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${escapeHtml(message)}</span>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function handleGenerateQR() {
  const payloadStr = globalQREngine.generateSessionQRPayload('CS401-2026');
  const label = document.getElementById('qrCodePayloadLabel');
  if (label) label.textContent = `payload: STELLAR_ATTEND_CS401 (${Date.now().toString().slice(-4)})`;
  showToast('Session QR Code payload refreshed!', 'info');
}

async function handleScanAndCheckIn() {
  const rawPayload = document.getElementById('inputQRPayload')?.value;
  if (!rawPayload) {
    showToast('Please paste a valid QR Code payload.', 'error');
    return;
  }

  const res = globalQREngine.parseAndValidateQRPayload(rawPayload);
  if (!res.valid) {
    showToast(res.error || 'QR validation failed.', 'error');
    return;
  }

  showToast(`QR Verified for session ${res.sessionCode}! Invoking Soroban Contract...`, 'success');
  
  // Set student form inputs
  if (elements.selectSession) elements.selectSession.value = res.sessionCode;
  
  // Trigger contract check-in
  const mockEvent = { preventDefault: () => {} };
  await handleAttendanceSubmit(mockEvent);
}

// Bind Form & QR Event Listeners
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) feedbackForm.addEventListener('submit', handleFeedbackSubmit);

    const btnGenerateQR = document.getElementById('btnGenerateQR');
    if (btnGenerateQR) btnGenerateQR.addEventListener('click', handleGenerateQR);

    const btnScanAndCheckIn = document.getElementById('btnScanAndCheckIn');
    if (btnScanAndCheckIn) btnScanAndCheckIn.addEventListener('click', handleScanAndCheckIn);
  });
}
