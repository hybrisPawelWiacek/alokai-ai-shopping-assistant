// Global setup for Jest - runs once before all tests

module.exports = async () => {
  console.log('\n🧪 Setting up Jest test environment...\n');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JEST_WORKER_ID = '1';
  
  // Mock timers for consistent testing
  process.env.TZ = 'UTC';
  
  // Performance baseline
  global.__PERFORMANCE_BASELINE__ = {
    startTime: Date.now(),
    testCount: 0,
  };
  
  // Create test database or test fixtures if needed
  // This is where you'd set up any global test data
  
  console.log('✅ Jest test environment ready\n');
};