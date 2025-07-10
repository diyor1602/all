import NoLayout from "./DashboardLayouts/NoLayout";
import TechnologLayout from "./DashboardLayouts/TechnologLayout";
import SuperHrLayout from "./DashboardLayouts/SuperHrLayout";
import CuttingMasterLayout from "./DashboardLayouts/CuttingMasterLayout";
import GroupMasterLayout from "./DashboardLayouts/GroupMasterLayout";
import GroupHelperLayout from "./DashboardLayouts/GroupHelperLayout";
import TvLayout from "./DashboardLayouts/TvLayout";
import ConstructorLayout from "./DashboardLayouts/ConstructorLayout";
import OrderManagerLayout from "./DashboardLayouts/OrderManagerLayout";
import SupervisorLayout from "./DashboardLayouts/SupervisorLayout";
import TransportLayout from "./DashboardLayouts/TransportLayout";
import WarehouseManagerLayout from "./DashboardLayouts/WarehouseManagerLayout";
import QualityControllerMasterLayout from "./DashboardLayouts/QualityControllerMasterLayout";
import QualityControllerLayout from "./DashboardLayouts/QualityControllerLayout";
import PackageMasterLayout from "./DashboardLayouts/PackageMasterLayout";
import InternalAccountantLayout from "./DashboardLayouts/InternalAccountantLayout";
import SupplierLayout from "./DashboardLayouts/SupplierLayout";
import CasherLayout from "./DashboardLayouts/CasherLayout";
import ResultCheckerLayout from "./DashboardLayouts/ResultCheckerLayout";
import CeoLayout from "./DashboardLayouts/CeoLayout";
import TailorLayout from "./DashboardLayouts/TailorLayout";
import { Outlet } from "react-router-dom";

const layouts = {
  technologist: TechnologLayout,
  warehouseManager: WarehouseManagerLayout,
  superhr: SuperHrLayout,
  cuttingMaster: CuttingMasterLayout,
  groupMaster: GroupMasterLayout,
  groupHelper: GroupHelperLayout,
  tv: TvLayout,
  constructor: ConstructorLayout,
  orderManager: OrderManagerLayout,
  supervisor: SupervisorLayout,
  transport: TransportLayout,
  qualityControllerMaster: QualityControllerMasterLayout,
  qualityController: QualityControllerLayout,
  packageMaster: PackageMasterLayout,
  internalAccountant: InternalAccountantLayout,
  supplier: SupplierLayout,
  casher: CasherLayout,
  resultChecker: ResultCheckerLayout,
  ceo: CeoLayout,
  tailor: TailorLayout,
  nolayout: NoLayout,
};

const DashboardLayout = () => {
  const role = localStorage.getItem("role");
  const LayoutComponent = layouts[role] || NoLayout;

  return (
    <LayoutComponent>
      <Outlet />
    </LayoutComponent>
  );
};

export default DashboardLayout;
