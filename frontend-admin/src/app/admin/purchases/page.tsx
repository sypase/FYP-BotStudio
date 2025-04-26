"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FiEye, FiDollarSign } from "react-icons/fi";
import { serverURL } from "@/utils/utils";

interface Purchase {
  _id: string;
  userId: {
    name: string;
    email: string;
  };
  credits: number;
  price: number;
  status: string;
  stripePaymentId: string;
  createdAt: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${serverURL}/admin/purchases`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const formattedPurchases = response.data.map((purchase: any) => ({
        ...purchase,
        userId: {
          name: purchase.userId?.name || 'Unknown User',
          email: purchase.userId?.email || 'No email',
        },
      }));

      setPurchases(formattedPurchases);
    } catch (error: any) {
      console.error('Error fetching purchases:', error);
      if (error.response) {
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          // Redirect to login page
          window.location.href = '/admin';
        } else {
          toast.error(error.response.data.message || 'Failed to fetch purchases');
        }
      } else {
        toast.error('Failed to fetch purchases. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Credit Purchases</h1>
        <div className="flex items-center space-x-2">
          <FiDollarSign className="text-green-500" />
          <span className="text-gray-600">Total Purchases: {purchases.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
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
            {purchases.map((purchase) => (
              <tr key={purchase._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {purchase.userId.name}
                  </div>
                  <div className="text-sm text-gray-500">{purchase.userId.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{purchase.credits}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    ${(purchase.price || 0).toFixed(2)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      purchase.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : purchase.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {purchase.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(purchase.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedPurchase(purchase);
                      setIsModalOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <FiEye className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Purchase Details Modal */}
      {isModalOpen && selectedPurchase && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Purchase Details
              </h3>
              <div className="mt-2 px-7 py-3">
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500">User</h4>
                  <p className="text-sm text-gray-900">{selectedPurchase.userId.name}</p>
                  <p className="text-sm text-gray-500">{selectedPurchase.userId.email}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500">Credits</h4>
                  <p className="text-sm text-gray-900">{selectedPurchase.credits}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500">Price</h4>
                  <p className="text-sm text-gray-900">
                    ${(selectedPurchase.price || 0).toFixed(2)}
                  </p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500">Status</h4>
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedPurchase.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : selectedPurchase.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedPurchase.status}
                  </span>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500">Payment ID</h4>
                  <p className="text-sm text-gray-900">{selectedPurchase.stripePaymentId}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-500">Date</h4>
                  <p className="text-sm text-gray-900">
                    {formatDate(selectedPurchase.createdAt)}
                  </p>
                </div>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 