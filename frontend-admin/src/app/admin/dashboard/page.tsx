"use client";

import { useState, useEffect } from "react";
import { serverURL } from "@/utils/utils";
import axios from "axios";
import { toast } from "react-toastify";
import {
  Users,
  Bot,
  CreditCard,
  Activity,
} from "lucide-react";

interface Analytics {
  totalUsers: number;
  totalBots: number;
  totalTransactions: number;
  totalRevenue: number;
}

interface RecentUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface RecentTransaction {
  _id: string;
  amount: number;
  userId: {
    name: string;
    email: string;
  };
  botId: {
    name: string;
  };
  createdAt: string;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${serverURL}/admin/analytics`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAnalytics(response.data.analytics);
        setRecentUsers(response.data.recentUsers);
        setRecentTransactions(response.data.recentTransactions);
      } catch (error) {
        toast.error("Error fetching analytics");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-4" />
            <div>
              <p className="text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{analytics?.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Bot className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <p className="text-gray-500">Total Bots</p>
              <p className="text-2xl font-bold">{analytics?.totalBots}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-purple-500 mr-4" />
            <div>
              <p className="text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold">{analytics?.totalTransactions}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-yellow-500 mr-4" />
            <div>
              <p className="text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">${analytics?.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Users</h2>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <p className="text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction._id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{transaction.userId?.name || 'Unknown User'}</p>
                  <p className="text-sm text-gray-500">
                    {transaction.botId?.name || 'Unknown Bot'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${transaction.amount?.toFixed(2) || '0.00'}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}