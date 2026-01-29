import { Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import Dashboard2 from "./Dashboard2";
import DepartmentDetails from "./DepartmentDetails";
import DepartmentHistory from "./DepartmentHistory";

const Quantity = () => {
  return (
    <Routes>
      <Route path="" element={<Dashboard2 />} />
      <Route path="department-details/:id" element={<DepartmentDetails />} />
      <Route path="department-history/:id" element={<DepartmentHistory />} />
    </Routes>
  );
};

export default Quantity;
