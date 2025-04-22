import { Routes, Route, Navigate } from "react-router-dom";
import Income from "./Income/Income";
import Outcome from "./Outcome/Outcome";
import Settings from "./Settings";

const WarehouseManager = () => {
  return (
    <Routes>
      <Route path="income/*" element={<Income />} />
      <Route path="outcome/*" element={<Outcome />} />
      <Route path="settings/*" element={<Settings />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default WarehouseManager;
