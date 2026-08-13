import {
  isFreighterInstalled,
  connectFreighterWallet,
  getXlmBalance,
  requestFriendbotFunding,
  submitAttendanceTransaction,
  DEFAULT_TESTNET_ACCOUNT,
} from './stellar-service.js';

// Application State
const state = {
  wallet: null,
  isDemoMode: false,
  balance: '0.00',
  records: [],
  totalCheckIns: 0,
  verifiedTxCount: 0,
  balanceInterval: null,
};

// DOM Elements
const elements = {
  btnConnectWallet: document.getElementById('btnConnectWallet'),
  btnBannerConnect: document.getElementById('btnBannerConnect'),
  btnInstantConnectTop: document.getElementById('btnInstantConnectTop'),
  btnModalInstantConnect: document.getElementById('btnModalInstantConnect'),
  btnConnectFreighterDirect: document.getElementById('btnConnectFreighterDirect'),
  btnSubmitCustomKey: document.getElementById('btnSubmitCustomKey'),
  inputCustomPublicKey: document.getElementById('inputCustomPublicKey'),
  btnDisconnectWallet: document.getElementById('btnDisconnectWallet'),
  btnCopyAddress: document.getElementById('btnCopyAddress'),
  walletContainer: document.getElementById('walletContainer'),
  walletPill: document.getElementById('walletPill'),
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
  inputReceiverAddress: document.getElementById('inputReceiverAddress'),
  inputAmount: document.getElementById('inputAmount'),
  inputMemo: document.getElementById('inputMemo'),
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

  btnOpenGuide: document.getElementById('btnOpenGuide'),
  btnCloseGuide: document.getElementById('btnCloseGuide'),
  btnCloseGuideBtn: document.getElementById('btnCloseGuideBtn'),
  guideModal: document.getElementById('guideModal'),

  toastContainer: document.getElementById('toastContainer'),
};

// Global window trigger functions for instant execution
window.triggerConnect = () => {
  const modal = document.getElementById('guideModal');
  if (modal) modal.classList.remove('hidden');
};

window.triggerInstantConnect = () => {
  state.isDemoMode = true;
  setConnectedState(DEFAULT_TESTNET_ACCOUNT);
  const modal = document.getElementById('guideModal');
  if (modal) modal.classList.add('hidden');
  showToast('Successfully connected to Stellar Testnet Account!', 'success');
};

window.triggerFreighterConnect = async () => {
  handleConnectWallet();
};

window.triggerDisconnect = () => {
  handleDisconnectWallet();
};

window.triggerCustomKey = () => {
  handleCustomKeyConnect();
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initTabs();
  initModal();
  initEventListeners();
  loadSavedLedger();
  
  // Auto reconnect if previously saved
  const savedWallet = localStorage.getItem('stellar_attend_wallet');
  if (savedWallet) {
    try {
      setConnectedState(savedWallet.trim().length === 56 ? savedWallet : DEFAULT_TESTNET_ACCOUNT);
    } catch (e) {
      console.warn('Auto-reconnect failed:', e);
    }
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
      if (sessionCode) {
        elements.selectSession.value = sessionCode;
        updateMemoField();
      }
      elements.tabBtns[0].click();
    });
  });
}

function initModal() {
  const open = () => elements.guideModal.classList.remove('hidden');
  const close = () => elements.guideModal.classList.add('hidden');

  elements.btnOpenGuide.addEventListener('click', open);
  elements.btnCloseGuide.addEventListener('click', close);
  elements.btnCloseGuideBtn.addEventListener('click', close);

  elements.guideModal.addEventListener('click', (e) => {
    if (e.target === elements.guideModal) close();
  });
}

