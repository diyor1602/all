import { Routes, Route, Navigate } from "react-router-dom";
import Income from "./Income/Income";
import Outcome from "./Outcome/Outcome";
import Balance from "./Balance/Balance";
import Requests from "./Requests/Requests";

const Casher = () => {
  return (
    <Routes>
      <Route path="income/*" element={<Income />} />
      <Route path="outcome/*" element={<Outcome />} />
      <Route path="balance/*" element={<Balance />} />
      <Route path="requests/*" element={<Requests />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Casher;
