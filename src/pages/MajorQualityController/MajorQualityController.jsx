import { Routes, Route } from "react-router-dom";
import OrderView from "./Orders/OrderView";
import Stats from "./Stats/Stats";

const MajorQualityController = () => {
  return (
    <Routes>
      <Route path="orders" element={<OrderView />} />
      <Route path="stats" element={<Stats />} />
    </Routes>
  );
};

export default MajorQualityController;
