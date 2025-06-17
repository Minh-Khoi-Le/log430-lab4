/**
 * Magasin Detail Page
 * 
 * This component provides detailed information about a specific store,
 * including stock levels, recent sales, and store management features.
 * Intended for use by gestionnaires
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
  Alert,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';

function MagasinDetail() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [store, setStore] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [sales, setSales] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch store data
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    // Function to fetch store details
    const fetchStoreData = async () => {
      try {
        // Fetch store details
        const storeRes = await fetch(`http://localhost:3000/api/v1/stores/${storeId}`);
        if (!storeRes.ok) throw new Error('Failed to load store details');
        const storeData = await storeRes.json();
        setStore(storeData);
        
        // Fetch store stock
        const stockRes = await fetch(`http://localhost:3000/api/v1/stores/${storeId}/stock`);
        if (!stockRes.ok) throw new Error('Failed to load stock data');
        const stockData = await stockRes.json();
        setStocks(stockData);
        
        // Fetch recent sales (limit to 10)
        const salesRes = await fetch(`http://localhost:3000/api/v1/sales/store/${storeId}?limit=10`);
        if (!salesRes.ok) throw new Error('Failed to load sales data');
        const salesData = await salesRes.json();
        setSales(salesData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching store data:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchStoreData();
  }, [storeId]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error message if there was a problem
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          {error}
          <Button 
            variant="outlined" 
            sx={{ ml: 2 }} 
            onClick={() => navigate('/dashboard')}
          >
            Retour au tableau de bord
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      {/* Store header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <StoreIcon sx={{ fontSize: 40, color: '#3a8bff', mr: 2 }} />
          <Typography variant="h4" component="h1">
            {store?.nom}
          </Typography>
        </Box>
        
        <Typography variant="body1" color="text.secondary">
          {store?.adresse || 'Adresse non spécifiée'}
        </Typography>
        
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }} 
          onClick={() => navigate('/dashboard')}
        >
          Retour au tableau de bord
        </Button>
      </Paper>

      {/* Tab navigation */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<InventoryIcon />} label="Stock" />
          <Tab icon={<ReceiptIcon />} label="Ventes récentes" />
        </Tabs>
      </Paper>

      {/* Stock tab content */}
      {activeTab === 0 && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Inventaire du magasin
          </Typography>
          
          {stocks.length === 0 ? (
            <Alert severity="info">Aucun produit en stock</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell><strong>Produit</strong></TableCell>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell align="right"><strong>Prix</strong></TableCell>
                    <TableCell align="right"><strong>Quantité</strong></TableCell>
                    <TableCell align="right"><strong>Valeur totale</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stocks.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.product.nom}</TableCell>
                      <TableCell>{item.product.description || '—'}</TableCell>
                      <TableCell align="right">${item.product.prix.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        <Box component="span" sx={{
                          fontWeight: 'bold',
                          color: item.quantite < 10 ? 'error.main' : 'inherit'
                        }}>
                          {item.quantite}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        ${(item.quantite * item.product.prix).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Sales tab content */}
      {activeTab === 1 && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Ventes récentes
          </Typography>
          
          {sales.length === 0 ? (
            <Alert severity="info">Aucune vente récente</Alert>
          ) : (
            <Stack spacing={2}>
              {sales.map((vente) => (
                <Paper 
                  elevation={2} 
                  key={vente.id} 
                  sx={{
                    overflow: 'hidden',
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                >
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: '#f8f9fa', 
                    borderBottom: '1px solid rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                      Vente #{vente.id}
                    </Typography>
                    <Chip 
                      label={`Total: ${vente.total.toFixed(2)} €`}
                      color="primary"
                      icon={<ReceiptIcon />}
                    />
                  </Box>
                  
                  <Box sx={{ px: 2, py: 1, display: "flex", gap: 3, bgcolor: '#f8f9fa', flexWrap: 'wrap' }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CalendarTodayIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(vente.date)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {vente.user?.nom || 'Client inconnu'}
                      </Typography>
                    </Box>

                    {vente.status && vente.status !== 'active' && (
                      <Chip 
                        size="small"
                        label={vente.status === 'refunded' ? 'Remboursé' : 'Partiellement remboursé'}
                        color={vente.status === 'refunded' ? 'error' : 'warning'}
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  <Divider />
                  
                  <Box sx={{ p: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Articles vendus:
                    </Typography>
                    <List disablePadding>
                      {vente.lignes.map((ligne) => (
                        <ListItem 
                          key={ligne.id} 
                          disablePadding 
                          sx={{ 
                            py: 1,
                            borderBottom: '1px solid rgba(0,0,0,0.06)',
                            '&:last-child': { borderBottom: 'none' }
                          }}
                        >
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {ligne.product?.nom || 'Produit inconnu'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {(ligne.quantite * ligne.prixUnitaire).toFixed(2)} €
                                </Typography>
                              </Box>
                            }
                            secondary={
                              <Typography variant="caption" color="text.secondary">
                                {ligne.quantite} x {ligne.prixUnitaire.toFixed(2)} €
                              </Typography>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>
      )}
    </Box>
  );
}

export default MagasinDetail; 