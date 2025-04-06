import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders";

const Constructor = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default Constructor;
