import { Routes, Route, Navigate } from "react-router-dom";
import Employees from "./Employees/Employees";
import Settings from "./Settings/Settings";
import Work from "./Work/Work";
import Scanner from "./Scanner/Scanner";
import Task from "./Task/Task";
import Manual from "./Manual/Manual";
import ViewEmployees from "./Employees/ViewEmployees";
import OverCalc from "./OverCalc/OverCalc";
import Analysis from "./Analysis";
import OtkStamps from "./OtkStamps/OtkStamps";

const InternalAccountant = () => {
  return (
    <Routes>
      <Route path="employees" element={<Employees />} />
      <Route path="employees/view/:id" element={<ViewEmployees />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="work/*" element={<Work />} />
      <Route path="scanner" element={<Scanner />} />
      <Route path="task/*" element={<Task />} />
      <Route path="manual/*" element={<Manual />} />
      <Route path="overCalc/*" element={<OverCalc />} />
      <Route path="analysis" element={<Analysis />} />
      <Route path="otkStamps" element={<OtkStamps />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default InternalAccountant;
