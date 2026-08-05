import TailorLevel from "./TailorLevel";
import DailyResults from "./DailyResults";
import Balance from "./WarehouseManager/Balance/Balance";
import GroupMasterDashboard from "./GroupMaster/GroupMasterDashboard";
import MajorQualityControllerDashboard from "./MajorQualityController/MajorQualityControllerDashboard";

const roleComponents = {
  tailor: TailorLevel,
  universalTailor: TailorLevel,
  warehouseManager: Balance,
  groupMaster: GroupMasterDashboard,
  majorQualityController: MajorQualityControllerDashboard,
};

const Home = () => {
  const role = localStorage.getItem("role");

  const Component =
    (role && Object.hasOwn(roleComponents, role)
      ? roleComponents[role]
      : null) || DailyResults;

  return <Component />;
};

export default Home;
