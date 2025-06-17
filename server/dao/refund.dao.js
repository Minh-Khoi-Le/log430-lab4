import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const RefundDAO = {
  /**
   * Create Refund
   * 
   * Creates a new refund transaction in the database with associated line items.
   * Updates the sale status and returns products to inventory.
   * 
   * @param {Object} refundData - Refund transaction data
   * @param {number|string} refundData.venteId - Original sale ID
   * @param {number|string} refundData.magasinId - Store ID where the refund is processed
   * @param {number|string} refundData.userId - User ID requesting the refund
   * @param {string} [refundData.reason] - Optional reason for the refund
   * @param {Array} refundData.lignes - Array of refunded items
   * @param {number} refundData.total - Total refund amount
   * @returns {Promise<Object>} - Promise resolving to created refund with line items
   */
  create: async ({ venteId, magasinId, userId, lignes, total, reason }) => {
    // Process refund in a transaction to ensure data consistency
    return prisma.$transaction(async (tx) => {
      // Create the refund record
      const refund = await tx.refund.create({
        data: {
          venteId: parseInt(venteId),
          magasinId: parseInt(magasinId),
          userId: parseInt(userId),
          total: parseFloat(total),
          reason,
          lignes: {
            create: lignes.map(ligne => ({
              productId: parseInt(ligne.productId),
              quantite: parseInt(ligne.quantite),
              prixUnitaire: parseFloat(ligne.prixUnitaire)
            }))
          }
        },
        include: { 
          lignes: { include: { product: true } },
          vente: true,
          user: true,
          magasin: true
        }
      });
      
      // Update the original sale status (to either 'refunded' or 'partially_refunded')
      const originalSale = await tx.vente.findUnique({
        where: { id: parseInt(venteId) },
        include: { lignes: true }
      });
      
      // Calculate how much of the sale is being refunded
      const refundTotal = parseFloat(total);
      const saleTotal = originalSale.total;
      const isFullRefund = Math.abs(refundTotal - saleTotal) < 0.01; // Allow for small rounding differences
      
      await tx.vente.update({
        where: { id: parseInt(venteId) },
        data: { status: isFullRefund ? 'refunded' : 'partially_refunded' }
      });
      
      // Return products to stock
      for (const ligne of lignes) {
        await tx.stock.updateMany({
          where: { 
            productId: parseInt(ligne.productId), 
            magasinId: parseInt(magasinId) 
          },
          data: { 
            quantite: { increment: parseInt(ligne.quantite) } 
          }
        });
      }
      
      return refund;
    });
  },
  
  /**
   * Get Refunds by User
   * 
   * Retrieves all refunds for a specific user (client).
   * 
   * @param {number|string} userId - User ID
   * @returns {Promise<Array>} - Promise resolving to array of user's refunds
   */
  getByUser: async (userId) => 
    prisma.refund.findMany({
      where: { userId: parseInt(userId) },
      include: { 
        lignes: { include: { product: true } },
        vente: true,
        magasin: true
      },
      orderBy: { date: 'desc' }
    }),
  
  /**
   * Get Refunds by Sale
   * 
   * Retrieves all refunds for a specific sale.
   * 
   * @param {number|string} venteId - Sale ID
   * @returns {Promise<Array>} - Promise resolving to array of refunds for the sale
   */
  getBySale: async (venteId) =>
    prisma.refund.findMany({
      where: { venteId: parseInt(venteId) },
      include: { 
        lignes: { include: { product: true } },
        user: true,
        magasin: true
      }
    }),
  
  /**
   * Get Refunds by Store
   * 
   * Retrieves all refunds processed at a specific store.
   * 
   * @param {number|string} storeId - Store ID
   * @param {number} [limit] - Optional limit on number of refunds to return
   * @returns {Promise<Array>} - Promise resolving to array of store's refunds
   */
  getByStore: async (storeId, limit) => {
    const query = {
      where: { magasinId: parseInt(storeId) },
      include: { 
        lignes: { include: { product: true } }, 
        user: true,
        vente: true
      },
      orderBy: { date: 'desc' }
    };
    
    if (limit) {
      query.take = limit;
    }
    
    return prisma.refund.findMany(query);
  },
  
  /**
   * Get All Refunds
   * 
   * Retrieves all refunds with user, sale, and store information.
   * 
   * @returns {Promise<Array>} - Promise resolving to array of all refunds
   */
  getAll: async () => 
    prisma.refund.findMany({ 
      include: { 
        user: true, 
        vente: true, 
        magasin: true,
        lignes: { include: { product: true } }
      },
      orderBy: { date: 'desc' }
    }),
};

export default RefundDAO; 