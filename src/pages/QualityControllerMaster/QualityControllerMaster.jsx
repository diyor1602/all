import { Routes, Route, Navigate } from "react-router-dom";

const QualityControllerMaster = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
};

export default QualityControllerMaster;
