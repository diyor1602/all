import BaseLayout from "./BaseLayout";
import { PackageOpen, TruckElectric } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/packageMaster/spec",
    icon: PackageOpen,
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
