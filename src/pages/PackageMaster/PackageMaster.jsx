import { Routes, Route, Navigate } from "react-router-dom";
import Orders from "./Orders";
import OrderView from "./OrderView";
import NewSpec from "./New/Specification";

const PackageMaster = () => {
  return (
    <Routes>
      <Route path="*" element={<Navigate to="/home" replace />} />
      <Route path="orders" element={<Orders />} />
      <Route path="order/view/:id" element={<OrderView />} />
      <Route path="new-spec" element={<NewSpec />} />
    </Routes>
  );
};

export default PackageMaster;
