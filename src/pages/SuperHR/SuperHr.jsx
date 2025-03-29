import { Routes, Route } from "react-router-dom";
import Attendance from "./Attendance/Attendance";
import Employees from "./Employees/Employees";

const HomeElement = () => {
  return <div>SuperHR</div>;
};

const SuperHr = () => {
  return (
    <Routes>
      <Route path="/" element={<HomeElement />}>
        <Route path="attendance" element={<Attendance />} />
        <Route path="employees" element={<Employees />} />
      </Route>
    </Routes>
  );
};

export default SuperHr;
