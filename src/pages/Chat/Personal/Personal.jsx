import { Routes, Route } from "react-router-dom";
import PersonalChat from "./PersonalChat";
import PersonalProfile from "./PersonalProfile";

const Personal = () => {
  return (
    <Routes>
      <Route path="/:id" element={<PersonalChat />} />
      <Route path="/:id/profile" element={<PersonalProfile />} />
    </Routes>
  );
};

export default Personal;
