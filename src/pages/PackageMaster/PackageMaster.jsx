import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders";
import OrderView from "./OrderView";

const PackageMaster = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="orders" element={<Orders />} />
      <Route path="order/view/:id" element={<OrderView />} />
    </Routes>
  );
};

export default PackageMaster;
