/**
 * api.test.js - Integration Tests for API Endpoints
 * Tests API endpoints with actual HTTP requests
 */

const request = require('supertest');
const express = require('express');
const apiRoutes = require('../routes/api');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('Integration Tests - API Endpoints', () => {
  
  // Clean up data files before each test
  beforeEach(() => {
    const fs = require('fs');
    const path = require('path');
    
    // Reset newsletter.json
    fs.writeFileSync(
      path.join(__dirname, '../data/newsletter.json'),
      JSON.stringify([])
    );
    
    // Reset contacts.json
    fs.writeFileSync(
      path.join(__dirname, '../data/contacts.json'),
      JSON.stringify([])
    );
  });
  
  describe('GET /api/health', () => {
    test('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.status).toBe('healthy');
    });
    
    test('should include timestamp and version', async () => {
      const response = await request(app)
        .get('/api/health');
      
      expect(response.body.data).toHaveProperty('timestamp');
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data.version).toBe('1.0.0');
    });
  });
  
  describe('GET /api/info', () => {
    test('should return API information', async () => {
      const response = await request(app)
        .get('/api/info')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('name');
      expect(response.body.data.name).toBe('Plant Nursery API');
      expect(response.body.data).toHaveProperty('endpoints');
    });
  });
  
  describe('GET /api/redis/stats', () => {
    test('should return Redis statistics or error gracefully', async () => {
      const response = await request(app)
        .get('/api/redis/stats')
        .expect(200);
      
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('enabled');
      // Redis might not be available in test environment
      if (response.body.data.enabled) {
        expect(response.body.data).toHaveProperty('totalKeys');
      }
    });
  });
  
  describe('GET /api/categories', () => {
    test('should return product categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('categories');
      expect(Array.isArray(response.body.data.categories)).toBe(true);
    });
  });
  
  describe('POST /api/newsletter/subscribe', () => {
    test('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'invalid-email' })
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('errors');
    });
    
    test('should accept valid email', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ 
          email: 'test@example.com',
          name: 'Test User'
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('subscribed');
    });
  });
  
  describe('POST /api/contact', () => {
    test('should reject incomplete contact form', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test',
          email: 'test@example.com'
          // Missing subject and message
        })
        .expect(400);
      
      expect(response.body.success).toBe(false);
    });
    
    test('should accept valid contact form', async () => {
      const response = await request(app)
        .post('/api/contact')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Test Subject Line',
          message: 'This is a test message with enough characters to pass validation.'
        })
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });
  });
  
});

describe('Integration Tests - Error Handling', () => {
  
  test('should return 404 for non-existent endpoint', async () => {
    const response = await request(app)
      .get('/api/nonexistent')
      .expect(404);
    
    // The endpoint doesn't exist, so it won't match any route
  });
  
});
