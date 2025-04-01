import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";

import checkAuth from "./hooks/checkAuth";

import { Toaster } from "@/components/ui/toaster";

import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/Home";
import SuperHr from "./pages/SuperHR/SuperHr";
import Technolog from "./pages/Technolog/Technolog";
import CuttingMaster from "./pages/CuttingMaster/CuttingMaster";
import TailorMaster from "./pages/TailorMaster/TailorMaster";

const ProtectedRoute = () => {
  const isAuthenticated = checkAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <DashboardLayout />;
};

const RootRoute = () => {
  const isAuthenticated = checkAuth();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }

  return <Login />;
};

function App() {
  return (
    <AuthProvider>
      <Toaster />
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route element={<ProtectedRoute />}>
          {/* Home */}
          <Route path="/home" element={<Home />} />
          <Route path="/superhr/*" element={<SuperHr />} />
          <Route path="/technologist/*" element={<Technolog />} />
          <Route path="/cuttingMaster/*" element={<CuttingMaster />} />
          <Route path="/tailorMaster/*" element={<TailorMaster />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
