// Set up global Jest environment
import { jest } from '@jest/globals';
global.jest = jest;

// Only run tests when NODE_ENV is set to 'test'
if (process.env.NODE_ENV !== 'test') {
  // This prevents tests from running during normal server startup
  jest.setTimeout(0);
  beforeAll(() => Promise.reject(new Error('Tests can only run with NODE_ENV=test')));
} else {
  // Set default timeout for all tests when in test environment
  jest.setTimeout(10000);
}


