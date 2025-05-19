import { Routes, Route } from "react-router-dom";
import WorkPage from "./WorkPage";

const Work = () => {
  return (
    <Routes>
      <Route path="*" element={<WorkPage />} />
    </Routes>
  );
};

export default Work;
