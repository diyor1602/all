import { Routes, Route, Navigate } from "react-router-dom";
import Cutting from "./Cutting";
import Printing from "./Printing";
import Orders from "./Orders";
import CuttingStart from "./CuttingStart";
import CuttingKpi from "./CuttingKpi";

const CuttingMaster = () => {
  return (
    <Routes>
      <Route path="cutting" element={<Cutting />} />
      <Route path="printing" element={<Printing />} />
      <Route path="orders" element={<Orders />} />
      <Route path="start/:id" element={<CuttingStart />} />
      <Route path="cuttingKpi" element={<CuttingKpi />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default CuttingMaster;
