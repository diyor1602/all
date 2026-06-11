import { Routes, Route } from "react-router-dom";
import Groups from "./Groups";
import GroupDetails from "./GroupDetails";

const Panel = () => {
  return (
    <Routes>
      <Route path="/" element={<Groups />} />
      <Route path="/groups/:id" element={<GroupDetails />} />
    </Routes>
  );
};

export default Panel;
