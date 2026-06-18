import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import Models from "./Models/Models";
import AddModel from "./Models/AddModel";
import EditModel from "./Models/EditModel";
import OrderView from "./Orders/OrderView";
import NewOrder from "./Orders/NewOrder";
import EditOrder from "./Orders/EditOrder";
import Plan from "./Plan/Plan";
import Analysis from "./Analysis/Analysis";
import Employees from "./Employees/Employees";
import ViewEmployees from "./Employees/ViewEmployees";

const Supervisor = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="orders/new" element={<NewOrder />} />
      <Route path="orders/edit/:id" element={<EditOrder />} />
      <Route path="models" element={<Models />} />
      <Route path="models/add" element={<AddModel />} />
      <Route path="models/edit/:id" element={<EditModel />} />
      <Route path="plan/*" element={<Plan />} />
      <Route path="analysis" element={<Analysis />} />
      <Route path="employees" element={<Employees />} />
      <Route path="employees/view/:id" element={<ViewEmployees />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Supervisor;
