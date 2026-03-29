import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";
import Damages from "./Damages/Damages";
import SecondChecks from "./SecondChecks";

const QualityController = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="damages" element={<Damages />} />
      <Route path="second-checks" element={<SecondChecks />} />
    </Routes>
  );
};

export default QualityController;
