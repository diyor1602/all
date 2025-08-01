import { Routes, Route, Navigate } from "react-router-dom";
import Specification from "./Specification";

const PackageMaster = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="spec" element={<Specification />} />
    </Routes>
  );
};

export default PackageMaster;
