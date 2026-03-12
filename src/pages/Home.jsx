import React from "react";
import TailorLevel from "./TailorLevel";
import Profile from "./Profile/Profile";

const levelRoles = ["tailor", "universalTailor"];

const Home = () => {
  const role = localStorage.getItem("role");
  return levelRoles.includes(role) ? <TailorLevel /> : <Profile />;
};

export default Home;
