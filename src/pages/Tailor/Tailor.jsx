import TailorPage from "./TailorPage";
import Orders from "./Orders";
import Models from "./Models";
import { Routes, Route } from "react-router-dom";

const Tailor = () => {
  return (
    <Routes>
      <Route path="/" element={<TailorPage />} />
      <Route path="/orders" element={<Orders />} />
      <Route path="/models" element={<Models />} />
    </Routes>
  );
};

export default Tailor;
