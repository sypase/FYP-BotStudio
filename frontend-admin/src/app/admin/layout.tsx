"use client";
import axios from 'axios';
import Link from 'next/link';
import { usePathname, useRouter } from "next/navigation";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
import { appName, serverURL } from '@/utils/utils';
import React, { useEffect, useState } from 'react';
import { FiArrowLeft, FiCreditCard, FiDollarSign, FiHome, FiLogOut, FiMoreHorizontal, FiShoppingCart, FiUser, FiUsers, FiBox } from "react-icons/fi";
import { GrTransaction } from "react-icons/gr";
import { GiWhirlpoolShuriken } from "react-icons/gi";
import { IoIosStats } from "react-icons/io";
import { MdOutlineWorkspaces } from "react-icons/md";
import { FaFileInvoice } from "react-icons/fa";
import {
  Users,
  Bot,
  CreditCard,
  Activity,
  LogOut,
  Home,
  Settings,
  User,
} from "lucide-react";

interface UserInfo {
  name: string;
  email: string;
  type: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [showMenu, setShowMenu] = useState(true);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const pathName = usePathname();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/admin");
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const response = await axios.get(`${serverURL}/admin/info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUserInfo(response.data);
      } catch (error) {
        toast.error("Error fetching user info");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/admin");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white fixed h-full">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <div className="mt-4 flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-full">
              <User className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">{userInfo?.name}</p>
              <p className="text-xs text-gray-400">{userInfo?.email}</p>
              <p className="text-xs text-blue-400 capitalize">{userInfo?.type}</p>
            </div>
          </div>
        </div>
        <nav className="mt-4">
          <a
            href="/admin/dashboard"
            className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 ${pathName === '/admin/dashboard' ? 'bg-gray-700' : ''}`}
          >
            <Home className="w-5 h-5 mr-2" />
            Dashboard
          </a>
          <a
            href="/admin/users"
            className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 ${pathName === '/admin/users' ? 'bg-gray-700' : ''}`}
          >
            <Users className="w-5 h-5 mr-2" />
            Users
          </a>
          <a
            href="/admin/bots"
            className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 ${pathName === '/admin/bots' ? 'bg-gray-700' : ''}`}
          >
            <Bot className="w-5 h-5 mr-2" />
            Bots
          </a>
          <a
            href="/admin/transactions"
            className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 ${pathName === '/admin/transactions' ? 'bg-gray-700' : ''}`}
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Bot Transactions
          </a>
          <a
            href="/admin/purchases"
            className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 ${pathName === '/admin/purchases' ? 'bg-gray-700' : ''}`}
          >
            <FiShoppingCart className="w-5 h-5 mr-2" />
            Credit Purchases
          </a>
          <a
            href="/admin/settings"
            className={`flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 ${pathName === '/admin/settings' ? 'bg-gray-700' : ''}`}
          >
            <Settings className="w-5 h-5 mr-2" />
            Settings
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-gray-300 hover:bg-gray-700 mt-4"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {children}
      </div>
      <ToastContainer position="bottom-right" />
    </div>
  )
}
