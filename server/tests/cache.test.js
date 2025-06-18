import request from 'supertest';
import { app, server } from '../server.js';
import redisClient from '../services/redis.service.js';

describe('Redis Caching Tests', () => {
  // Wait for caching operations to complete
  const waitForCache = async () => new Promise(resolve => setTimeout(resolve, 100));
  
  // Close connections after tests
  afterAll(async () => {
    await redisClient.quit();
    await server.close();
  });

  // Test products endpoint caching
  test('Cached product endpoint returns faster on second call', async () => {
    // Clear any existing cache first
    await redisClient.flushall();
    
    // First call (no cache)
    const startNoCache = Date.now();
    const firstResponse = await request(app).get('/api/v1/products');
    const timeNoCache = Date.now() - startNoCache;
    
    // Wait for cache to be set
    await waitForCache();
    
    // Second call (with cache)
    const startWithCache = Date.now();
    const secondResponse = await request(app).get('/api/v1/products');
    const timeWithCache = Date.now() - startWithCache;

    // Both calls should return 200
    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    
    // The second call should be faster than the first
    expect(timeWithCache).toBeLessThan(timeNoCache);
    
    // Content should be identical
    expect(JSON.stringify(secondResponse.body)).toEqual(JSON.stringify(firstResponse.body));
  });

  // Test cache invalidation after product update
  test('Cache is invalidated after product update', async () => {
    // First get all products and save the response
    const initialResponse = await request(app).get('/api/v1/products');
    expect(initialResponse.status).toBe(200);
    
    // Create a test user and login
    const loginResponse = await request(app)
      .post('/api/v1/users/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    
    const token = loginResponse.body.token;
    
    // If there are products, try to update one
    if (initialResponse.body && initialResponse.body.length > 0) {
      const productToUpdate = initialResponse.body[0];
      
      // Update the product
      await request(app)
        .put(`/api/v1/products/${productToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ 
          name: `${productToUpdate.name} - Updated`, 
          price: productToUpdate.price + 1 
        });
      
      // Wait for cache invalidation
      await waitForCache();
      
      // Get products again
      const afterUpdateResponse = await request(app).get('/api/v1/products');
      expect(afterUpdateResponse.status).toBe(200);
      
      // Response should be different after cache invalidation
      expect(JSON.stringify(afterUpdateResponse.body)).not.toEqual(JSON.stringify(initialResponse.body));
    }
  });
}); 