import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context.js";
import {
  Users,
  LogOut,
  Menu,
  X,
  MessageCircleMore,
  MessageSquareMore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/utils/api";
import { Home, PartyPopper, Radical, Sprout, BadgePercent } from "lucide-react";

export default function BaseLayout({ children, navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const isChatPage = location.pathname.startsWith("/chat");

  const imageUrl = localStorage.getItem("imgUrl");
  const hasValidImage = imageUrl && imageUrl !== "null";

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      logout();
    } catch (error) {
      localStorage.clear();
      window.location.href = "/";
    }
  };

  const forAllUsers = [
    { name: "Asosiy", href: "/home", icon: Home, onMobile: true },
    // {
    //   name: "Yangi mavsum",
    //   href: "/dailyPayments",
    //   icon: PartyPopper,
    //   onMobile: false,
    //   dontShow: parseFloat(localStorage.getItem("percentage")) <= 0,
    //   customColor: "text-green-500 hover:bg-green-50",
    // },
    {
      name: "Tikuv KPI",
      href: "/kpi",
      icon: BadgePercent,
      onMobile: false,
    },
    ...navigation,
    {
      name: "Tikuvchilar",
      href: "/tailorRating",
      icon: Sprout,
      onMobile: false,
    },
    // {
    //   name: "Jo'natmalar",
    //   href: "/truck",
    //   icon: Truck,
    //   onMobile: false,
    // },
    {
      name: "Koeffitsiyent",
      href: "/coefficient",
      icon: Radical,
      onMobile: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pointer-events-auto">
      {/* Sidebar trigger button for mobile */}
      {!isChatPage && (
        <div className="lg:hidden fixed top-4 right-4 z-40">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Sidebar backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 z-30 lg:hidden bg-black/80 backdrop-blur-sm transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar for desktop */}
      <div
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-xl transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo section */}
          <Link
            to="/chat"
            className="flex h-16 shrink-0 items-center justify-center border-b px-6 gap-2"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="text-xl font-semibold">Vizzano</span>
            <MessageSquareMore size={20} />
          </Link>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1 px-3 py-4">
              {forAllUsers.map((item, index) => {
                const userId = Number(localStorage.getItem("user_id"));
                const isActive = location.pathname === item.href;
                const canShow =
                  !item.showUsers ||
                  item.showUsers.length === 0 ||
                  item.showUsers.includes(userId);

                if (!canShow) return null;
                if (item.dontShow) return null;

                return (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : item.customColor || "text-gray-700 hover:bg-gray-100",
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive
                          ? "text-primary"
                          : "text-gray-500" + item.customColor,
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User section */}
          <div className="border-t bg-gray-50 p-4">
            <Link
              to="/profile"
              className="flex items-center gap-3 mb-4 px-2"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                {hasValidImage ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <Users className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {localStorage.getItem("username")}
                </p>
                <p className="text-xs text-gray-500">
                  {localStorage.getItem("name")}
                </p>
              </div>
            </Link>
            <Button
              asChild
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-200/60 mb-2"
              onClick={() => setSidebarOpen(false)}
            >
              <Link to="/issue">
                <MessageCircleMore className="h-4 w-4" />
                Muammo bildirish
              </Link>
            </Button>
            <hr className="my-2" />
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-200/60"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={cn("lg:pl-64 pb-16 lg:pb-0", isChatPage ? "pb-0" : "")}>
        <main
          className={cn(
            "min-h-screen py-8 px-4 sm:px-6 lg:px-8",
            isChatPage ? "p-0" : "",
          )}
        >
          {children}
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden z-20",
          isChatPage ? "hidden" : "",
        )}
      >
        <ul className="flex justify-around">
          {forAllUsers.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              item.onMobile &&
              !item.dontShow && (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex flex-col items-center py-2 px-3",
                      isActive
                        ? "text-primary"
                        : item.customColor || "text-gray-500",
                    )}
                  >
                    <item.icon className={"h-6 w-6 " + item.customColor} />
                    <span className="text-xs mt-1">{item.name}</span>
                  </Link>
                </li>
              )
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
