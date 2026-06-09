import { Routes, Route } from "react-router-dom";
import Orders from "./Orders/Orders";
import OrderView from "./Orders/OrderView";
import Stats from "./Stats/Stats";

const MajorQualityController = () => {
  return (
    <Routes>
      <Route path="orders" element={<Orders />} />
      <Route path="orders/:id" element={<OrderView />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
};

export default MajorQualityController;
