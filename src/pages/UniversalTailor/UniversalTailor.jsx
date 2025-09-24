import TailorPage from "./TailorPage";
import Models from "./Models";
import Video from "./Video";
import { Routes, Route } from "react-router-dom";

const UniversalTailor = () => {
  return (
    <Routes>
      <Route path="/" element={<TailorPage />} />
      <Route path="/video" element={<Video />} />
      <Route path="/models" element={<Models />} />
    </Routes>
  );
};

export default UniversalTailor;
