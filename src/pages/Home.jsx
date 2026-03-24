import React from "react";
import TailorLevel from "./TailorLevel";
import Profile from "./Profile/Profile";
import YesterdayAbsence from "./SuperHR/Stats/YesterdayAbsence";

const programByRoles = {
  tailor: <TailorLevel />,
  universalTailor: <TailorLevel />,
  superhr: <YesterdayAbsence />,
};

const Home = () => {
  const role = localStorage.getItem("role");
  return programByRoles[role] || <Profile />;
};

export default Home;
