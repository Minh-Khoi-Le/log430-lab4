import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../index.js';

const prisma = new PrismaClient();

// Test data
const testProduct = {
  name: "Stock Test Product",
  price: 29.99,
  description: "A product for testing stock operations"
};

const testStore = {
  nom: "Test Store",
  adresse: "123 Test Street"
};

let testProductId;
let testStoreId;
let authToken;

// Generate a unique username for this test run
const uniqueUsername = `TestAdmin_Stock_${Date.now()}`;

// Setup and teardown
beforeAll(async () => {
   // Create a test user with gestionnaire role for authentication
  const user = await prisma.user.create({
    data: {
      nom: uniqueUsername,
      role: "gestionnaire",
      password: "testpassword"
    }
  });
  // Login to get auth token
  const loginResponse = await request(app)
    .post('/api/v1/users/login')
    .send({
      nom: uniqueUsername,
      password: "testpassword"
    });
  
  // Extract token from response
  authToken = loginResponse.headers.authorization?.split(' ')[1];
  
  // Create test product
  const productResponse = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${authToken}`)
    .send(testProduct);
  
  testProductId = productResponse.body.id;
  
  // Create test store
  const storeResponse = await request(app)
    .post('/api/v1/stores')
    .set('Authorization', `Bearer ${authToken}`)
    .send(testStore);
  
  testStoreId = storeResponse.body.id;
});

afterAll(async () => {
  // Clean up test data
  if (testStoreId) {
    await prisma.stock.deleteMany({
      where: { magasinId: testStoreId }
    });
    
    await prisma.magasin.delete({
      where: { id: testStoreId }
    });
  }
  
  if (testProductId) {
    await prisma.product.delete({
      where: { id: testProductId }
    });
  }
  
  // Delete test user
  await prisma.user.delete({
    where: { nom: uniqueUsername }
  });
  
  // Close Prisma connection
  await prisma.$disconnect();
});

describe('Stock Operations', () => {
  
  // Test getting stock for a product
  test('Should retrieve stock for a specific product', async () => {
    const response = await request(app)
      .get(`/api/v1/stock/product/${testProductId}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    const stockEntry = response.body.find(s => s.productId === testProductId && s.magasinId === testStoreId);
    expect(stockEntry).toBeDefined();
    expect(stockEntry.quantite).toBe(10);
  });
  
  // Test updating stock quantity
  test('Should update stock quantity', async () => {
    const updatedQuantity = 20;
    
    const response = await request(app)
      .put(`/api/v1/stock/${testProductId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quantity: updatedQuantity });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', testProductId);
    expect(response.body.quantite).toBe(updatedQuantity);
  });
  
  // Test getting stock for a store
  test('Should retrieve all stock for a specific store', async () => {
    const response = await request(app)
      .get(`/api/v1/stock/store/${testStoreId}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    
    const stockEntry = response.body.find(s => s.productId === testProductId);
    expect(stockEntry).toBeDefined();
  });

  // Test setting product as out of stock
  test('Should set product as out of stock', async () => {
    const response = await request(app)
      .put(`/api/v1/stock/${testProductId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ quantity: 0 });
    
    expect(response.status).toBe(200);
    expect(response.body.quantite).toBe(0);
    
    // Verify availability is now false
    const availabilityResponse = await request(app)
      .get(`/api/v1/stock/availability/${testProductId}/${testStoreId}`);
    
    expect(availabilityResponse.status).toBe(200);
    expect(availabilityResponse.body).toHaveProperty('available', false);
  });
}); 