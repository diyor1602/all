import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import DepartmentDetails from "./DepartmentDetails";

const Quantity = () => {
  return (
    <Routes>
      <Route path="" element={<Dashboard />} />
      <Route path="department-details/:id" element={<DepartmentDetails />} />
    </Routes>
  );
};

export default Quantity;
