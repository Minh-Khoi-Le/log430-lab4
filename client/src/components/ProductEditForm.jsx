/**
 * Product Edit Form Component
 * 
 * This component provides a form for editing product details.
 * It's used by administrators (gestionnaire role) to modify product information.
 * 
 */

import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Typography,
  Box,
  Button,
  CircularProgress,
  TextareaAutosize
} from "@mui/material";

/**
 * ProductEditForm Component
 * 
 * @param {Object} props - Component props
 * @param {Object} props.product - Product object to edit
 * @param {Function} props.onSave - Handler function called when save button is clicked
 * @param {Function} props.onCancel - Handler function called when cancel button is clicked
 * @param {boolean} [props.isNewProduct] - Whether this form is for creating a new product
 * @returns {JSX.Element} Product edit form
 */
const ProductEditForm = ({ product, onSave, onCancel, isNewProduct = false }) => {
  // Local state for form fields to enable controlled inputs
  const [form, setForm] = useState({ 
    nom: "",
    prix: 0,
    description: ""
  });
  
  // State for stock quantities by store
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Get user from context
  const { user } = useUser();

  // Initialize form with product data when component mounts or product changes
  useEffect(() => {
    if (product) {
      // Set base product data
      setForm({
        nom: product.nom || "",
        prix: product.prix || 0,
        description: product.description || ""
      });
      
      // Fetch all available stores and stock information for existing products
      if (product.id && !isNewProduct) {
        fetchStockData(product.id);
      }
    }
  }, [product, isNewProduct]);
  
  // Fetch stock data for this product
  const fetchStockData = async (productId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/v1/stock/product/${productId}`);
      if (response.ok) {
        const stockData = await response.json();
        setStocks(stockData);
      } else {
        console.error("Failed to fetch stock data");
      }
    } catch (error) {
      console.error("Error fetching stock data:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle input field changes for product details
   * Updates the form state when any input value changes
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  
  /**
   * Handle stock quantity change
   * Updates the stock quantity for a specific store
   * 
   * @param {number} stockId - Stock ID
   * @param {number} value - New quantity value
   */
  const handleStockChange = (stockId, value) => {
    const updatedStocks = stocks.map(stock => {
      if (stock.id === stockId) {
        return { ...stock, quantite: parseInt(value) || 0 };
      }
      return stock;
    });
    
    setStocks(updatedStocks);
  };
  
  /**
   * Save stock changes
   * Updates stock quantities on the server
   */
  const saveStockChanges = async () => {
    try {
      setLoading(true);
      setSaveSuccess(false);
      
      // Save stock changes for each store
      const promises = stocks.map(stock => 
        fetch(`http://localhost:3000/api/v1/stock/product/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token || 'dummy-token'}`
          },
          body: JSON.stringify({
            magasinId: stock.magasinId,
            quantite: stock.quantite
          })
        })
      );
      
      await Promise.all(promises);
      setSaveSuccess(true);
      
      // Refresh stock data
      fetchStockData(product.id);
    } catch (error) {
      console.error("Error saving stock changes:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   * Validates inputs and calls the onSave handler with updated product data
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate required fields
    if (!form.nom || form.prix === "") {
      alert("Name and price are required!");
      return;
    }
    
    // Prepare product data
    const productData = {
      ...(isNewProduct ? {} : { id: product.id }),
      nom: form.nom,
      prix: parseFloat(form.prix),
      description: form.description
    };
    
    // Call save handler with product data
    onSave(productData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: 280, width: '100%', maxWidth: 600 }}>
      {/* Product name field */}
      <div style={{ marginBottom: 18 }}>
        <label>Nom<br/>
          <input
            name="nom"
            value={form.nom || ""}
            onChange={handleChange}
            style={{ width: "100%", padding: 6 }}
            required
            placeholder="Product name"
          />
        </label>
      </div>
      
      {/* Product price field */}
      <div style={{ marginBottom: 18 }}>
        <label>Prix<br/>
          <input
            name="prix"
            type="number"
            step="0.01"
            value={form.prix || 0}
            onChange={handleChange}
            style={{ width: "100%", padding: 6 }}
            required
            placeholder="Prix"
          />
        </label>
      </div>
      
      {/* Product description field */}
      <div style={{ marginBottom: 18 }}>
        <label>Description<br/>
          <TextareaAutosize
            name="description"
            value={form.description || ""}
            onChange={handleChange}
            style={{ 
              width: "100%", 
              padding: 6, 
              minHeight: 80,
              fontFamily: 'inherit',
              resize: 'vertical'
            }}
            placeholder="Product description (optional)"
          />
        </label>
      </div>
      
      {/* Product stocks table - only show for existing products */}
      {!isNewProduct && (
        <div style={{ marginBottom: 18 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
            Stock Management by Store
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : stocks.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No stock available for this product
            </Typography>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell><b>Magasin</b></TableCell>
                      <TableCell align="right"><b>Quantité</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stocks.map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell>{stock.magasin.nom}</TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            value={stock.quantite}
                            onChange={(e) => handleStockChange(stock.id, e.target.value)}
                            inputProps={{ min: 0, style: { textAlign: 'right' } }}
                            sx={{ width: 100 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={saveStockChanges}
                  disabled={loading}
                  color={saveSuccess ? "success" : "primary"}
                >
                  {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  {saveSuccess ? "Stocks saved" : "Save stocks"}
                </Button>
              </Box>
            </>
          )}
        </div>
      )}
      
      {/* Instructions for new products */}
      {isNewProduct && (
        <div style={{ marginBottom: 18 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            After creating the product, you will be able to manage its stock by store.
          </Typography>
        </div>
      )}
      
      {/* Form action buttons */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 18 }}>
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-danger">
          {isNewProduct ? "Create Product" : "Save Product"}
        </button>
      </div>
    </form>
  );
};

export default ProductEditForm;
