/**
 * Dashboard Page
 * 
 * This component provides a management dashboard for users with the gestionnaire role.
 * It displays performance statistics and visualizations for all stores.
 * 
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Skeleton,
  Button,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  IconButton,
  Grid,
  TablePagination,
  Chip,
} from "@mui/material";
import StoreIcon from "@mui/icons-material/Store";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CloseIcon from "@mui/icons-material/Close";
import RefundIcon from '@mui/icons-material/AssignmentReturn';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

const Dashboard = () => {
  // State to store statistics data from API
  const [stats, setStats] = useState(null);
  const [refundStats, setRefundStats] = useState(null);
  const navigate = useNavigate();
  
  // States for report generation
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);

  // Fetch store statistics when component mounts
  useEffect(() => {
    // API call to get store statistics
    fetch("http://localhost:3000/api/v1/maisonmere/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch((err) => {
        console.error("Error fetching stats:", err);
        setStats([]);
      });
    
    // API call to get refund statistics
    fetch("http://localhost:3000/api/v1/maisonmere/refund-stats")
      .then((res) => res.json())
      .then((data) => setRefundStats(data))
      .catch((err) => {
        console.error("Error fetching refund stats:", err);
        setRefundStats([]);
      });
  }, []);

  // Navigate to store detail page
  const handleStoreSelect = (storeId) => {
    navigate(`/store/${storeId}`);
  };
  
  // Open report dialog
  const handleOpenReportDialog = () => {
    setReportDialogOpen(true);
    setReportData(null);
    setError("");
    setPage(0);
  };
  
  // Close report dialog
  const handleCloseReportDialog = () => {
    setReportDialogOpen(false);
  };
  
  // Handle page change for pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Generate sales report
  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      setError("Veuillez sélectionner une période valide");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/maisonmere/ventes-consolidees?debut=${startDate}&fin=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }
      
      const data = await response.json();
      setReportData(data);
      setPage(0);
    } catch (err) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };
  
  // Gets refund stats for a specific store
  const getRefundStatsForStore = (storeId) => {
    if (!refundStats) return { count: 0, total: 0 };
    const store = refundStats.find(s => s.id === storeId);
    return store || { count: 0, total: 0 };
  };
  
  // Get active sales count (total - refunded)
  const getActiveSalesCount = (store) => {
    if (!store || !refundStats) return 0;
    const refund = getRefundStatsForStore(store.id);
    return Math.max(0, store.ventesTotal - refund.count);
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: "auto", mt: 6, px: 2 }}>
      {/* Main statistics table card */}
      <Paper elevation={3} sx={{ p: 5, borderRadius: 3 }}>
        {/* Dashboard header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              letterSpacing: 1,
              color: "#2d3240",
            }}
          >
            <StoreIcon sx={{ mr: 1, fontSize: 38, color: "#3a8bff", verticalAlign: "middle" }} />
            Tableau de bord —{" "}
            <span style={{ color: "#3a8bff" }}>Maison Mère</span>
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AssessmentIcon />}
            onClick={handleOpenReportDialog}
          >
            Générer un rapport
          </Button>
        </Box>
        
        {/* Store statistics table */}
        <TableContainer>
          <Table>
            {/* Table header */}
            <TableHead>
              <TableRow sx={{ background: "#f7f8fa" }}>
                <TableCell>
                  <b>Magasin</b>
                </TableCell>
                <TableCell align="right">
                  <b>Ventes totales</b>
                </TableCell>
                <TableCell align="right">
                  <b>Remboursements</b>
                </TableCell>
                <TableCell align="right">
                  <b>Ventes actives</b>
                </TableCell>
                <TableCell align="right">
                  <b>Produits vendus</b>
                </TableCell>
                <TableCell align="right">
                  <b>Chiffre d'affaires</b>
                </TableCell>
                <TableCell align="center">
                  <b>Actions</b>
                </TableCell>
              </TableRow>
            </TableHead>
            
            {/* Table body */}
            <TableBody>
              {/* Loading state with skeleton placeholders */}
              {!stats &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton width={100} />
                    </TableCell>
                    <TableCell align="center">
                      <Skeleton width={80} />
                    </TableCell>
                  </TableRow>
                ))}
              
              {/* Empty state message */}
              {stats && stats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aucune donnée à afficher.
                  </TableCell>
                </TableRow>
              )}
              
              {/* Store data rows */}
              {stats?.map((magasin) => {
                const refundData = getRefundStatsForStore(magasin.id);
                const activeSales = getActiveSalesCount(magasin);
                
                return (
                <TableRow key={magasin.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{magasin.nom}</TableCell>
                  <TableCell align="right">{magasin.ventesTotal}</TableCell>
                  <TableCell align="right">
                    {refundData.count > 0 ? (
                      <Chip 
                        size="small" 
                        label={`${refundData.count}`}
                        color="error" 
                        variant="outlined"
                        icon={<RefundIcon fontSize="small" />}
                      />
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500, color: 'primary.main' }}>
                    {activeSales}
                  </TableCell>
                  <TableCell align="right">{magasin.produitsVendus}</TableCell>
                  <TableCell align="right">
                    <b style={{ color: "#127c50" }}>
                      {magasin.chiffreAffaires.toFixed(2)} €
                    </b>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Voir les détails">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleStoreSelect(magasin.id)}
                      >
                        Détails
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Sales distribution pie chart */}
      {stats && stats.length > 0 && (
        <Box sx={{ mt: 5, p: 4, background: "#fff", borderRadius: 3, boxShadow: 2 }}>
          <Typography variant="h6" align="center" sx={{ mb: 3, fontWeight: 600, color: "#2d3240" }}>
            Répartition des ventes par magasin
          </Typography>
          {/* Responsive chart container */}
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              {/* Pie chart showing sales distribution */}
              <Pie
                data={stats.map(store => ({
                  nom: store.nom,
                  ventesTotal: getActiveSalesCount(store) // Use active sales for the chart
                }))}
                dataKey="ventesTotal"
                nameKey="nom"
                cx="50%"
                cy="50%"
                outerRadius={110}
                fill="#3a8bff"
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {/* Custom colors for each store slice */}
                {stats.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={["#3a8bff", "#127c50", "#ffb347", "#ff6961", "#6a5acd"][idx % 5]} />
                ))}
              </Pie>
              {/* Interactive tooltips and legend */}
              <RechartsTooltip formatter={(value) => `${value} ventes actives`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      )}
      
      {/* Report Generation Dialog */}
      <Dialog 
        open={reportDialogOpen} 
        onClose={handleCloseReportDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              <AssessmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Rapport de ventes consolidées
            </Typography>
            <IconButton onClick={handleCloseReportDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {/* Date Range Selection */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Date de début"
                type="date"
                fullWidth
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField
                label="Date de fin"
                type="date"
                fullWidth
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button 
                variant="contained" 
                fullWidth 
                onClick={handleGenerateReport}
                disabled={loading}
                sx={{ height: '56px' }}
              >
                {loading ? <CircularProgress size={24} /> : "Générer"}
              </Button>
            </Grid>
          </Grid>
          
          {/* Error message */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {/* Report Results */}
          {reportData && (
            <>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">
                  <b>{reportData.length}</b> ventes trouvées entre le <b>{new Date(startDate).toLocaleDateString()}</b> et le <b>{new Date(endDate).toLocaleDateString()}</b>
                </Typography>
              </Box>
              
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: "#f7f8fa" }}>
                      <TableCell><b>Date</b></TableCell>
                      <TableCell><b>Magasin</b></TableCell>
                      <TableCell><b>Client</b></TableCell>
                      <TableCell><b>Statut</b></TableCell>
                      <TableCell align="right"><b>Total</b></TableCell>
                      <TableCell align="right"><b>Produits</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">Aucune vente trouvée pour cette période</TableCell>
                      </TableRow>
                    ) : (
                      // Display only current page of data
                      reportData
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((vente) => {
                          // Calculate total for this sale
                          let total = 0;
                          let products = 0;
                          vente.lignes.forEach(ligne => {
                            total += ligne.prixUnitaire * ligne.quantite;
                            products += ligne.quantite;
                          });
                          
                          return (
                            <TableRow key={vente.id}>
                              <TableCell>{new Date(vente.date).toLocaleDateString()}</TableCell>
                              <TableCell>{vente.magasin.nom}</TableCell>
                              <TableCell>{`${vente.user?.nom}`}</TableCell>
                              <TableCell>
                                {vente.status === 'active' ? (
                                  <Chip size="small" color="primary" label="Active" />
                                ) : vente.status === 'refunded' ? (
                                  <Chip size="small" color="error" label="Remboursée" />
                                ) : (
                                  <Chip size="small" color="warning" label="Partiellement remboursée" />
                                )}
                              </TableCell>
                              <TableCell align="right">
                                <span style={{ 
                                  color: vente.status === 'active' ? "#127c50" : 
                                         vente.status === 'refunded' ? "#d32f2f" : "#ed6c02",
                                  fontWeight: 600 
                                }}>
                                  {total.toFixed(2)} €
                                </span>
                              </TableCell>
                              <TableCell align="right">{products}</TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {reportData.length > 0 && (
                <TablePagination
                  component="div"
                  count={reportData.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[10]}
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                  labelRowsPerPage=""
                />
              )}
            </>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;
