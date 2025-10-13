import { Routes, Route, Navigate } from "react-router-dom";

import AuthProvider from "./context/AuthProvider";

import Login from "./pages/Login";

import checkAuth from "./hooks/checkAuth";

import { Toaster } from "@/components/ui/toaster";

import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/Home";
import Kpi from "./pages/Kpi";
import Profile from "./pages/Profile/Profile";
import CuttingKpi from "./pages/CuttingKpi";
import Chat from "./pages/Chat/Chat";
import Issue from "./pages/Issue";
import TailorRating from "./pages/TailorRating";
import SuperHr from "./pages/SuperHR/SuperHr";
import Technolog from "./pages/Technolog/Technolog";
import CuttingMaster from "./pages/CuttingMaster/CuttingMaster";
import GroupMaster from "./pages/GroupMaster/GroupMaster";
import GroupHelper from "./pages/GroupHelper/GroupHelper";
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
import ResultChecker from "./pages/ResultChecker/ResultChecker";
import Ceo from "./pages/Ceo/Ceo";
import Tailor from "./pages/Tailor/Tailor";
import UniversalTailor from "./pages/UniversalTailor/UniversalTailor";
import Truck from "./pages/Truck";
import Coefficient from "./pages/Coefficient/Coefficient";

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
          <Route path="/chat/*" element={<Chat />} />
          <Route path="/issue" element={<Issue />} />
          <Route path="/kpi" element={<Kpi />} />
          <Route path="/cuttingKpi" element={<CuttingKpi />} />
          <Route path="/truck" element={<Truck />} />
          <Route path="/tailorRating" element={<TailorRating />} />
          <Route path="/superhr/*" element={<SuperHr />} />
          <Route path="/technologist/*" element={<Technolog />} />
          <Route path="/cuttingMaster/*" element={<CuttingMaster />} />
          <Route path="/groupMaster/*" element={<GroupMaster />} />
          <Route path="/groupHelper/*" element={<GroupHelper />} />
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
          <Route path="/resultChecker/*" element={<ResultChecker />} />
          <Route path="/ceo/*" element={<Ceo />} />
          <Route path="/tailor/*" element={<Tailor />} />
          <Route path="/universalTailor/*" element={<UniversalTailor />} />
          <Route path="/coefficient/*" element={<Coefficient />} />
        </Route>
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
