import { Routes, Route, Navigate } from "react-router-dom";
import Pending from "./Pending";
import Tailoring from "./Tailoring";
import ConnectToWork from "./ConnectToWork";
import Result from "./Result";
import ConnectResult from "./ConnectResult";
import ConnectWorkEdit from "./ConnectWorkEdit";
import Tarifs from "./Tarifs";
import TarifDetails from "./TarifDetails";
import Employees from "./Employees/Employees";
import ViewEmployees from "./Employees/ViewEmployees";

const GroupMaster = () => {
  return (
    <Routes>
      <Route path="pending" element={<Pending />} />
      <Route path="tailoring" element={<Tailoring />} />
      <Route path="tailoring/:id" element={<ConnectToWork />} />
      <Route path="result/:id" element={<ConnectResult />} />
      <Route path="result" element={<Result />} />
      <Route path="connectWorkEdit/:id" element={<ConnectWorkEdit />} />
      <Route path="tarifs" element={<Tarifs />} />
      <Route path="tarifs/:id" element={<TarifDetails />} />
      <Route path="employees" element={<Employees />} />
      <Route path="employees/view/:id" element={<ViewEmployees />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default GroupMaster;
