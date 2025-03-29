import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";

import checkAuth from "./hooks/checkAuth";

import { Toaster } from "@/components/ui/toaster";

import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/Home";
import SuperHr from "./pages/SuperHR/SuperHr";
import Technolog from "./pages/Technolog/Technolog";

const ProtectedRoute = () => {
  const isAuthenticated = checkAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
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
          {/* Calendar */}
          <Route path="/superhr/*" element={<SuperHr />} />
          <Route path="/technologist/*" element={<Technolog />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
