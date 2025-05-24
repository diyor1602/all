import { Routes, Route, Navigate } from "react-router-dom";
import Income from "./Income/Income";

const Casher = () => {
  return (
    <Routes>
      <Route path="income/*" element={<Income />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Casher;
