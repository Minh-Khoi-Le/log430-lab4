import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../index.js';

const prisma = new PrismaClient();

// Test data
const testStore = {
  name: "Sales Test Store",
  address: "789 Sales Avenue"
};

const testClient = {
  name: "SalesTestClient",
  role: "client",
  password: "testpassword"
};

const testAdmin = {
  name: "SalesTestAdmin",
  role: "manager",
  password: "adminpassword"
};

const testProduct = {
  name: "Sales Test Product",
  price: 39.99,
  description: "A product for testing sales operations"
};

let storeId;
let productId;
let clientId;
let saleId;
let clientToken;
let adminToken;
let stockId;

// Generate a unique username for this test run
const uniqueUsername = `TestAdmin_Sales_${Date.now()}`;

// Setup and teardown
beforeAll(async () => {
  // Create a test user with manager role for authentication
  const user = await prisma.user.create({
    data: {
      name: uniqueUsername,
      role: "gestionnaire",
      password: "testpassword"
    }
  });
  
  // Login to get auth token
  const loginResponse = await request(app)
    .post('/api/v1/users/login')
    .send({
      name: uniqueUsername,
      password: "testpassword"
    });
  
  // Extract token from response
  let authToken = loginResponse.headers.authorization?.split(' ')[1];
  
  // Create test product
  const productResponse = await request(app)
    .post('/api/v1/products')
    .set('Authorization', `Bearer ${authToken}`)
    .send(testProduct);
  
    let testProductId = productResponse.body.id;
  
  // Create test store
  const storeResponse = await request(app)
    .post('/api/v1/stores')
    .set('Authorization', `Bearer ${authToken}`)
    .send(testStore);
  
    let testStoreId = storeResponse.body.id;
  
  // Create stock for the product in the store
  await request(app)
    .post('/api/v1/stock')
    .set('Authorization', `Bearer ${authToken}`)
    .send({
      productId: testProductId,
      storeId: testStoreId,
      quantity: 50
    });
});

afterAll(async () => {
  // Clean up test data
  if (testSaleId) {
    await prisma.sale.delete({
      where: { id: testSaleId }
    });
  }
  
  if (testStoreId) {
    await prisma.stock.deleteMany({
      where: { storeId: testStoreId }
    });
    
    await prisma.store.delete({
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
    where: { name: uniqueUsername }
  });
  
  // Close Prisma connection
  await prisma.$disconnect();
});

describe('Sales Operations', () => {
  
  // Test creating a sale
  test('Should create a new sale', async () => {
    const saleData = {
      storeId: storeId,
      userId: clientId,
      lines: [
        {
          productId: productId,
          quantity: 2,
          unitPrice: testProduct.price
        }
      ]
    };
    
    const response = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(saleData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('storeId', storeId);
    expect(response.body).toHaveProperty('userId', clientId);
    expect(response.body).toHaveProperty('total');
    expect(response.body.total).toBe(2 * testProduct.price);
    expect(response.body).toHaveProperty('lines');
    expect(Array.isArray(response.body.lines)).toBe(true);
    expect(response.body.lines.length).toBe(1);
    
    // Save sale ID for later tests
    saleId = response.body.id;
    
    // Verify stock was updated
    const stockResponse = await request(app)
      .get(`/api/v1/stock/product/${productId}`);
    
    const updatedStock = stockResponse.body.find(s => s.storeId === storeId);
    expect(updatedStock.quantity).toBe(48); // 50 - 2
  });
  
  // Test getting all sales
  test('Should retrieve all sales (admin only)', async () => {
    const response = await request(app)
      .get('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Verify our test sale is in the list
    const foundSale = response.body.find(sale => sale.id === saleId);
    expect(foundSale).toBeDefined();
  });
  
  // Test getting sales for a specific store
  test('Should retrieve sales for a specific store', async () => {
    const response = await request(app)
      .get(`/api/v1/sales/store/${storeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Verify our test sale is in the list
    const foundSale = response.body.find(sale => sale.id === saleId);
    expect(foundSale).toBeDefined();
  });
  
  // Test getting sales for a specific user
  test('Should retrieve sales for a specific user', async () => {
    const response = await request(app)
      .get(`/api/v1/sales/user/${clientId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    
    // Verify our test sale is in the list
    const foundSale = response.body.find(sale => sale.id === saleId);
    expect(foundSale).toBeDefined();
  });
  
  // Test refunding a sale
  test('Should refund a sale', async () => {
    const refundResponse = await request(app)
      .post('/api/v1/sales/refund')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ saleId });
    
    expect(refundResponse.status).toBe(200);
    expect(refundResponse.body).toHaveProperty('success', true);
    expect(refundResponse.body).toHaveProperty('message', 'Refund processed successfully');
    
    // Verify stock was updated back to original level
    const stockResponse = await request(app)
      .get(`/api/v1/stock/product/${productId}`);
    
    const updatedStock = stockResponse.body.find(s => s.storeId === storeId);
    expect(updatedStock.quantity).toBe(50); // Back to original
    
    // Verify sale is no longer in the list
    const salesResponse = await request(app)
      .get('/api/v1/sales')
      .set('Authorization', `Bearer ${adminToken}`);
    
    const foundSale = salesResponse.body.find(sale => sale.id === saleId);
    expect(foundSale).toBeUndefined();
  });
}); 