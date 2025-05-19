import { Routes, Route } from "react-router-dom";
import WorkPage from "./WorkPage";
import WorkDetails from "./WorkDetails";

const Work = () => {
  return (
    <Routes>
      <Route path="*" element={<WorkPage />} />
      <Route path=":id" element={<WorkDetails />} />
    </Routes>
  );
};

export default Work;
