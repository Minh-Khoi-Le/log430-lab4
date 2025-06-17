/**
 * Basic Tests
 * 
 * This file contains basic tests to verify that the Jest configuration is working correctly.
 */

import { jest } from '@jest/globals';

describe('Basic Tests', () => {
  // Test that Jest is working
  test('Jest should be working', () => {
    expect(1 + 1).toBe(2);
  });
  
  // Test async functionality
  test('Async functions should work', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
  
  // Test mocking functionality
  test('Mocking should work', () => {
    const mockFn = jest.fn().mockReturnValue(true);
    expect(mockFn()).toBe(true);
    expect(mockFn).toHaveBeenCalled();
  });
}); 