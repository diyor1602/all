import TechnologLayout from "./DashboardLayouts/TechnologLayout";
import SuperHrLayout from "./DashboardLayouts/SuperHrLayout";
import { Outlet } from "react-router-dom";
import CuttingMasterLayout from "./DashboardLayouts/CuttingMasterLayout";

const renderPage = (role) => {
  if (role === "technologist") {
    return (
      <TechnologLayout>
        <Outlet />
      </TechnologLayout>
    );
  } else if (role === "superhr") {
    return (
      <SuperHrLayout>
        <Outlet />
      </SuperHrLayout>
    );
  } else if (role === "cuttingMaster") {
    return (
      <CuttingMasterLayout>
        <Outlet />
      </CuttingMasterLayout>
    );
  } else {
    return <div>404 Not Found</div>;
  }
};

const DashboardLayout = () => {
  const role = localStorage.getItem("role");

  return <div>{renderPage(role)}</div>;
};

export default DashboardLayout;
