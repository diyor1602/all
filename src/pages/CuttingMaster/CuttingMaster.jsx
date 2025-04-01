import { Routes, Route } from "react-router-dom";
import Cutting from "./Cutting";
import Printing from "./Printing";
import Orders from "./Orders";
import CuttingStart from "./CuttingStart";

const CuttingMaster = () => {
  return (
    <Routes>
      <Route path="cutting" element={<Cutting />} />
      <Route path="printing" element={<Printing />} />
      <Route path="orders" element={<Orders />} />
      <Route path="start/:id" element={<CuttingStart />} />
    </Routes>
  );
};

export default CuttingMaster;
