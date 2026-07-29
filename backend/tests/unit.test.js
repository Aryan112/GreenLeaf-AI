/**
 * unit.test.js - Unit Tests for Individual Functions
 * Tests individual functions and modules in isolation
 */

const { asyncHandler } = require('../middleware/errorHandler');

describe('Unit Tests - Error Handler Middleware', () => {
  
  test('asyncHandler should handle successful async operations', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const handler = asyncHandler(mockFn);
    
    const req = {};
    const res = {};
    const next = jest.fn();
    
    await handler(req, res, next);
    
    expect(mockFn).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
  
  test('asyncHandler should catch errors and pass to next', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const handler = asyncHandler(mockFn);
    
    const req = {};
    const res = {};
    const next = jest.fn();
    
    await handler(req, res, next);
    
    expect(next).toHaveBeenCalledWith(error);
  });
  
});

describe('Unit Tests - Helper Functions', () => {
  
  test('Environment variables should be loaded', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
  
  test('PORT should be set for testing', () => {
    expect(process.env.PORT).toBe('4000');
  });
  
});
