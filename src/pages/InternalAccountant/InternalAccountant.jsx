import { Routes, Route, Navigate } from "react-router-dom";
import Attendance from "./Attendance/Attendance";
import Employees from "./Employees/Employees";

const InternalAccountant = () => {
  return (
    <Routes>
      <Route path="attendance" element={<Attendance />} />
      <Route path="employees" element={<Employees />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default InternalAccountant;
