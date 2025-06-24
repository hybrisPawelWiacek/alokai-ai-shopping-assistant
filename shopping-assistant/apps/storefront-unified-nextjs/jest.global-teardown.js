// Global teardown for Jest - runs once after all tests

module.exports = async () => {
  console.log('\n🧹 Cleaning up Jest test environment...\n');
  
  // Calculate total test duration
  if (global.__PERFORMANCE_BASELINE__) {
    const duration = Date.now() - global.__PERFORMANCE_BASELINE__.startTime;
    console.log(`⏱️  Total test duration: ${(duration / 1000).toFixed(2)}s\n`);
  }
  
  // Clean up any test databases or resources
  // This is where you'd clean up any global test data
  
  // Clean up environment
  delete process.env.JEST_WORKER_ID;
  
  console.log('✅ Jest test environment cleaned up\n');
};