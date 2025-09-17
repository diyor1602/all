import { Routes, Route, Navigate } from "react-router-dom";
import Employees from "./Employees/Employees";
import AddEmployees from "./Employees/AddEmployees";
import EditEmployees from "./Employees/EditEmployees";
import Attendance from "./Attendance/Attendance";
import Settings from "./Settings/Settings";
import ViewEmployees from "./Employees/ViewEmployees";
import Stats from "./Stats/Stats";
import Holiday from "./Holiday/Holiday";
import Lids from "./Lids/Lids";
import Salary from "./Salary/Salary";
import NewAttendance from "./Attendance/NewAttendance";

const SuperHr = () => {
  return (
    <Routes>
      <Route path="employees" element={<Employees />} />
      <Route path="employees/add" element={<AddEmployees />} />
      <Route path="employees/edit/:id" element={<EditEmployees />} />
      <Route path="employees/view/:id" element={<ViewEmployees />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="attendance" element={<Attendance />} />
      <Route path="holiday/*" element={<Holiday />} />
      <Route path="stats" element={<Stats />} />
      <Route path="lids/*" element={<Lids />} />
      <Route path="salary" element={<Salary />} />
      <Route path="new-attendance/:id" element={<NewAttendance />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default SuperHr;
