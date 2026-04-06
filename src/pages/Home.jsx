import React from "react";
import TailorLevel from "./TailorLevel";
import DailyResults from "./DailyResults";

const programByRoles = {
  tailor: <TailorLevel />,
  universalTailor: <TailorLevel />,
};

const Home = () => {
  const role = localStorage.getItem("role");
  return programByRoles[role] || <DailyResults />;
};

export default Home;
