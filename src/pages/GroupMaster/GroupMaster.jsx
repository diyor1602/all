import { Routes, Route, Navigate } from "react-router-dom";
import Pending from "./Pending";
import Tailoring from "./Tailoring";
import ConnectToWork from "./ConnectToWork";
import Result from "./Result";

const GroupMaster = () => {
  return (
    <Routes>
      <Route path="pending" element={<Pending />} />
      <Route path="tailoring" element={<Tailoring />} />
      <Route path="tailoring/:id" element={<ConnectToWork />} />
      <Route path="result" element={<Result />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default GroupMaster;
