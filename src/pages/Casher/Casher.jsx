import { Routes, Route, Navigate } from "react-router-dom";
import Income from "./Income/Income";
import Outcome from "./Outcome/Outcome";
import Balance from "./Balance/Balance";

const Casher = () => {
  return (
    <Routes>
      <Route path="income/*" element={<Income />} />
      <Route path="outcome/*" element={<Outcome />} />
      <Route path="balance/*" element={<Balance />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Casher;
