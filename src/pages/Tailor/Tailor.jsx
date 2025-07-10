import TailorPage from "./TailorPage";
import Orders from "./Orders";
import { Routes, Route } from "react-router-dom";

const Tailor = () => {
  return (
    <Routes>
      <Route path="/" element={<TailorPage />} />
      <Route path="/orders" element={<Orders />} />
    </Routes>
  );
};

export default Tailor;
