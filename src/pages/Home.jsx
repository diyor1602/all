import TailorLevel from "./TailorLevel";
import DailyResults from "./DailyResults";
import Balance from "./WarehouseManager/Balance/Balance";

const Home = () => {
  const role = localStorage.getItem("role");

  switch (role) {
    case "tailor":
    case "universalTailor":
      return <TailorLevel />;

    case "warehouseManager":
      return <Balance />;

    default:
      return <DailyResults />;
  }
};

export default Home;
