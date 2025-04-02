import { Routes, Route, Navigate } from "react-router-dom";
import Spesification from "./Spesification/Spesification";
import Tarification from "./Tarification/Tarification";

const Technolog = () => {
  return (
    <Routes>
      <Route path="spesification" element={<Spesification />} />
      <Route path="tarification" element={<Tarification />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Technolog;
