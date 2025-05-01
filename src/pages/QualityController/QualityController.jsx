import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";
import MinusPage from "./Orders/MinusPage";

const QualityController = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="orders/:id/minus" element={<MinusPage />} />
    </Routes>
  );
};

export default QualityController;
