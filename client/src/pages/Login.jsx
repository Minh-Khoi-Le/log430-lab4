/**
 * Login Page
 * 
 * This component handles user authentication.
 * After successful login, it updates the user context with the user information.
 * The role is determined by the user's account information from the backend.
 */

import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";

function Login() {
  // State for form fields
  const [nom, setNom] = useState("");
  const [password, setPassword] = useState("");
  const [magasinId, setMagasinId] = useState("");
  const [magasins, setMagasins] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { setUser } = useUser();

  // Fetch the list of stores when component mounts
  useEffect(() => {
    fetch("http://localhost:3000/api/v1/stores")
      .then((res) => res.json())
      .then((data) => setMagasins(data))
      .catch(() => setMagasins([]));
  }, []);

  /**
   * Handle form submission
   * 
   * Authenticates the user against the backend API and
   * sets up the user context upon successful login
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // Validate form fields
    if (!nom.trim()) {
      setError("Veuillez entrer votre nom !");
      setLoading(false);
      return;
    }
    
    // Send login request to API
    fetch("http://localhost:3000/api/v1/users/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nom: nom.trim(),
        password: password.trim() || "password",
      }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Login failed");
        }
        
        // Get the token from headers if available
        const token = res.headers.get('Authorization')?.split(' ')[1] || 
                      // Fallback to a dummy token for development
                      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6Imdlc3Rpb25uYWlyZSIsIm5vbSI6IkciLCJpYXQiOjE2ODcyODk2NzIsImV4cCI6MTY4NzI5MzI3Mn0.C1qig9Ut5-9HNpIaTGN1RUxnkb9Pd3bHm_NbvwUUwZQ';
        
        return res.json().then(userData => ({ userData, token }));
      })
      .then(({ userData, token }) => {
        // For client role, ensure a store is selected
        if (userData.role === "client" && !magasinId) {
          setError("En tant que client, veuillez choisir un magasin !");
          setLoading(false);
          return;
        }
        
        // Create user object and update context
        setUser({
          id: userData.id,
          role: userData.role,
          nom: userData.nom,
          token: token, // Store the token in user context
          magasinId: userData.role === "client" ? parseInt(magasinId) : null,
          magasinNom:
            userData.role === "client"
              ? magasins.find((m) => m.id === parseInt(magasinId))?.nom || ""
              : "",
        });
      })
      .catch((err) => {
        console.error(err);
        setError("Authentication failed. Please check your credentials.");
        setLoading(false);
      });
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      padding: "1rem",
      backgroundColor: "#f9f9f9"
    }}>
      <div style={{
        width: "100%",
        maxWidth: "400px",
        padding: "2rem",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Connexion</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Username field */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Nom d'utilisateur:
            </label>
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>
          
          {/* Password field */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Mot de passe:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px"
              }}
            />
          </div>
          
          {/* Store selection field */}
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", marginBottom: "0.5rem" }}>
              Magasin (pour les clients):
            </label>
            <select
              value={magasinId}
              onChange={(e) => setMagasinId(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: "white"
              }}
            >
              <option value="">-- Sélectionnez un magasin --</option>
              {magasins.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nom}
                </option>
              ))}
            </select>
            <p style={{ 
              margin: "0.25rem 0 0 0", 
              fontSize: "0.8rem", 
              color: "#666" 
            }}>
              * Si vous êtes gestionnaire, vous pouvez ignorer cette sélection
            </p>
          </div>
          
          {/* Error message */}
          {error && (
            <div style={{ 
              padding: "0.5rem",
              backgroundColor: "#ffe6e6",
              color: "#cc0000",
              borderRadius: "4px",
              marginBottom: "1rem",
              fontSize: "0.9rem"
            }}>
              {error}
            </div>
          )}
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#4568dc",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
      
      {/* Test credentials information box */}
      <div style={{ 
        width: "100%",
        maxWidth: "400px",
        marginTop: "2rem",
        padding: "1rem",
        backgroundColor: "#f0f4ff",
        border: "1px solid #d0d8ff",
        borderRadius: "6px"
      }}>
        <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem", textAlign: "center" }}>
          Comptes de test
        </h3>
        
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ width: "48%" }}>
            <p style={{ fontWeight: "bold", margin: "0.5rem 0", fontSize: "0.9rem" }}>
              Client:
            </p>
            <ul style={{ margin: "0", paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
              <li>Nom: <strong>c</strong></li>
              <li>Mot de passe: <strong>c</strong></li>
              <li>Choisir un magasin</li>
            </ul>
          </div>
          
          <div style={{ width: "48%" }}>
            <p style={{ fontWeight: "bold", margin: "0.5rem 0", fontSize: "0.9rem" }}>
              Gestionnaire:
            </p>
            <ul style={{ margin: "0", paddingLeft: "1.5rem", fontSize: "0.9rem" }}>
              <li>Nom: <strong>g</strong></li>
              <li>Mot de passe: <strong>g</strong></li>
            </ul>
          </div>
        </div>
        
        <p style={{ 
          margin: "0.5rem 0 0 0", 
          fontSize: "0.8rem", 
          color: "#666", 
          fontStyle: "italic",
          textAlign: "center" 
        }}>
          Autres comptes: Alice, Bob (clients)
        </p>
      </div>
    </div>
  );
}

export default Login;
