import { Routes, Route, Navigate } from "react-router-dom";
import Attendance from "./Attendance/Attendance";
import Employees from "./Employees/Employees";
import Settings from "./Settings/Settings";
import Work from "./Work/Work";
import Scaner from "./Scaner/Scaner";

const InternalAccountant = () => {
  return (
    <Routes>
      <Route path="attendance" element={<Attendance />} />
      <Route path="employees" element={<Employees />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="work/*" element={<Work />} />
      <Route path="scaner" element={<Scaner />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default InternalAccountant;
