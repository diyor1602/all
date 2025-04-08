import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import Models from "./Models/Models";
import AddModel from "./Models/AddModel";
import EditModel from "./Models/EditModel";
import OrderView from "./Orders/OrderView";
import NewOrder from "./Orders/NewOrder";

const OrderManager = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="orders/new" element={<NewOrder />} />
      <Route path="models" element={<Models />} />
      <Route path="models/add" element={<AddModel />} />
      <Route path="models/edit/:id" element={<EditModel />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default OrderManager;
