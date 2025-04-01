import TechnologLayout from "./DashboardLayouts/TechnologLayout";
import SuperHrLayout from "./DashboardLayouts/SuperHrLayout";
import CuttingMasterLayout from "./DashboardLayouts/CuttingMasterLayout";
import TailorMasterLayout from "./DashboardLayouts/TailorMasterLayout";
import { Outlet } from "react-router-dom";

const layouts = {
  technologist: TechnologLayout,
  superhr: SuperHrLayout,
  cuttingMaster: CuttingMasterLayout,
  tailorMaster: TailorMasterLayout,
};

const DashboardLayout = () => {
  const role = localStorage.getItem("role");
  const LayoutComponent = layouts[role] || (() => <div>404 Not Found</div>);

  return (
    <LayoutComponent>
      <Outlet />
    </LayoutComponent>
  );
};

export default DashboardLayout;
