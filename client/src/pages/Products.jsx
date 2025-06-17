/**
 * Products Page
 * 
 * This component displays the product catalog and provides product management
 * functionality for administrators (gestionnaire role).
 * 
 */

import React, { useEffect, useState } from "react";
import ProductList from "../components/ProductList";
import Modal from "../components/Modal";
import ProductEditForm from "../components/ProductEditForm";
import { useUser } from "../context/UserContext";
import { 
  Box, 
  FormControlLabel, 
  Switch, 
  Typography, 
  Paper, 
  Alert,
  Snackbar,
  Button,
  Fab
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const Products = () => {
  // State management for products and UI
  const [products, setProducts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [hideUnavailable, setHideUnavailable] = useState(false);
  const [error, setError] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { user } = useUser();

  /**
   * Fetch products from the API
   * 
   * Retrieves the product catalog from the backend and updates state
   */
  const fetchProducts = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/v1/products");
      if (!response.ok) throw new Error("Erreur lors du chargement des produits");
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Erreur:", error);
      setError("Erreur lors du chargement des produits");
    }
  };

  // Load products when component mounts
  useEffect(() => {
    fetchProducts();
  }, []);

  /**
   * Product Management Functions
   * 
   * These functions handle CRUD operations for products
   * Only available to users with gestionnaire role
   */
  
  // Delete product handling
  const handleDelete = product => {
    setProductToDelete(product);
    setModalOpen(true);
  };
  
  // Confirm product deletion
  const confirmDelete = async () => {
    try {
      setError(null);
      
      const response = await fetch(`http://localhost:3000/api/v1/products/${productToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${user.token || 'dummy-token'}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Vous n'êtes pas autorisé à effectuer cette action. Veuillez vous reconnecter.");
        } else if (response.status === 403) {
          throw new Error("Vous n'avez pas les droits nécessaires pour cette action.");
        } else if (response.status === 409 || response.status === 500) {
          // 409 Conflict or 500 with constraint error
          throw new Error("Ce produit ne peut pas être supprimé car il est utilisé dans des stocks ou des ventes.");
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur lors de la suppression du produit");
        }
      }
      
      setModalOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
      setModalOpen(false);
    }
  };
  
  // Cancel product deletion
  const cancelDelete = () => {
    setModalOpen(false);
    setProductToDelete(null);
  };
  
  // Edit product handling
  const handleEdit = product => {
    setProductToEdit(product);
    setEditModalOpen(true);
  };
  
  // Save product edits
  const saveEdit = async editedProduct => {
    try {
      // Create a copy of the product with only the fields we want to update
      const productToUpdate = {
        name: editedProduct.nom,
        price: editedProduct.prix,
        description: editedProduct.description
      };
      
      const response = await fetch(`http://localhost:3000/api/v1/products/${editedProduct.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token || 'dummy-token'}`
        },
        body: JSON.stringify(productToUpdate),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Vous n'êtes pas autorisé à effectuer cette action. Veuillez vous reconnecter.");
        } else if (response.status === 403) {
          throw new Error("Vous n'avez pas les droits nécessaires pour cette action.");
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Validation erreur: Veuillez vérifier les champs requis.");
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur lors de la modification du produit");
        }
      }
      
      setEditModalOpen(false);
      setProductToEdit(null);
      fetchProducts();
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
      setEditModalOpen(false);
    }
  };
  
  // Cancel product edit
  const cancelEdit = () => {
    setEditModalOpen(false);
    setProductToEdit(null);
  };
  
  // Open add product modal
  const handleOpenAddModal = () => {
    setAddModalOpen(true);
  };
  
  // Close add product modal
  const handleCloseAddModal = () => {
    setAddModalOpen(false);
  };
  
  // Add new product
  const handleAddProduct = async (newProduct) => {
    try {
      setError(null);
      
      const response = await fetch("http://localhost:3000/api/v1/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token || 'dummy-token'}`
        },
        body: JSON.stringify({
          name: newProduct.nom,
          price: parseFloat(newProduct.prix),
          description: newProduct.description || ""
        }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Vous n'êtes pas autorisé à effectuer cette action. Veuillez vous reconnecter.");
        } else if (response.status === 403) {
          throw new Error("Vous n'avez pas les droits nécessaires pour cette action.");
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Validation erreur: Veuillez vérifier les champs requis.");
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Erreur lors de l'ajout du produit");
        }
      }
      
      setAddModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error("Erreur:", err);
      setError(err.message);
    }
  };

  // Handle availability filter change
  const handleFilterChange = (event) => {
    setHideUnavailable(event.target.checked);
  };
  
  // Handle error snackbar close
  const handleCloseError = () => {
    setError(null);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f6f6f6",
      fontFamily: "sans-serif",
      position: "relative"
    }}>
      {/* Header with title and filters */}
      <Paper elevation={1} sx={{ mx: 4, mt: 4, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Catalogue de produits
          </Typography>
          {user?.role === "client" ? (
            <FormControlLabel
              control={
                <Switch 
                  checked={hideUnavailable}
                  onChange={handleFilterChange}
                  color="primary"
                />
              }
              label="Afficher uniquement les produits disponibles"
              labelPlacement="start"
            />
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenAddModal}
            >
              Ajouter un produit
            </Button>
          )}
        </Box>
      </Paper>

      {/* Main content area with product listing */}
      <div style={{
        margin: "20px 28px 0 28px",
        background: "#666",
        borderRadius: 4,
        padding: "40px 12px 60px 12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        minHeight: 450,
        boxSizing: "border-box",
      }}>
        {/* Product list with conditional edit/delete actions based on user role */}
        <ProductList
          products={products}
          onDelete={user.role === "gestionnaire" ? handleDelete : undefined}
          onEdit={user.role === "gestionnaire" ? handleEdit : undefined}
          hideUnavailable={hideUnavailable}
        />

        {/* Modal for product editing */}
        <Modal
          open={editModalOpen}
          title="Modification du produit"
          onClose={cancelEdit}
        >
          <ProductEditForm
            product={productToEdit}
            onSave={saveEdit}
            onCancel={cancelEdit}
          />
        </Modal>
        
        {/* Modal for adding new product */}
        <Modal
          open={addModalOpen}
          title="Ajouter un nouveau produit"
          onClose={handleCloseAddModal}
        >
          <ProductEditForm
            product={{ nom: "", prix: 0, stocks: [] }}
            onSave={handleAddProduct}
            onCancel={handleCloseAddModal}
            isNewProduct
          />
        </Modal>
        
        {/* Confirmation modal for product deletion */}
        <Modal
          open={modalOpen}
          title="Confirmation de suppression"
          onClose={cancelDelete}
          onConfirm={confirmDelete}
        >
          <div style={{ margin: "16px 0 0 0" }}>
            Êtes-vous sûr de vouloir supprimer <b>{productToDelete?.nom}</b> ?
          </div>
        </Modal>
        
        {/* Error Snackbar */}
        <Snackbar 
          open={!!error} 
          autoHideDuration={6000} 
          onClose={handleCloseError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseError} 
            severity="error" 
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
        
        {/* Floating action button for mobile */}
        {user?.role === "gestionnaire" && (
          <Fab 
            color="primary" 
            aria-label="add"
            onClick={handleOpenAddModal}
            sx={{ 
              position: 'fixed', 
              bottom: 16, 
              right: 16,
              display: { xs: 'flex', sm: 'none' }
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </div>
    </div>
  );
};

export default Products;
