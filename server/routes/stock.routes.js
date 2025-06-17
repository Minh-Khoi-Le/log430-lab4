/**
 * Stock Routes
 * 
 * Base path: /api/v1/stock
 * 
 * These routes handle stock-related operations including:
 * - Retrieving stock information by store or product
 * - Updating stock quantities
 */

import express from 'express';
import * as controller from '../controllers/stock.controller.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/v1/stock/product/:productId
 * 
 * Get stock information for a specific product across all stores.
 * 
 */
router.get('/product/:productId', controller.getByProduct);

/**
 * GET /api/v1/stock/store/:storeId
 * 
 * Get stock information for all products in a specific store.
 * 
 */
router.get('/store/:storeId', controller.getByStore);

/**
 * PUT /api/v1/stock/product/:productId
 * 
 * Update stock quantity for a specific product in a specific store.
 * Requires authentication with gestionnaire role.
 */
router.put('/product/:productId', auth, controller.updateStock);

export default router; 