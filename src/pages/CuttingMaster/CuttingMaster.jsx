import { Routes, Route, Navigate } from "react-router-dom";
import Cutting from "./Cutting";
import Printing from "./Printing";
import Orders from "./Orders";
import CuttingStart from "./CuttingStart";
import Employees from "./NewSeason/Employees";
import ViewEmployee from "./NewSeason/ViewEmployee";
import OrderWithMinutes from "./OrderWithMinutes";
import EditOrder from "./EditOrder";
import OrderView from "./OrderView";

const CuttingMaster = () => {
  return (
    <Routes>
      <Route path="cutting" element={<Cutting />} />
      <Route path="printing" element={<Printing />} />
      <Route path="orders" element={<Orders />} />
      <Route path="start/:id" element={<CuttingStart />} />
      <Route path="employees" element={<Employees />} />
      <Route path="view-employee/:id" element={<ViewEmployee />} />
      <Route path="order-with-minutes" element={<OrderWithMinutes />} />
      <Route path="orders/edit/:id" element={<EditOrder />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default CuttingMaster;
