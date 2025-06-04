import { Routes, Route, Navigate } from "react-router-dom";

import AuthProvider from "./context/AuthProvider";

import Login from "./pages/Login";

import checkAuth from "./hooks/checkAuth";

import { Toaster } from "@/components/ui/toaster";

import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Issue from "./pages/Issue";
import SuperHr from "./pages/SuperHR/SuperHr";
import Technolog from "./pages/Technolog/Technolog";
import CuttingMaster from "./pages/CuttingMaster/CuttingMaster";
import GroupMaster from "./pages/GroupMaster/GroupMaster";
import Constructor from "./pages/Constructor/Constructor";
import OrderManager from "./pages/OrderManager/OrderManager";
import Supervisor from "./pages/Supervisor/Supervisor";
import Transport from "./pages/Transport/Transport";
import WarehouseManager from "./pages/WarehouseManager/WarehouseManager";
import QualityControllerMaster from "./pages/QualityControllerMaster/QualityControllerMaster";
import QualityController from "./pages/QualityController/QualityController";
import PackageMaster from "./pages/PackageMaster/PackageMaster";
import InternalAccountant from "./pages/InternalAccountant/InternalAccountant";
import Supplier from "./pages/Supplier/Supplier";
import Tv from "./pages/Tv/Tv";
import Casher from "./pages/Casher/Casher";
import Ceo from "./pages/Ceo/Ceo";
import OneSignal from "react-onesignal";
import { useEffect } from "react";

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
  useEffect(() => {
    OneSignal.init({
      appId: import.meta.env.VITE_API_APPID,
      safari_web_id: import.meta.env.VITE_API_APPIDSAFARI,
      notifyButton: {
        enable: true,
      },
      allowLocalhostAsSecureOrigin: true,
    });
  }, []);

  return (
    <AuthProvider>
      <Toaster />
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/issue" element={<Issue />} />
          <Route path="/superhr/*" element={<SuperHr />} />
          <Route path="/technologist/*" element={<Technolog />} />
          <Route path="/cuttingMaster/*" element={<CuttingMaster />} />
          <Route path="/groupMaster/*" element={<GroupMaster />} />
          <Route path="/constructor/*" element={<Constructor />} />
          <Route path="/orderManager/*" element={<OrderManager />} />
          <Route path="/supervisor/*" element={<Supervisor />} />
          <Route path="/transport/*" element={<Transport />} />
          <Route path="/warehouseManager/*" element={<WarehouseManager />} />
          <Route
            path="/qualityControllerMaster/*"
            element={<QualityControllerMaster />}
          />
          <Route path="/qualityController/*" element={<QualityController />} />
          <Route path="/packageMaster/*" element={<PackageMaster />} />
          <Route
            path="/internalAccountant/*"
            element={<InternalAccountant />}
          />
          <Route path="/supplier/*" element={<Supplier />} />
          <Route path="/tv/*" element={<Tv />} />
          <Route path="/casher/*" element={<Casher />} />
          <Route path="/ceo/*" element={<Ceo />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
