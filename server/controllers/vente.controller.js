import VenteDAO from '../dao/vente.dao.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Create Sale Controller
 * Creates a new sale transaction with the provided data.
 * @param {Request} req - Express request object with sale data in body
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function create(req, res, next) {
  try {
    let { magasinId, userId, lignes, clientNom, panier } = req.body;

    // If userId is not provided, use clientNom to find the user
    if (!userId && clientNom) {
      let user = await prisma.user.findFirst({ where: { nom: clientNom } });
      if (!user) {
        return res.status(400).json({ error: "Utilisateur non trouvé" });
      }
      userId = user.id;
    }

    // If lignes is not provided, convert panier to lignes
    if (!lignes && panier) {
      lignes = panier.map(item => ({
        productId: item.productId,
        quantite: item.quantite,
        prixUnitaire: item.prix
      }));
    }

    if (!magasinId || !userId || !lignes) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if magasinId exists
    const magasin = await prisma.magasin.findUnique({ where: { id: parseInt(magasinId) } });
    if (!magasin) {
      return res.status(400).json({ error: "Le magasin sélectionné n'existe pas." });
    }

    // Check stock availability for each product
    for (const ligne of lignes) {
      const stock = await prisma.stock.findFirst({
        where: { 
          productId: parseInt(ligne.productId), 
          magasinId: parseInt(magasinId) 
        }
      });
      
      if (!stock || stock.quantite < ligne.quantite) {
        const product = await prisma.product.findUnique({ 
          where: { id: parseInt(ligne.productId) } 
        });
        return res.status(400).json({ 
          error: `Stock insuffisant pour ${product ? product.nom : 'un produit'}`
        });
      }
    }

    // Use a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Calculate total
      const total = lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
      
      // Create the sale
      const vente = await tx.vente.create({
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
      
      // Update stock quantities
      for (const ligne of lignes) {
        await tx.stock.updateMany({
          where: { 
            productId: parseInt(ligne.productId), 
            magasinId: parseInt(magasinId) 
          },
          data: { 
            quantite: { 
              decrement: parseInt(ligne.quantite) 
            } 
          }
        });
      }
      
      return vente;
    });

    res.status(201).json({ success: true, vente: result });
  } catch (err) {
    next(err);
  }
}

/**
 * List Sales Controller
 * 
 * Retrieves a list of all sales with client and store information.
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function list(req, res, next) {
  try {
    const ventes = await VenteDAO.getAll();
    res.json(ventes);
  } catch (err) { next(err); }
}

/**
 * Get Client Sales Controller
 * 
 * Retrieves all sales for a specific client.
 * 
 * @param {Request} req - Express request object with client ID parameter
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function byClient(req, res, next) {
  try {
    // Use client ID from either path parameter or request body
    const clientId = req.params.clientId || req.body.userId;
    
    if (!clientId) {
      return res.status(400).json({ error: "Client ID is required" });
    }
    
    const ventes = await VenteDAO.getByUser(clientId);
    res.json(ventes);
  } catch (err) { next(err); }
}

/**
 * Get Store Sales Controller
 * 
 * Retrieves all sales for a specific store with detailed information,
 * including product details, client information, and line items.
 * Optionally limits the results to a specific count.
 * 
 * @param {Request} req - Express request object with store ID parameter
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function byStore(req, res, next) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const ventes = await VenteDAO.getByStore(req.params.storeId, limit);
    res.json(ventes);
  } catch (err) { next(err); }
}

/**
 * Refund Sale Controller
 * 
 * Refunds a sale by adding products back to stock and removing the sale.
 * 
 * @param {Request} req - Express request object with sale ID parameter
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export async function refund(req, res, next) {
  try {
    const { saleId } = req.body;
    
    if (!saleId) {
      return res.status(400).json({ error: "Sale ID is required" });
    }

    // Find the sale with all its details
    const sale = await prisma.vente.findUnique({
      where: { id: parseInt(saleId) },
      include: { 
        lignes: true,
        magasin: true,
        user: true
      }
    });
    
    if (!sale) {
      return res.status(404).json({ error: "Vente non trouvée" });
    }

    // Execute refund in a transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Return stock for each product in the sale
      for (const ligne of sale.lignes) {
        await tx.stock.updateMany({
          where: { 
            productId: ligne.productId, 
            magasinId: sale.magasinId 
          },
          data: { 
            quantite: { 
              increment: ligne.quantite 
            } 
          }
        });
      }
      
      // Delete the sale lines first (due to foreign key constraints)
      await tx.vente_ligne.deleteMany({
        where: { venteId: sale.id }
      });
      
      // Delete the sale
      const deletedSale = await tx.vente.delete({
        where: { id: sale.id }
      });
      
      return deletedSale;
    });

    res.status(200).json({ 
      success: true, 
      message: "Remboursement effectué avec succès",
      refundedSale: result
    });
  } catch (err) {
    console.error("Refund error:", err);
    next(err);
  }
} 