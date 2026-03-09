import { Routes, Route } from "react-router-dom";
import Orders from "./Orders";
import Employees from "./Employees";
import ViewEmployee from "./ViewEmployee";

const CompleteOrders = () => {
  return (
    <Routes>
      <Route path="" element={<Orders />} />
      <Route path="employees" element={<Employees />} />
      <Route path="view-employee/:id" element={<ViewEmployee />} />
    </Routes>
  );
};

export default CompleteOrders;
