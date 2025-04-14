import { Routes, Route, Navigate } from "react-router-dom";
import Machines from "./Machines/Machines";
import Attendance from "./Attendance/Attendance";

const Transport = () => {
  return (
    <Routes>
      <Route path="machines/*" element={<Machines />} />
      <Route path="attendance/*" element={<Attendance />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Transport;
