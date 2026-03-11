import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";
import NewOrder from "./Orders/NewOrder";
import EditOrder from "./Orders/EditOrder";
import ExcelOrders from "./Orders/ExcelOrders";
import Contragent from "./Contragent/Contragent";

const OrderManager = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="orders/edit/:id" element={<EditOrder />} />
      <Route path="orders/new" element={<NewOrder />} />
      <Route path="excel" element={<ExcelOrders />} />
      <Route path="contragent" element={<Contragent />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default OrderManager;
