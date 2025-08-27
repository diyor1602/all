import { Routes, Route, Navigate } from "react-router-dom";
import Employees from "./Employees/Employees";
import Settings from "./Settings/Settings";
import Work from "./Work/Work";
import Scanner from "./Scanner/Scanner";
import Task from "./Task/Task";
import Manual from "./Manual/Manual";
import SalaryDetails from "./Employees/SalaryDetails";

const InternalAccountant = () => {
  return (
    <Routes>
      <Route path="employees" element={<Employees />} />
      <Route path="employees/:id" element={<SalaryDetails />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="work/*" element={<Work />} />
      <Route path="scanner" element={<Scanner />} />
      <Route path="task/*" element={<Task />} />
      <Route path="manual/*" element={<Manual />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default InternalAccountant;
