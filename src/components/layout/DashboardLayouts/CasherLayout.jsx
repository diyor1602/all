import BaseLayout from "./BaseLayout";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  CircleDollarSign,
  ClipboardCheck,
  Gem,
  Home,
  RefreshCcw,
  UserLock,
} from "lucide-react";

const navigation = [
  { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
  {
    name: "Kirimlar",
    href: "/casher/income",
    icon: BanknoteArrowDown,
    onMobile: true,
  },
  {
    name: "Chiqimlar",
    href: "/casher/outcome",
    icon: BanknoteArrowUp,
    onMobile: true,
  },
  {
    name: "Balans",
    href: "/casher/balance",
    icon: CircleDollarSign,
    onMobile: true,
  },
  {
    name: "Talabnoma",
    href: "/casher/requests",
    icon: ClipboardCheck,
    onMobile: true,
  },
  {
    name: "Oylik",
    href: "/casher/salary",
    icon: Gem,
    onMobile: false,
  },
  {
    name: "AUP",
    href: "/casher/aup",
    icon: UserLock,
    onMobile: false,
  },
];

export default function CasherLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
