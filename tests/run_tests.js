import { runFrontendTests } from './frontend.test.js';

runFrontendTests().catch((err) => {
  console.error('Test Suite Exception:', err);
  process.exit(1);
});
