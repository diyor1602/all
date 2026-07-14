import BaseLayout from "./BaseLayout";
import { CloudDownload, PackageOpen, TruckElectric } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/packageMaster/spec",
    icon: PackageOpen,
    onMobile: true,
  },
  {
    name: "Excel",
    href: "/packageMaster/excel-download",
    icon: CloudDownload,
    onMobile: true,
  },
  {
    name: "Jo'natma",
    href: "/packageMaster/truck",
    icon: TruckElectric,
    onMobile: true,
  },
];

export default function PackageMasterLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
