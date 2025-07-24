import TailorPage from "./TailorPage";
import Models from "./Models";
import { Routes, Route } from "react-router-dom";

const Tailor = () => {
  return (
    <Routes>
      <Route path="/" element={<TailorPage />} />
      <Route path="/models" element={<Models />} />
    </Routes>
  );
};

export default Tailor;
