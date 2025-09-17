"use client";

import {useState} from "react";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useSelector, useDispatch} from "react-redux";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {logout} from "@/lib/slices/authSlice";
import {
  LayoutDashboard,
  Truck,
  Route,
  CreditCard,
  Wrench,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
  CarFront,
  CircleUser,
  Torus,
  LifeBuoy,
  ScrollText,
} from "lucide-react";
import {authApi} from "@/lib/api";
import toast from "react-hot-toast";
import Image from "next/image";
// import { Badge } from "components/ui/badge";
const logo = require("../../public/logo.jpg");
const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Vehicles",
    href: "/vehicles",
    icon: Truck,
  },
  {
    name: "Trips",
    href: "/trips",
    icon: Route,
  },
 {
    name: "Clients",
    href: "/clients",
    icon: User,
  },

  {
    name: "Drivers",
    href: "/drivers",
    icon: LifeBuoy,
  },
 {
    name: "Expenses",
    href: "/expense",
    icon: CreditCard,
  },
  {
    
    name: "Fleet Owners",
    href: "/fleetowners",
    icon: CircleUser,
  },
  // {
  //   name: "Maintenance",
  //   href: "/maintenance",
  //   icon: Wrench,
  // },
  // {
  //   name: "Users",
  //   href: "/users",
  //   icon: Users,
  // },
  // {
  //   name: "Reports",
  //   href: "/reports",
  //   icon: FileText,
  // },
  {
    name: "Logs",
    href: "/logs",
    icon: ScrollText,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const dispatch = useDispatch();
  const {user} = useSelector((state) => state.auth);

  const handleLogout = async () => {
    try {
      const res = await authApi.logout();
      console.log(res)
      res && (dispatch(logout()), toast.success("Logged out successfully"));
    } catch (error) {}
  };

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center">
            {/* <Truck className="h-8 w-8 text-primary" />
            <span className="font-bold text-lg">BUTS</span> */}
            <Image src={logo} width={80} height={80} alt="logo" />
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0">
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start my-0.5",
                  collapsed && "px-2",
                  isActive && "bg-primary text-primary-foreground"
                )}>
                <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                {!collapsed && <span>{item.name}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t">
        {!collapsed && user && (
          <div className="mb-4">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <Badge variant="secondary" className="mt-1 text-xs">
              {user.role}
            </Badge>
          </div>
        )}
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            "w-full justify-start text-destructive hover:text-destructive",
            collapsed && "px-2"
          )}>
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
