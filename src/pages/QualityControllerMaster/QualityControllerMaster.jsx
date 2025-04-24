import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import Results from "./Results/Results";

const QualityControllerMaster = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="orders" element={<Orders />} />
      <Route path="results" element={<Results />} />
    </Routes>
  );
};

export default QualityControllerMaster;
