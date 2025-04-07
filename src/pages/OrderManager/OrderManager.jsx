import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import Models from "./Models/Models";

const OrderManager = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="models" element={<Models />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default OrderManager;
