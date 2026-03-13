import TailorPage from "./TailorPage";
import Models from "./Models";
import StarterPage from "./Work/StarterPage";
import OrderCalculate from "./Work/OrderCalculate";
import { Routes, Route } from "react-router-dom";

const Tailor = () => {
  return (
    <Routes>
      <Route path="/" element={<TailorPage />} />
      <Route path="/models" element={<Models />} />
      <Route path="/starter" element={<StarterPage />} />
      <Route path="/order-calculate/:id" element={<OrderCalculate />} />
    </Routes>
  );
};

export default Tailor;
