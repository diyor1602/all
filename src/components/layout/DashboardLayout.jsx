import TechnologLayout from "./DashboardLayouts/TechnologLayout";
import SuperHrLayout from "./DashboardLayouts/SuperHrLayout";

const renderPage = (role) => {
  if (role === "technologist") {
    return <TechnologLayout />;
  } else if (role === "superhr") {
    return <SuperHrLayout />;
  } else {
    return <div>404 Not Found</div>;
  }
};

const DashboardLayout = () => {
  const role = localStorage.getItem("role");

  return <div>{renderPage(role)}</div>;
};

export default DashboardLayout;
