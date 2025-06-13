import { Routes, Route, Navigate } from "react-router-dom";
import Pending from "./Pending";
import Result from "./Result";
import ConnectResult from "./ConnectResult";

const GroupHelper = () => {
  return (
    <Routes>
      <Route path="pending" element={<Pending />} />
      <Route path="result" element={<Result />} />
      <Route path="result/:id" element={<ConnectResult />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default GroupHelper;
