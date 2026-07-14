import { Routes, Route, Navigate } from "react-router-dom";
import Specification from "./Specification";
import Truck from "./Truck/Truck";
import ExcelDownload from "./ExcelDownload";

const PackageMaster = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="spec" element={<Specification />} />
      <Route path="excel-download" element={<ExcelDownload />} />
      <Route path="truck/*" element={<Truck />} />
    </Routes>
  );
};

export default PackageMaster;
