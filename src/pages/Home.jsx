import TailorLevel from "./TailorLevel";
import DailyResults from "./DailyResults";

const tailorRoles = new Set(["tailor", "universalTailor"]);

const Home = () => {
  const role = localStorage.getItem("role");
  return tailorRoles.has(role) ? <TailorLevel /> : <DailyResults />;
};

export default Home;
