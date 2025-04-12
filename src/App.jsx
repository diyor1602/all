import { Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";

import checkAuth from "./hooks/checkAuth";

import { Toaster } from "@/components/ui/toaster";

import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import SuperHr from "./pages/SuperHR/SuperHr";
import Technolog from "./pages/Technolog/Technolog";
import CuttingMaster from "./pages/CuttingMaster/CuttingMaster";
import GroupMaster from "./pages/GroupMaster/GroupMaster";
import Constructor from "./pages/Constructor/Constructor";
import OrderManager from "./pages/OrderManager/OrderManager";
import Supervisor from "./pages/Supervisor/Supervisor";
import Transport from "./pages/Transport/Transport";
import Tv from "./pages/Tv/Tv";

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
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/superhr/*" element={<SuperHr />} />
          <Route path="/technologist/*" element={<Technolog />} />
          <Route path="/cuttingMaster/*" element={<CuttingMaster />} />
          <Route path="/groupMaster/*" element={<GroupMaster />} />
          <Route path="/constructor/*" element={<Constructor />} />
          <Route path="/orderManager/*" element={<OrderManager />} />
          <Route path="/supervisor/*" element={<Supervisor />} />
          <Route path="/transport/*" element={<Transport />} />
          <Route path="/tv/*" element={<Tv />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
