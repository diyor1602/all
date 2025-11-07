import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import DepartmentDetails from "./DepartmentDetails";
import DepartmentHistory from "./DepartmentHistory";

const Quantity = () => {
  return (
    <Routes>
      <Route path="" element={<Dashboard />} />
      <Route path="department-details/:id" element={<DepartmentDetails />} />
      <Route path="department-history/:id" element={<DepartmentHistory />} />
    </Routes>
  );
};

export default Quantity;
