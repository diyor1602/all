import { Routes, Route } from "react-router-dom";
import TaskPage from "./TaskPage";
import TaskScanner from "./TaskScanner";

const Task = () => {
  return (
    <Routes>
      <Route path="scanner" element={<TaskScanner />} />
      <Route path="*" element={<TaskScanner />} />
    </Routes>
  );
};

export default Task;
