import React from "react";
import DailyResults from "./DailyResults";
import TailorLevel from "./TailorLevel";

const levelRoles = ["tailor", "universalTailor"];

const Home = () => {
  const role = localStorage.getItem("role");
  return levelRoles.includes(role) ? <TailorLevel /> : <DailyResults />;
};

export default Home;
