import BaseLayout from "./BaseLayout";
import {
  Box,
  Earth,
  Sprout,
  Users,
  FileText,
  CalendarSync,
} from "lucide-react";

const navigation = [
  {
    name: "Buyurtmalar",
    href: "/technologist/orders",
    icon: Box,
    onMobile: true,
  },
  {
    name: "Xodimlar",
    href: "/technologist/employees",
    icon: Users,
    onMobile: true,
  },
  {
    name: "Farq",
    href: "/technologist/difference-ru",
    icon: Earth,
    onMobile: false,
  },
  {
    name: "RU dublikatlar",
    href: "/technologist/ru-duplicates",
    icon: FileText,
    onMobile: false,
  },
  {
    name: "Oylik xulosalar",
    href: "/technologist/coef-stat",
    icon: CalendarSync,
    onMobile: false,
  },
  {
    name: "Tikuvchilar",
    href: "/tailorRating",
    icon: Sprout,
    onMobile: false,
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
