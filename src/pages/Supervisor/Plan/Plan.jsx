import { Routes, Route } from "react-router-dom";
import PlanPage from "./PlanPage";
import PlanDetails from "./PlanDetails";

const Plan = () => {
  return (
    <Routes>
      <Route path="*" element={<PlanPage />} />
      <Route path=":id" element={<PlanDetails />} />
    </Routes>
  );
};

export default Plan;
