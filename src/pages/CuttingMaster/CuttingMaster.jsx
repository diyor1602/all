import { Routes, Route } from "react-router-dom";
import Cutting from "./Cutting";
import Printing from "./Printing";
import Orders from "./Orders";

const CuttingMaster = () => {
  return (
    <Routes>
      <Route path="cutting" element={<Cutting />} />
      <Route path="printing" element={<Printing />} />
      <Route path="orders" element={<Orders />} />
    </Routes>
  );
};

export default CuttingMaster;
