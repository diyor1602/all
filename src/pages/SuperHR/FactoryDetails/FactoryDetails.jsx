import { Routes, Route, Navigate } from "react-router-dom";
import Buildings from "./Buildings/Buildings";

const FactoryDetails = () => {
  return (
    <Routes>
      <Route path="" element={<Buildings />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default FactoryDetails;
