/**
 * Navigation Bar Component
 * 
 * This component provides the main navigation header for the application.
 * It adapts its content based on the user's role and authentication state.
 * 
 */

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUser } from "../context/UserContext";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Box,
  Divider,
  ListItemIcon,
  Tooltip,
  Avatar,
  Chip,
} from "@mui/material";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import StoreIcon from "@mui/icons-material/Store";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

function Navbar() {
  const { cart } = useCart();
  const { user, setUser } = useUser();
  const [magasins, setMagasins] = useState([]);
  // Calculate total items in cart for badge display
  const totalItems = cart.reduce((acc, item) => acc + item.quantite, 0);
  const location = useLocation();

  // User menu state management
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  // Fetch available stores when component mounts
  useEffect(() => {
    if (user?.role === "client") {
      fetch("http://localhost:3000/api/v1/stores")
        .then((res) => res.json())
        .then((data) => setMagasins(data))
        .catch(() => setMagasins([]));
    }
  }, [user]);

  /**
   * Menu handlers
   */
  // Open user menu
  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  // Close user menu
  const handleClose = () => setAnchorEl(null);

  // Handle store change
  const handleStoreChange = (magasinId, magasinNom) => {
    setUser((u) => ({ 
      ...u, 
      magasinId: parseInt(magasinId),
      magasinNom
    }));
    handleClose();
  };
  
  // Handle user logout
  const handleLogout = () => {
    setUser(null);
    handleClose();
  };

  // Generate menu items based on user role
  const generateMenuItems = () => {
    const menuItems = [];
    
    // Add store selection items for client role
    if (user?.role === "client") {
      menuItems.push(
        <MenuItem key="store-header" disabled sx={{ opacity: 0.7 }}>
          <ListItemIcon>
            <StoreIcon fontSize="small" />
          </ListItemIcon>
          Changer de magasin
        </MenuItem>
      );
      
      menuItems.push(<Divider key="divider-1" />);
      
      // Add store options
      magasins.forEach(magasin => {
        menuItems.push(
          <MenuItem
            key={`store-${magasin.id}`}
            selected={user.magasinId === magasin.id}
            onClick={() => handleStoreChange(magasin.id, magasin.nom)}
            sx={{ pl: 3 }}
          >
            {magasin.nom}
          </MenuItem>
        );
      });
      
      menuItems.push(<Divider key="divider-2" />);
    }
    
    // Add logout option (for all users)
    menuItems.push(
      <MenuItem key="logout" onClick={handleLogout}>
        <ListItemIcon>
          <LogoutIcon fontSize="small" />
        </ListItemIcon>
        Déconnexion
      </MenuItem>
    );
    
    return menuItems;
  };

  return (
    <AppBar position="static" sx={{ background: "#2d3240", boxShadow: 2 }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", minHeight: 60 }}>
        {/* Left side: Logo and navigation links */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          {/* Application title */}
          <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>
            LOG430 Magasin
          </Typography>
          
          {/* Products link - available to all users */}
          <Link
            to="/"
            style={{
              color: location.pathname === "/" ? "#3a8bff" : "#fff",
              textDecoration: "none",
              fontWeight: 600,
              marginRight: 16,
              fontSize: 17
            }}
          >
            Product
          </Link>
          
          {/* Dashboard link - only for gestionnaire role */}
          {user?.role === "gestionnaire" && (
            <Link to="/dashboard" style={{
              color: "#fff",
              marginRight: 16,
              fontSize: 17,
              textDecoration: "none",
              fontWeight: 500
            }}>
              Dashboard
            </Link>
          )}
          
          {/* Cart link - only for client role */}
          {user?.role === "client" && (
            <Link to="/panier" style={{
              color: "#fff",
              marginRight: 16,
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
              fontWeight: 500
            }}>
              <Badge badgeContent={totalItems} color="primary" sx={{ marginRight: 1 }}>
                <ShoppingCartIcon sx={{ color: "#fff" }} />
              </Badge>
              Mon panier
            </Link>
          )}
          
          {/* History link - only for client role */}
          {user?.role === "client" && (
            <Link to="/history" style={{
              color: location.pathname === "/history" ? "#3a8bff" : "#fff",
              marginRight: 16,
              textDecoration: "none",
              fontWeight: 500
            }}>
              Historique
            </Link>
          )}
        </Box>

        {/* Right side: User information and account menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Display username if logged in */}
          {user?.nom && (
            <Typography variant="body1" sx={{ color: "#fff", marginRight: 2, fontSize: 16 }}>
              Utilisateur: <b>{user.nom}</b>
            </Typography>
          )}
          
          {/* Display current store for client */}
          {user?.role === "client" && user?.magasinNom && (
            <Chip
              icon={<StoreIcon />}
              label={user.magasinNom}
              variant="outlined"
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                marginRight: 2,
                "& .MuiChip-icon": { color: 'white' }
              }}
            />
          )}
          
          {/* User account menu button */}
          <Tooltip title="Mon compte">
            <IconButton
              color="inherit"
              onClick={handleMenu}
              size="large"
              aria-label="Compte utilisateur"
              sx={{
                ml: 1,
                background: "rgba(255,255,255,0.06)",
                "&:hover": { background: "rgba(58,139,255,0.09)" }
              }}
            >
              {/* Show first letter of username as avatar, or icon if not available */}
              {user?.nom ? (
                <Avatar sx={{ bgcolor: "#3a8bff", width: 36, height: 36 }}>
                  {user.nom[0]?.toUpperCase() || <AccountCircleIcon />}
                </Avatar>
              ) : (
                <AccountCircleIcon fontSize="large" />
              )}
            </IconButton>
          </Tooltip>
          
          {/* User account dropdown menu */}
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {generateMenuItems()}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;
