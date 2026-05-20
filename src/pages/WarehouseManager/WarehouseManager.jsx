import { Routes, Route, Navigate } from "react-router-dom";
import Income from "./Income/Income";
import Outcome from "./Outcome/Outcome";
import CompleteOrders from "./CompleteOrders/CompleteOrders";
import Settings from "./Settings";
import Requisitions from "./Requisition/Requisitions";
import SupplierIndex from "./Supplier/SupplierIndex";

const WarehouseManager = () => {
  return (
    <Routes>
      <Route path="income/*" element={<Income />} />
      <Route path="outcome/*" element={<Outcome />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="completeOrders/*" element={<CompleteOrders />} />
      <Route path="requisitions/*" element={<Requisitions />} />
      <Route path="supplier/*" element={<SupplierIndex />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default WarehouseManager;