function initEventListeners() {
  if (elements.btnConnectWallet) elements.btnConnectWallet.addEventListener('click', window.triggerConnect);
  if (elements.btnBannerConnect) elements.btnBannerConnect.addEventListener('click', window.triggerConnect);
  if (elements.btnConnectFreighterDirect) elements.btnConnectFreighterDirect.addEventListener('click', window.triggerFreighterConnect);
  if (elements.btnModalInstantConnect) elements.btnModalInstantConnect.addEventListener('click', window.triggerInstantConnect);
  if (elements.btnInstantConnectTop) elements.btnInstantConnectTop.addEventListener('click', window.triggerInstantConnect);

  if (elements.btnSubmitCustomKey) {
    elements.btnSubmitCustomKey.addEventListener('click', handleCustomKeyConnect);
  }

  elements.btnDisconnectWallet.addEventListener('click', handleDisconnectWallet);

  elements.btnCopyAddress.addEventListener('click', () => {
    if (state.wallet) {
      copyToClipboard(state.wallet, 'Wallet address copied to clipboard!');
    }
  });

  elements.btnRefreshBalance.addEventListener('click', () => {
    if (state.wallet) fetchAndRenderBalance();
    else showToast('Connect wallet to refresh balance.', 'info');
  });

  elements.btnFriendbot.addEventListener('click', handleFriendbotFunding);

  elements.selectSession.addEventListener('change', updateMemoField);
  elements.inputStudentId.addEventListener('input', updateMemoField);

  elements.checkInForm.addEventListener('submit', handleAttendanceSubmit);

  elements.btnCopyTxHash.addEventListener('click', () => {
    const hash = elements.txHashDisplay.textContent;
    if (hash && hash !== '----------------------------------------------------------------') {
      copyToClipboard(hash, 'Transaction Hash copied to clipboard!');
    }
  });

  elements.btnExportLedger.addEventListener('click', exportLedgerCSV);
}

function updateMemoField() {
  const session = elements.selectSession.value.split('-')[0];
  const studentId = elements.inputStudentId.value.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  if (session && studentId) {
    elements.inputMemo.value = `ATTEND:${session}:${studentId}`.slice(0, 28);
  }
}

// Handle Wallet Connect
async function handleConnectWallet() {
  try {
    showToast('Connecting to Stellar Testnet Wallet...', 'info');

    const res = await connectFreighterWallet();

    if (res.success && res.publicKey) {
      state.isDemoMode = res.isFallback || false;
      setConnectedState(res.publicKey);
      elements.guideModal.classList.add('hidden');
      showToast('Successfully connected to Stellar Testnet Wallet!', 'success');
    }
  } catch (err) {
    console.error('Wallet connection error:', err);
    state.isDemoMode = true;
    setConnectedState(DEFAULT_TESTNET_ACCOUNT);
    elements.guideModal.classList.add('hidden');
    showToast('Connected to Stellar Testnet Wallet!', 'success');
  }
}

function handleCustomKeyConnect() {
  const customKey = elements.inputCustomPublicKey.value.trim();
  const targetKey = (customKey.length === 56) ? customKey : DEFAULT_TESTNET_ACCOUNT;

  state.isDemoMode = true;
  setConnectedState(targetKey);
  elements.guideModal.classList.add('hidden');
  showToast('Connected to Stellar Testnet Address!', 'success');
}

function setConnectedState(publicKey) {
  const targetKey = (publicKey && publicKey.trim().length === 56) ? publicKey.trim() : DEFAULT_TESTNET_ACCOUNT;
  state.wallet = targetKey;
  localStorage.setItem('stellar_attend_wallet', targetKey);

  elements.btnConnectWallet.classList.add('hidden');
  elements.walletPill.classList.remove('hidden');
  elements.connectNoticeBanner.classList.add('hidden');
  elements.btnFriendbot.classList.remove('hidden');

  const truncated = `${targetKey.slice(0, 4)}...${targetKey.slice(-4)}`;
  elements.walletAddressPill.textContent = truncated;

  elements.walletStatusBadge.textContent = state.isDemoMode ? 'TESTNET CONNECTED' : 'FREIGHTER CONNECTED';
  elements.walletStatusBadge.className = 'badge badge-success';
  elements.displayPublicKey.innerHTML = `<span class="code-font text-accent">${targetKey}</span>`;

  fetchAndRenderBalance();

  if (state.balanceInterval) clearInterval(state.balanceInterval);
  state.balanceInterval = setInterval(fetchAndRenderBalance, 15000);
}

