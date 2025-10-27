import { Routes, Route } from "react-router-dom";
import Upload from "./Upload";
import All from "./All";
import Show from "./Show";

const Videos = () => {
  return (
    <Routes>
      <Route path="upload" element={<Upload />} />
      <Route path="show/:id" element={<Show />} />
      <Route path="" element={<All />} />
    </Routes>
  );
};

export default Videos;
