import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Users, LogOut, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function BaseLayout({ children, navigation }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  const IMGURL = import.meta.env.VITE_API_URL_Q_IMGPROFILE;
  const imageUrl = localStorage.getItem("imgUrl");

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-xl transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-center border-b px-6">
            <span className="text-xl font-semibold">Vizzano</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto space-y-1 px-3 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Info */}
          <div className="border-t bg-gray-50 p-4">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <img
                    src={`${IMGURL}/${imageUrl}`}
                    alt="User"
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
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-200/60"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Toggle Button */}
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

      {/* Main Content */}
      <main className="flex-1 lg:pl-72 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden z-20">
        <ul className="flex justify-around">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              item.onMobile && (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={cn(
                      "flex flex-col items-center py-2 px-3",
                      isActive ? "text-primary" : "text-gray-500"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
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
