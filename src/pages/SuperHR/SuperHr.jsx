import { Routes, Route, Navigate } from "react-router-dom";
import Employees from "./Employees/Employees";
import Settings from "./Settings/Settings";

const SuperHr = () => {
  return (
    <Routes>
      <Route path="employees" element={<Employees />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default SuperHr;