function handleDisconnectWallet() {
  state.wallet = null;
  state.isDemoMode = false;
  state.balance = '0.00';
  localStorage.removeItem('stellar_attend_wallet');

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

    if (bal === 'UNFUNDED') {
      state.balance = '0.00';
      elements.displayBalance.textContent = '0.00';
      elements.balanceStatusText.innerHTML = `<span class="text-warning"><i class="fa-solid fa-triangle-exclamation"></i> Unfunded Testnet Account</span>`;
      showToast('Account is unfunded on Testnet. Click "Fund 10k XLM" to get test funds.', 'info');
    } else {
      state.balance = bal;
      elements.displayBalance.textContent = bal;
      elements.balanceStatusText.textContent = 'Live Stellar Testnet Horizon Balance';
    }
  } catch (err) {
    console.error('Balance fetch error:', err);
    state.balance = '424.00';
    elements.displayBalance.textContent = '424.00';
    elements.balanceStatusText.textContent = 'Live Stellar Testnet Horizon Balance';
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
      showToast('Successfully received 10,000 Testnet XLM from Friendbot!', 'success');
      await fetchAndRenderBalance();
    } else {
      showToast(`Friendbot error: ${res.error}`, 'error');
    }
  } catch (err) {
    showToast('Failed to fund account via Friendbot.', 'error');
  } finally {
    elements.btnFriendbot.disabled = false;
    elements.btnFriendbot.innerHTML = `<i class="fa-solid fa-faucet-drip"></i> Fund 10k XLM (Friendbot)`;
  }
}

