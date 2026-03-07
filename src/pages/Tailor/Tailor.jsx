import TailorPage from "./TailorPage";
import Models from "./Models";
import StarterPage from "./Work/StarterPage";
import { Routes, Route } from "react-router-dom";

const Tailor = () => {
  return (
    <Routes>
      <Route path="/" element={<TailorPage />} />
      <Route path="/models" element={<Models />} />
      <Route path="/starter" element={<StarterPage />} />
    </Routes>
  );
};

export default Tailor;
