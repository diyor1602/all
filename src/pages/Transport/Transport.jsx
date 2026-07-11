import { Routes, Route, Navigate } from "react-router-dom";
import Machines from "./Machines/Machines";
import Attendance from "./Attendance/Attendance";
import Employees from "./Employees/Employees";
import Balance from "./Balance/Balance";

const Transport = () => {
  return (
    <Routes>
      <Route path="machines/*" element={<Machines />} />
      <Route path="attendance/*" element={<Attendance />} />
      <Route path="employees/*" element={<Employees />} />
      <Route path="balance/*" element={<Balance />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Transport;
