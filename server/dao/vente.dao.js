import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const VenteDAO = {
  /**
   * Create Sale
   * 
   * Creates a new sale transaction in the database with associated line items.
   * This function creates both the sale header and all sale line items in a single operation.
   * 
   * @param {Object} saleData - Sale transaction data
   * @param {number|string} saleData.magasinId - Store ID where the sale occurred
   * @param {number|string} saleData.userId - User ID (client) who made the purchase
   * @param {Array} saleData.lignes - Array of sale line items
   * @param {number} saleData.total - Total amount of the sale
   * @returns {Promise<Object>} - Promise resolving to created sale with line items
   */
  create: async ({ magasinId, userId, lignes, total }) => {
    // Create the sale and associated line items in a single transaction
    return prisma.vente.create({
      data: {
        magasinId: parseInt(magasinId),
        userId: parseInt(userId),
        total: parseFloat(total),
        lignes: {
          create: lignes.map(ligne => ({
            productId: parseInt(ligne.productId),
            quantite: parseInt(ligne.quantite),
            prixUnitaire: parseFloat(ligne.prixUnitaire)
          }))
        }
      },
      include: { lignes: true }
    });
  },
  
  /**
   * Get Sales by User
   * 
   * Retrieves all sales for a specific user (client) with detailed information.
   * Includes line items with product details and store information.
   * 
   * @param {number|string} userId - User ID
   * @returns {Promise<Array>} - Promise resolving to array of user's sales
   */
  getByUser: async (userId) =>
    prisma.vente.findMany({
      where: { userId: parseInt(userId) },
      include: { lignes: { include: { product: true } }, magasin: true }
    }),
  
  /**
   * Get Sales by Store
   * 
   * Retrieves all sales for a specific store with detailed information.
   * Includes line items with product details and user information.
   * Optionally limits the number of results returned (e.g., for recent sales).
   * Results are ordered by date, with most recent sales first.
   * 
   * @param {number|string} storeId - Store ID
   * @param {number} [limit] - Optional limit on number of sales to return
   * @returns {Promise<Array>} - Promise resolving to array of store's sales
   */
  getByStore: async (storeId, limit) => {
    const query = {
      where: { magasinId: parseInt(storeId) },
      include: { 
        lignes: { include: { product: true } }, 
        user: true 
      },
      orderBy: { date: 'desc' }
    };
    
    if (limit) {
      query.take = limit;
    }
    
    return prisma.vente.findMany(query);
  },
  
  /**
   * Get All Sales
   * 
   * Retrieves all sales with user and store information.
   * Used for sales reporting in Dashboard
   * 
   * @returns {Promise<Array>} - Promise resolving to array of all sales
   */
  getAll: async () => prisma.vente.findMany({ include: { user: true, magasin: true } }),
};

export default VenteDAO;
