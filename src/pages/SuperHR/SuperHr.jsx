import { Routes, Route, Navigate } from "react-router-dom";
import Employees from "./Employees/Employees";
import AddEmployees from "./Employees/AddEmployees";
import Settings from "./Settings/Settings";

const SuperHr = () => {
  return (
    <Routes>
      <Route path="employees" element={<Employees />} />
      <Route path="employees/add" element={<AddEmployees />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default SuperHr;
