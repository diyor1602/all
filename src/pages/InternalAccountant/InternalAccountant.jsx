import { Routes, Route, Navigate } from "react-router-dom";
import Attendance from "./Attendance/Attendance";

const InternalAccountant = () => {
  return (
    <Routes>
      <Route path="attendance" element={<Attendance />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default InternalAccountant;
