import { Routes, Route } from "react-router-dom";
import PlanPage from "./PlanPage";
import PlanDetails from "./PlanDetails";
import PlanAdd from "./PlanAdd";

const Plan = () => {
  return (
    <Routes>
      <Route path="*" element={<PlanPage />} />
      <Route path=":id" element={<PlanDetails />} />
      <Route path=":id/add/:groupId" element={<PlanAdd />} />
    </Routes>
  );
};

export default Plan;
