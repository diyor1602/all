import { Routes, Route } from "react-router-dom";
import Upload from "./Upload";
import All from "./All";

const Videos = () => {
  return (
    <Routes>
      <Route path="upload" element={<Upload />} />
      <Route path="" element={<All />} />
    </Routes>
  );
};

export default Videos;
