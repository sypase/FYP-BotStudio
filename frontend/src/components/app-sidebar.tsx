"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";
import { Bot, Home, LogOut, AudioWaveform, User, CreditCard, FileSearch, Clock, MessageSquare, Calculator, Store, Key, Settings } from "lucide-react";

// Removed the useTheme import and the Sun/Moon icons
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import { serverURL } from "@/utils/utils";

export default function AppSidebar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string; credits: number } | null>(
    null
  );
  const [credits, setCredits] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await axios.get(`${serverURL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(response.data.user);
      } catch (error) {
        console.error("Failed to fetch user data", error);
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status === 401
        ) {
          localStorage.removeItem("token");
          router.push("/login");
        }
      }
    };

    const fetchCredits = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const response = await axios.get(`${serverURL}/credits/available`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCredits(response.data.credits);
      } catch (error) {
        console.error("Failed to fetch credits", error);
      }
    };

    // Listen for credits updated event
    const handleCreditsUpdated = (event: CustomEvent) => {
      setCredits(event.detail.credits);
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdated as EventListener);

    fetchUserData();
    fetchCredits();

    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdated as EventListener);
    };
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard", 
      icon: Home,
    },
    {
      title: "My Bots",
      href: "/bots",
      icon: Bot,
    },
    {
      title: "Scrapper",
      href: "/scraper",
      icon: FileSearch,
    },
    {
      title: "Auto Scraper", 
      href: "/auto-scraper",
      icon: Clock,
    },
    {
      title: "Chat",
      href: "/conversations",
      icon: MessageSquare,
    },
    {
      title: "Token Counter",
      href: "/token-counter",
      icon: Calculator,
    },
    {
      title: "Shop",
      href: "/credits",
      icon: CreditCard,
    },
    {
      title: "Marketplace",
      href: "/marketplace",
      icon: Store,
    },
    {
      title: "API Keys",
      href: "/api-keys",
      icon: Key,
    },
    {
      title: "Profile",
      href: "/profile",
      icon: User,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  if (!user) {
    return null; // or return a loading spinner if preferred
  }

  return (
    <>
      <Sidebar className="dark bg-gray-900">
        <SidebarHeader className="border-b border-gray-800">
          <div className="flex items-center px-2 py-3">
            <Link href="/" className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                BotStudio
              </span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-gray-400">Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      tooltip={item.title}
                      className="text-gray-300 hover:text-white"
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-gray-800 p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">
                Hello, {user.name}
              </span>
              <span className="text-sm text-gray-400">
                {user.email}
              </span>
              <span className="text-sm text-primary font-medium mt-1">
                Credits: {credits}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2 text-gray-300 hover:text-white hover:bg-gray-800"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span>Log Out</span>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Mobile sidebar trigger */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <SidebarTrigger />
      </div>
    </>
  );
}
