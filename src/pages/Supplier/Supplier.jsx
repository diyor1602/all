import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders";
import OrderView from "./OrderView";
import Balance from "./Balance";

const Supplier = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="balance" element={<Balance />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Supplier;
