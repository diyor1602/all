import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders";
import OrderView from "./OrderView";
import CreateOrder from "./CreateOrder";
import StockBalance from "./StockBalance";
import Cashbox from "./Cashbox/Cashbox";

const Supplier = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="create-order" element={<CreateOrder />} />
      <Route path="stockbalance" element={<StockBalance />} />
      <Route path="cashbox/*" element={<Cashbox />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Supplier;
