import { Routes, Route } from "react-router-dom";
import Attendance from "./Attendance/Attendance";
import Employees from "./Employees/Employees";

const SuperHr = () => {
  return (
    <Routes>
      <Route path="attendance" element={<Attendance />} />
      <Route path="employees" element={<Employees />} />
    </Routes>
  );
};

export default SuperHr;
