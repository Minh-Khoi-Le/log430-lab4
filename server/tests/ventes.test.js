import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../index.js';

const prisma = new PrismaClient();

// Test data
const testStore = {
  nom: "Sales Test Store",
  adresse: "789 Sales Avenue"
};

const testClient = {
  nom: "SalesTestClient",
  role: "client",
  password: "testpassword"
};

const testAdmin = {
  nom: "SalesTestAdmin",
  role: "gestionnaire",
  password: "adminpassword"
};

const testProduct = {
  nom: "Sales Test Product",
  prix: 39.99,
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
    await prisma.vente.delete({
      where: { id: testSaleId }
    });
  }
  
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

describe('Sales Operations', () => {
  
  // Test creating a sale
  test('Should create a new sale', async () => {
    const saleData = {
      magasinId: storeId,
      userId: clientId,
      lignes: [
        {
          productId: productId,
          quantite: 2,
          prixUnitaire: testProduct.prix
        }
      ]
    };
    
    const response = await request(app)
      .post('/api/v1/sales')
      .set('Authorization', `Bearer ${clientToken}`)
      .send(saleData);
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('magasinId', storeId);
    expect(response.body).toHaveProperty('userId', clientId);
    expect(response.body).toHaveProperty('total');
    expect(response.body.total).toBe(2 * testProduct.prix);
    expect(response.body).toHaveProperty('lignes');
    expect(Array.isArray(response.body.lignes)).toBe(true);
    expect(response.body.lignes.length).toBe(1);
    
    // Save sale ID for later tests
    saleId = response.body.id;
    
    // Verify stock was updated
    const stockResponse = await request(app)
      .get(`/api/v1/stock/product/${productId}`);
    
    const updatedStock = stockResponse.body.find(s => s.magasinId === storeId);
    expect(updatedStock.quantite).toBe(48); // 50 - 2
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
  
  // Test getting a specific sale by ID
  test('Should retrieve a specific sale by ID', async () => {
    const response = await request(app)
      .get(`/api/v1/sales/${saleId}`)
      .set('Authorization', `Bearer ${clientToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', saleId);
    expect(response.body).toHaveProperty('magasinId', storeId);
    expect(response.body).toHaveProperty('userId', clientId);
  });
  
  // Test generating sales report
  test('Should generate a sales report', async () => {
    const response = await request(app)
      .get('/api/v1/sales/report')
      .query({
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        endDate: new Date().toISOString().split('T')[0] // today
      })
      .set('Authorization', `Bearer ${adminToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalSales');
    expect(response.body).toHaveProperty('totalRevenue');
    expect(response.body).toHaveProperty('salesByStore');
    expect(Array.isArray(response.body.salesByStore)).toBe(true);
  });
}); 