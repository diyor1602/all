import BaseLayout from "./BaseLayout";
import { PackageOpen } from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/constructor/orders",
    icon: PackageOpen,
    onMobile: true,
  },
];

export default function ConstructorLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
