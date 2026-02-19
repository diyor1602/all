import { Routes, Route } from "react-router-dom";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";

const MajorQualityController = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
    </Routes>
  );
};

export default MajorQualityController;
