import { Routes, Route } from "react-router-dom";
import WorkDetails from "./WorkDetails";
import WorkEdit from "./WorkEdit";

const Work = () => {
  return (
    <Routes>
      <Route path=":id" element={<WorkDetails />} />
      <Route path=":id/edit" element={<WorkEdit />} />
    </Routes>
  );
};

export default Work;
