"use client";

import { useState, useEffect } from "react";
import { serverURL } from "@/utils/utils";
import axios from "axios";
import { toast } from "react-toastify";
import { FiEye, FiBarChart2, FiPieChart, FiTrendingUp } from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface Transaction {
  _id: string;
  amount: number;
  userId: {
    name: string;
    email: string;
  };
  botId: {
    name: string;
  };
  status: string;
  stripePaymentId: string;
  createdAt: string;
}

interface BotAnalytics {
  botInteractions: Array<{
    botId: string;
    botName: string;
    totalInteractions: number;
    totalRevenue: number;
    averageRating: number;
    category: string;
    isPublic: boolean;
  }>;
  dailyInteractions: Array<{
    date: string;
    botName: string;
    count: number;
  }>;
  categoryStats: Array<{
    _id: string;
    totalInteractions: number;
    totalRevenue: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<BotAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");
      const [transactionsRes, analyticsRes] = await Promise.all([
        axios.get(`${serverURL}/admin/transactions`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${serverURL}/admin/bot-analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const formattedTransactions = transactionsRes.data.map((transaction: any) => ({
        ...transaction,
        userId: transaction.userId || { name: 'Unknown User', email: 'No email' },
        botId: transaction.botId || { name: 'Unknown Bot' },
        amount: transaction.amount || 0
      }));

      setTransactions(formattedTransactions);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      toast.error("Error fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Bot Analytics & Transactions</h1>
      </div>

      {/* Analytics Section */}
      {analytics && (
        <div className="space-y-8 mb-8">
          {/* Daily Interactions Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FiTrendingUp className="mr-2" />
              Daily Bot Interactions (Last 30 Days)
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyInteractions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="Interactions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bot Performance Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FiBarChart2 className="mr-2" />
              Bot Performance
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.botInteractions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="botName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalInteractions" fill="#8884d8" name="Total Interactions" />
                  <Bar dataKey="totalRevenue" fill="#82ca9d" name="Total Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <FiPieChart className="mr-2" />
              Interactions by Category
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryStats}
                    dataKey="totalInteractions"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label
                  >
                    {analytics.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <h2 className="text-xl font-bold p-6">Recent Transactions</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bot
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <tr key={transaction._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {transaction.userId?.name || 'Unknown User'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {transaction.userId?.email || 'No email'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {transaction.botId?.name || 'Unknown Bot'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${(transaction.amount || 0).toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : transaction.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {transaction.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedTransaction(transaction);
                      setIsViewModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <FiEye className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Transaction Modal */}
      {isViewModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Transaction Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">User</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTransaction.userId?.name || 'Unknown User'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedTransaction.userId?.email || 'No email'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bot</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTransaction.botId?.name || 'Unknown Bot'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Amount</h3>
                <p className="mt-1 text-sm text-gray-900">
                  ${(selectedTransaction.amount || 0).toFixed(2)}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Status</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTransaction.status}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Payment ID
                </h3>
                <p className="mt-1 text-sm text-gray-900">
                  {selectedTransaction.stripePaymentId}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedTransaction.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 