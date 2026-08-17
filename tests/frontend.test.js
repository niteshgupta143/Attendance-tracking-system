import { ErrorTypes, connectWalletProvider, invokeSorobanContract } from '../stellar-service.js';
import { SorobanEventStreamer } from '../event-stream.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASSED: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAILED: ${testName}`);
    failed++;
  }
}

export async function runFrontendTests() {
  console.log('\n🧪 Running Enterprise Frontend & Soroban Service Test Suite...\n');

  // Test 1: Error Type Classification - Contract Logic Error (Type 1)
  try {
    await invokeSorobanContract({
      studentId: 'STU-DUP',
      sessionCode: 'CS401-2026',
    });
    assert(false, 'Should throw Error Type 1 for duplicate check-in');
  } catch (err) {
    assert(err.type === ErrorTypes.TYPE_1_CONTRACT_LOGIC, 'Classified Error Type 1 (CONTRACT_LOGIC_ERROR)');
  }

  // Test 2: Error Type Classification - Wallet Signature Rejection (Type 2)
  try {
    await invokeSorobanContract({
      studentId: 'STU-REJECT',
      sessionCode: 'CS401-2026',
    });
    assert(false, 'Should throw Error Type 2 for wallet signature rejection');
  } catch (err) {
    assert(err.type === ErrorTypes.TYPE_2_WALLET_AUTH, 'Classified Error Type 2 (WALLET_AUTH_ERROR)');
  }

  // Test 3: Error Type Classification - Soroban RPC Failure (Type 3)
  try {
    await invokeSorobanContract({
      studentId: 'STU-RPC',
      sessionCode: 'CS401-2026',
    });
    assert(false, 'Should throw Error Type 3 for Soroban RPC failure');
  } catch (err) {
    assert(err.type === ErrorTypes.TYPE_3_RPC_NETWORK, 'Classified Error Type 3 (RPC_NETWORK_ERROR)');
  }

  // Test 4: Successful Inter-Contract Invocation & Badge Issuance
  try {
    const res = await invokeSorobanContract({
      studentId: 'STU-9812',
      sessionCode: 'CS401-2026',
    });
    assert(res.success === true && res.hash.length === 64, 'Successful Soroban contract invocation & hash generation');
    assert(res.badgeId > 0, 'Inter-Contract Badge NFT ID generated');
  } catch (err) {
    assert(false, 'Valid check-in invocation should succeed');
  }

  // Test 5: Multi-Wallet Connector Fallback Keypair
  const walletRes = await connectWalletProvider('keypair');
  assert(walletRes.success && walletRes.publicKey.length === 56, 'Multi-wallet Keypair provider returns valid 56-char account ID');

  // Test 6: Soroban Event Streamer Subscription
  const streamer = new SorobanEventStreamer({ pollIntervalMs: 100 });
  let eventReceived = false;
  streamer.start((evt) => {
    if (evt.topic.includes('attend')) eventReceived = true;
  });
  
  await new Promise((resolve) => setTimeout(resolve, 250));
  streamer.stop();
  assert(eventReceived, 'Soroban Event Streamer receives live contract events');

  console.log(`\n=================================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`=================================================\n`);

  if (failed > 0) process.exit(1);
}
