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

  const imageUrl = localStorage.getItem("imgUrl");
  const hasValidImage = imageUrl && imageUrl !== "null";

  return (
    <div className="min-h-screen bg-gray-50">
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

      {/* Sidebar backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 z-30 lg:hidden bg-black/80 backdrop-blur-sm transition-opacity duration-200",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar for desktop */}
      <div
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-xl transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo section */}
          <div className="flex h-16 shrink-0 items-center justify-center border-b px-6">
            <span className="text-xl font-semibold">Vizzano</span>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="space-y-1 px-3 py-4">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-primary" : "text-gray-500"
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
            <Link to="/profile" className="flex items-center gap-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
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
              variant="ghost"
              className="w-full justify-start gap-3 text-gray-700 hover:bg-gray-200/60"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Chiqish
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 pb-16 lg:pb-0">
        <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t lg:hidden  z-20">
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
