import TechnologLayout from "./DashboardLayouts/TechnologLayout";
import SuperHrLayout from "./DashboardLayouts/SuperHrLayout";
import CuttingMasterLayout from "./DashboardLayouts/CuttingMasterLayout";
import GroupMasterLayout from "./DashboardLayouts/GroupMasterLayout";
import TvLayout from "./DashboardLayouts/TvLayout";
import ConstructorLayout from "./DashboardLayouts/ConstructorLayout";
import OrderManagerLayout from "./DashboardLayouts/OrderManagerLayout";
import { Outlet } from "react-router-dom";

const layouts = {
  technologist: TechnologLayout,
  superhr: SuperHrLayout,
  cuttingMaster: CuttingMasterLayout,
  groupMaster: GroupMasterLayout,
  tv: TvLayout,
  constructor: ConstructorLayout,
  orderManager: OrderManagerLayout,
};

const DashboardLayout = () => {
  const role = localStorage.getItem("role");
  const LayoutComponent =
    layouts[role] ||
    (() => (
      <div className="text-2xl w-screen h-screen flex items-center justify-center">
        404 Sahifa topilmadi
      </div>
    ));

  return (
    <LayoutComponent>
      <Outlet />
    </LayoutComponent>
  );
};

export default DashboardLayout;
