import { Routes, Route, Navigate } from "react-router-dom";
import Machines from "./Machines/Machines";

const Transport = () => {
  return (
    <Routes>
      <Route path="machines/*" element={<Machines />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Transport;
