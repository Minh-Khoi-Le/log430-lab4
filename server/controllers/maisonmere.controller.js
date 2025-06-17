import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Store Performance Statistics Controller
 * 
 * Generates performance statistics for all stores in the network.

 * - Total number of sales
 * - Total products sold
 * - Total revenue
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function stats(req, res, next) {
  try {
    const magasins = await prisma.magasin.findMany();
    const stats = await Promise.all(
      magasins.map(async (magasin) => {
        const ventes = await prisma.vente.findMany({
          where: { magasinId: magasin.id },
          include: { lignes: true },
        });
        let chiffreAffaires = 0;
        let productsVendus = 0;
        ventes.forEach((vente) => {
          vente.lignes.forEach((ligne) => {
            chiffreAffaires += ligne.prixUnitaire * ligne.quantite;
            productsVendus += ligne.quantite;
          });
        });
        return {
          id: magasin.id,
          nom: magasin.nom,
          ventesTotal: ventes.length,
          productsVendus,
          chiffreAffaires,
        };
      })
    );
    res.json(stats);
  } catch (e) { next(e); }
}

/**
 * Consolidated Sales Report Controller
 * 
 * Retrieves detailed sales data across all stores with optional date filtering.
 * Provides comprehensive sales information including store details, client information,
 * and line item details for each sale.
 * 
 * @param {Request} req - Express request object with optional date range query parameters
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function ventesConsolidees(req, res, next) {
  try {
    const { debut, fin } = req.query;
    const where = {};
    if (debut && fin) {
      where.date = { gte: new Date(debut), lte: new Date(fin) };
    }
    const ventes = await prisma.vente.findMany({
      where,
      include: { magasin: true, user: true, lignes: true },
    });
    res.json(ventes);
  } catch (e) { next(e); }
}

/**
 * Get consolidated stats for all stores
 */
export async function getStats(req, res, next) {
  try {
    // Get stats for all stores
    const stores = await prisma.magasin.findMany();
    
    // For each store, get sales and calculate stats
    const stats = await Promise.all(stores.map(async (store) => {
      // Get all sales for this store
      const sales = await prisma.vente.findMany({
        where: { 
          magasinId: store.id,
          // If excludeRefunded is true, only include active sales
          ...(req.query.excludeRefunded === 'true' && { status: 'active' })
        },
        include: { 
          lignes: { include: { product: true } }
        }
      });
      
      // Calculate total products sold and revenue
      let produitsVendus = 0;
      let chiffreAffaires = 0;
      
      sales.forEach(vente => {
        vente.lignes.forEach(ligne => {
          produitsVendus += ligne.quantite;
          chiffreAffaires += ligne.quantite * ligne.prixUnitaire;
        });
      });
      
      return {
        id: store.id,
        nom: store.nom,
        ventesTotal: sales.length,
        produitsVendus,
        chiffreAffaires
      };
    }));
    
    res.json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * Get refund statistics for all stores
 */
export async function getRefundStats(req, res, next) {
  try {
    // Get all stores
    const stores = await prisma.magasin.findMany();
    
    // For each store, get refund statistics
    const refundStats = await Promise.all(stores.map(async (store) => {
      // Get all refunds for this store
      const refunds = await prisma.refund.findMany({
        where: { magasinId: store.id },
        include: { lignes: true }
      });
      
      // Calculate total refund amount
      let refundTotal = 0;
      refunds.forEach(refund => {
        refundTotal += refund.total;
      });
      
      return {
        id: store.id,
        nom: store.nom,
        count: refunds.length,
        total: refundTotal
      };
    }));
    
    res.json(refundStats);
  } catch (err) {
    next(err);
  }
}

/**
 * Get consolidated sales data within a date range
 */
export async function getConsolidatedSales(req, res, next) {
  const { debut, fin } = req.query;
  
  if (!debut || !fin) {
    return res.status(400).json({ error: "Les dates de début et de fin sont requises" });
  }
  
  try {
    const ventes = await prisma.vente.findMany({
      where: {
        date: {
          gte: new Date(debut),
          lte: new Date(fin + 'T23:59:59')
        }
      },
      include: {
        lignes: {
          include: {
            product: true
          }
        },
        magasin: true,
        user: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    res.json(ventes);
  } catch (err) {
    next(err);
  }
} 