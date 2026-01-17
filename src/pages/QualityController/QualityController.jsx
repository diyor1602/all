import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";

const QualityController = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
    </Routes>
  );
};

export default QualityController;
