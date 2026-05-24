import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import SubmitIncident from './pages/SubmitIncident';
import Analytics from './pages/Analytics';

// PrivateRoute - Redirects unauthenticated sessions to /login
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-boot-spinner-container">
        <span className="spinner-loader"></span>
        <p>Verifying secure credentials...</p>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-viewport-wrapper">
          <Routes>
            {/* Public Authentications */}
            <Route path="/login" element={<Login />} />

            {/* Authenticated Dashboard Operations */}
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="app-authenticated-layout">
                    
                    {/* Main Content Workspace Panel */}
                    <div className="app-content-wrapper">
                      {/* Top Header Navbar */}
                      <Navbar />
                      
                      <main className="app-main-content">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/submit" element={<SubmitIncident />} />
                          <Route path="/analytics" element={<Analytics />} />
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
