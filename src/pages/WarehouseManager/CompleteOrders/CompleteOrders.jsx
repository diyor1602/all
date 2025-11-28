import { Routes, Route } from "react-router-dom";
import Orders from "./Orders";
import Employees from "./Employees";

const CompleteOrders = () => {
  return (
    <Routes>
      <Route path="" element={<Orders />} />
      <Route path="employees" element={<Employees />} />
    </Routes>
  );
};

export default CompleteOrders;
