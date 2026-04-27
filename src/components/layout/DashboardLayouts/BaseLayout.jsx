import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context.js";
import {
  Users,
  LogOut,
  Menu,
  X,
  MessageCircleMore,
  MessageSquareMore,
  Home,
  Radical,
  BadgePercent,
  CircleDollarSign,
  Glasses,
  SquareScissors,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/utils/api";

const damageRoles = ["universalTailor", "tailor"];

const sidebarGradient =
  "linear-gradient(135deg, rgb(10, 14, 26) 0%, rgb(13, 17, 23) 50%, rgb(10, 15, 30) 100%)";

export default function BaseLayout({ children, navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const isChatPage = location.pathname.startsWith("/chat");

  const imageUrl = localStorage.getItem("imgUrl");
  const hasValidImage = imageUrl && imageUrl !== "null";

  const [damageCount, setDamageCount] = useState(0);

  const getDamageCount = async () => {
    if (!damageRoles.includes(localStorage.getItem("role"))) return;

    try {
      const res = await api.get("/pendingFailCount");
      setDamageCount(res.data?.count || 0);
    } catch (error) {
      // ignore
    }
  };

  useEffect(() => {
    getDamageCount();

    const interval = setInterval(() => {
      getDamageCount();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

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
    {
      name: "Asosiy",
      href: "/home",
      icon: Home,
      onMobile: true,
    },
    {
      name: "Yangi mavsum",
      href: "/newSeason",
      icon: CircleDollarSign,
      onMobile: false,
      dontShow: !localStorage.getItem("employee_sum")?.length,
      customColor: "text-emerald-300 hover:text-emerald-200",
    },
    {
      name: "Tikuv KPI",
      href: "/kpi",
      icon: BadgePercent,
      onMobile: false,
    },
    {
      name: "Bichuv KPI",
      href: "/cuttingKpi",
      icon: SquareScissors,
      onMobile: false,
    },
    ...navigation,
    {
      name: "Braklar",
      href: "/damages",
      icon: Glasses,
      onMobile: true,
      dontShow: !damageRoles.includes(localStorage.getItem("role")),
      badge: damageCount > 0 ? damageCount : null,
    },
    {
      name: "Koeffitsiyent",
      href: "/coefficient",
      icon: Radical,
      onMobile: false,
    },
    {
      name: "Todo list",
      href: "/todo",
      icon: ListTodo,
      onMobile: false,
    },
  ];

  return (
    <div
      className="min-h-screen pointer-events-auto"
      style={{ backgroundColor: "#EEF2FA" }}
    >
      {/* Mobile Sidebar Toggle */}
      {!isChatPage && (
        <div className="lg:hidden fixed top-4 right-4 z-50">
          <Button
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: sidebarGradient,
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F8FAFC",
            }}
          >
            {sidebarOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden bg-black/70 backdrop-blur-sm transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 shadow-2xl transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
        style={{
          background: sidebarGradient,
        }}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <Link
            to="/chat"
            className="flex h-16 shrink-0 items-center justify-center gap-2 border-b px-6"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <span className="text-xl font-semibold tracking-wide text-slate-50">
              Vizzano
            </span>

            <MessageSquareMore size={20} className="text-sky-300" />
          </Link>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1 px-3 py-4">
              {forAllUsers.map((item, index) => {
                const isActive = location.pathname === item.href;

                if (item.dontShow) return null;

                return (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "text-white shadow-md"
                        : item.customColor || "text-slate-300 hover:text-white",
                    )}
                    style={{
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.10)"
                        : undefined,
                      backdropFilter: isActive ? "blur(10px)" : undefined,
                      border: isActive
                        ? "1px solid rgba(255,255,255,0.08)"
                        : "1px solid transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(255,255,255,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "";
                      }
                    }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="relative flex items-center">
                      <item.icon
                        className={cn(
                          "h-5 w-5",
                          isActive ? "text-white" : "text-slate-400",
                        )}
                      />

                      {item.badge && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white shadow-lg ring-2 ring-black/40 animate-pulse">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </div>

                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Footer User Section */}
          <div
            className="border-t p-4"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
              backdropFilter: "blur(12px)",
            }}
          >
            <Link
              to="/profile"
              className="mb-4 flex items-center gap-3 rounded-xl px-2 py-2 transition-all duration-200"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "";
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-1"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                {hasValidImage ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Users className="h-4 w-4 text-slate-300" />
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {localStorage.getItem("username")}
                </p>
                <p className="text-xs text-slate-400">
                  {localStorage.getItem("name")}
                </p>
              </div>
            </Link>

            <Button
              asChild
              variant="ghost"
              className="mb-1 w-full justify-start gap-3 text-slate-300 hover:text-white"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "";
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <Link to="/issue">
                <MessageCircleMore className="h-4 w-4 text-slate-400" />
                Muammo bildirish
              </Link>
            </Button>

            <hr
              className="my-2"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
              }}
            />

            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-300 hover:text-white"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255,255,255,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "";
              }}
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 text-slate-400" />
              Chiqish
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("lg:pl-64 pb-16 lg:pb-0", isChatPage ? "pb-0" : "")}>
        <main
          className={cn(
            "min-h-screen px-4 py-8 sm:px-6 lg:px-8",
            isChatPage ? "p-0" : "",
          )}
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-20 border-t lg:hidden",
          isChatPage ? "hidden" : "",
        )}
        style={{
          background: sidebarGradient,
          borderColor: "rgba(255,255,255,0.08)",
        }}
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
                      "flex flex-col items-center px-3 py-2 transition-all duration-200",
                      isActive
                        ? "text-white"
                        : "text-slate-400 hover:text-white",
                    )}
                  >
                    <div className="relative">
                      <item.icon
                        className="h-6 w-6"
                        style={{
                          color: isActive ? "#FFFFFF" : "#94A3B8",
                        }}
                      />

                      {item.badge && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white shadow-lg ring-2 ring-black/40 animate-pulse">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </div>

                    <span
                      className="mt-1 text-xs"
                      style={{
                        color: isActive ? "#FFFFFF" : "#94A3B8",
                      }}
                    >
                      {item.name}
                    </span>
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
