import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";

const QualityControllerMaster = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="orders" element={<Orders />} />
    </Routes>
  );
};

export default QualityControllerMaster;