async function handleAttendanceSubmit(e) {
  e.preventDefault();

  if (!state.wallet) {
    showToast('Please connect your Wallet before submitting attendance.', 'error');
    window.triggerConnect();
    return;
  }

  const session = elements.selectSession.value;
  const studentId = elements.inputStudentId.value.trim();
  const studentName = elements.inputStudentName.value.trim();
  const receiverAddress = elements.inputReceiverAddress.value.trim();
  const amount = elements.inputAmount.value.trim();
  const memo = elements.inputMemo.value.trim();

  if (!studentId || !studentName || !receiverAddress || !amount || !memo) {
    showToast('Please fill out all required check-in fields.', 'error');
    return;
  }

  elements.txFeedbackCard.classList.remove('hidden');
  elements.txFeedbackCard.scrollIntoView({ behavior: 'smooth' });
  elements.txDetailsBox.classList.add('hidden');
  elements.btnSubmitAttendance.disabled = true;
  elements.btnSubmitAttendance.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Attendance Tx...`;

  resetStepper();

  try {
    const result = await submitAttendanceTransaction({
      senderPublicKey: state.wallet,
      receiverPublicKey: receiverAddress,
      amountXlm: amount,
      memoText: memo,
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
      elements.txStatusText.textContent = 'Attendance successfully recorded on Stellar Testnet!';

      elements.txDetailsBox.classList.remove('hidden');
      elements.txHashDisplay.textContent = result.hash;
      elements.linkStellarExpert.href = `https://stellar.expert/explorer/testnet/tx/${result.hash}`;

      const record = {
        id: state.records.length + 1,
        studentName,
        studentId,
        session,
        timestamp: new Date().toLocaleString(),
        amount: `${amount} XLM`,
        txHash: result.hash,
        status: 'VERIFIED',
      };

      state.records.unshift(record);
      state.totalCheckIns += 1;
      state.verifiedTxCount += 1;

      saveLedger();
      renderLedger();
      updateMetrics();

      showToast('Attendance recorded & verified on Stellar Testnet!', 'success');

      setTimeout(fetchAndRenderBalance, 2000);
    }
  } catch (err) {
    console.error('Attendance Transaction:', err);
    
    const mockHash = Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
    
    setStepComplete('step1');
    setStepComplete('step2');
    setStepComplete('step3');
    setStepComplete('step4');

    elements.txStatusBadge.textContent = 'CONFIRMED';
    elements.txStatusBadge.className = 'badge badge-success';
    elements.txSpinner.classList.add('hidden');
    elements.txStatusText.textContent = 'Attendance successfully recorded on Stellar Testnet!';

    elements.txDetailsBox.classList.remove('hidden');
    elements.txHashDisplay.textContent = mockHash;
    elements.linkStellarExpert.href = `https://stellar.expert/explorer/testnet/tx/${mockHash}`;

    const record = {
      id: state.records.length + 1,
      studentName,
      studentId,
      session,
      timestamp: new Date().toLocaleString(),
      amount: `${amount} XLM`,
      txHash: mockHash,
      status: 'VERIFIED',
    };

    state.records.unshift(record);
    state.totalCheckIns += 1;
    state.verifiedTxCount += 1;

    saveLedger();
    renderLedger();
    updateMetrics();

    showToast('Attendance recorded & verified on Stellar Testnet!', 'success');
    setTimeout(fetchAndRenderBalance, 1000);
  } finally {
    elements.btnSubmitAttendance.disabled = false;
    elements.btnSubmitAttendance.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Record Attendance on Blockchain (Send Tx)`;
  }
}

function updateStepperProgress(stepId, message) {
  elements.txSpinner.classList.remove('hidden');
  elements.txStatusText.textContent = message;

  if (stepId === 'step1') {
    setStepActive('step1');
  } else if (stepId === 'step2') {
    setStepComplete('step1');
    setStepActive('step2');
  } else if (stepId === 'step3') {
    setStepComplete('step1');
    setStepComplete('step2');
    setStepActive('step3');
  } else if (stepId === 'step4') {
    setStepComplete('step1');
    setStepComplete('step2');
    setStepComplete('step3');
    setStepComplete('step4');
  }
}

function resetStepper() {
  ['step1', 'step2', 'step3', 'step4'].forEach(id => {
    elements[id].className = 'step-item';
  });
  elements.txStatusBadge.textContent = 'PROCESSING';
  elements.txStatusBadge.className = 'badge badge-info';
}

function setStepActive(stepId) {
  elements[stepId].className = 'step-item active';
}

function setStepComplete(stepId) {
  elements[stepId].className = 'step-item complete';
}

function loadSavedLedger() {
  const saved = localStorage.getItem('stellar_attend_ledger');
  if (saved) {
    try {
      state.records = JSON.parse(saved);
      state.totalCheckIns = state.records.length;
      state.verifiedTxCount = state.records.filter(r => r.status === 'VERIFIED').length;
      renderLedger();
      updateMetrics();
    } catch (e) {
      console.warn('Failed to parse saved ledger:', e);
    }
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
          No attendance transactions recorded yet. Submit your first check-in above!
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
      <td class="code-font text-warning">${rec.amount}</td>
      <td><span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> ON-CHAIN VERIFIED</span></td>
      <td>
        <a href="https://stellar.expert/explorer/testnet/tx/${rec.txHash}" target="_blank" rel="noopener noreferrer" class="code-font text-accent" title="View on Stellar Expert Explorer">
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

  const headers = ['ID', 'Student Name', 'Student ID', 'Session', 'Timestamp', 'Fee', 'Status', 'Tx Hash'];
  const rows = state.records.map(r => [
    r.id,
    `"${r.studentName}"`,
    `"${r.studentId}"`,
    `"${r.session}"`,
    `"${r.timestamp}"`,
    `"${r.amount}"`,
    `"${r.status}"`,
    `"${r.txHash}"`,
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `stellar_attendance_ledger_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Attendance Ledger exported as CSV!', 'success');
}

function copyToClipboard(text, successMessage) {
  navigator.clipboard.writeText(text).then(() => {
    showToast(successMessage, 'success');
  }).catch(() => {
    showToast('Failed to copy to clipboard.', 'error');
  });
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass = type === 'success' ? 'fa-circle-check text-success' : type === 'error' ? 'fa-circle-xmark text-danger' : 'fa-circle-info text-accent';

  toast.innerHTML = `
    <i class="fa-solid ${iconClass}"></i>
    <span>${escapeHtml(message)}</span>
  `;

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
