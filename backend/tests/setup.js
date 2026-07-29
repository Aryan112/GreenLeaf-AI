// Jest setup file
// This runs before all tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = 4000;
process.env.USE_HTTPS = 'false';

// Increase timeout for async operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(), // Mock console.log
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};
