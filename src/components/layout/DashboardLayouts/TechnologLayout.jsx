import BaseLayout from "./BaseLayout";
import { Box, Bot, Plane, Users, CirclePlay } from "lucide-react";

const navigation = [
  {
    name: "Xodimlar",
    href: "/technologist/employees",
    icon: Users,
    onMobile: false,
    showUsers: [621],
  },
  {
    name: "Buyurtmalar",
    href: "/technologist/orders",
    icon: Box,
    onMobile: true,
  },
  // {
  //   name: "Videolar",
  //   href: "/technologist/videos",
  //   icon: CirclePlay,
  //   onMobile: true,
  // },
  // {
  //   name: "Mashinalar",
  //   href: "/technologist/machines",
  //   icon: Bot,
  //   onMobile: false,
  // },
  // {
  //   name: "Nakladnoy",
  //   href: "/technologist/nakladnoy",
  //   icon: Plane,
  //   onMobile: false,
  // },
];

export default function TechnologLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
