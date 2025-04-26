'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { serverURL } from '@/utils/utils';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CreditCard } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { formatDistanceToNow } from "date-fns";

interface UserProfile {
  name: string;
  email: string;
  credits: number;
  type: string;
}

interface BotInteraction {
  botId: string;
  botName: string;
  count: number;
}

interface BotTransaction {
  _id: string;
  botId: string;
  botName: string;
  input: string;
  response: string;
  createdAt: string;
  status: string;
}

interface BotAnalytics {
  botId: string;
  botName: string;
  isPublic: boolean;
  isActive: boolean;
  category: string;
  totalInteractions: number;
  successRate: number;
  errorRate: number;
  avgProcessingTime: number;
  lastInteraction: string | null;
}

interface AnalyticsData {
  totalInteractions: number;
  botAnalytics: BotAnalytics[];
  dailyUsage: { date: string; count: number }[];
  summary: {
    totalBots: number;
    activeBots: number;
    publicBots: number;
    averageSuccessRate: number;
  };
}

interface CreditTransaction {
  _id: string;
  amount: number;
  price: number;
  status: string;
  stripePaymentId: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [botInteractions, setBotInteractions] = useState<BotInteraction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<BotTransaction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
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
        console.error('Failed to fetch user data', error);
        if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
          localStorage.removeItem('token');
          router.push('/login');
        }
      }
    };

    const fetchCredits = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${serverURL}/credits/available`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setCredits(response.data.credits);
      } catch (error) {
        console.error('Failed to fetch credits', error);
      }
    };

    // Listen for credits updated event
    const handleCreditsUpdated = (event: CustomEvent) => {
      setCredits(event.detail.credits);
    };

    window.addEventListener('creditsUpdated', handleCreditsUpdated as EventListener);

    const fetchBotInteractions = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${serverURL}/bot-analytics/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.interactions) {
          setBotInteractions(response.data.interactions);
        }
      } catch (error) {
        console.error('Failed to fetch bot interactions', error);
      }
    };

    const fetchRecentTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${serverURL}/bot-transactions/recent`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.transactions) {
          setRecentTransactions(response.data.transactions);
        }
      } catch (error) {
        console.error('Failed to fetch recent transactions', error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchBotAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await axios.get(`${serverURL}/bot-analytics/user/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setAnalytics(response.data.data);
          setBotInteractions(response.data.data.botAnalytics);
        }
      } catch (error) {
        console.error("Failed to fetch bot analytics", error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    const fetchCreditTransactions = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${serverURL}/credits/transactions`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setCreditTransactions(response.data.transactions);
        }
      } catch (error) {
        console.error('Failed to fetch credit transactions', error);
      }
    };

    fetchUserData();
    fetchCredits();
    fetchBotInteractions();
    fetchRecentTransactions();
    fetchBotAnalytics();
    fetchCreditTransactions();

    return () => {
      window.removeEventListener('creditsUpdated', handleCreditsUpdated as EventListener);
    };
  }, [router]);

  const handleAddCredits = () => {
    router.push('/credits');
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen dark:bg-gray-950 text-white">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8 dark:bg-gray-950 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Profile</CardTitle>
            <CardDescription className="text-gray-400">Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white">Name</h3>
                <p className="text-gray-300">{user?.name}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Email</h3>
                <p className="text-gray-300">{user?.email}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">Account Type</h3>
                <p className="capitalize text-gray-300">{user?.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Credits</CardTitle>
            <CardDescription className="text-gray-400">Your available credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4 text-white">{credits}</div>
            <Button 
              onClick={handleAddCredits} 
              className="w-full bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Add Credits
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-900 border-gray-800">
          <TabsTrigger 
            value="analytics" 
            className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-800"
          >
            Bot Analytics
          </TabsTrigger>
          <TabsTrigger 
            value="transactions" 
            className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-800"
          >
            Bot Transactions
          </TabsTrigger>
          <TabsTrigger 
            value="credits" 
            className="text-gray-300 data-[state=active]:text-white data-[state=active]:bg-gray-800"
          >
            Credit History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analytics">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Bot Interactions</CardTitle>
              <CardDescription className="text-gray-400">Number of interactions per bot</CardDescription>
            </CardHeader>
            <CardContent>
              {analytics && analytics.botAnalytics && analytics.botAnalytics.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics.botAnalytics}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="botName" stroke="#9CA3AF" />
                      <YAxis dataKey="totalInteractions" stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          color: '#F3F4F6'
                        }}
                      />
                      <Bar dataKey="totalInteractions" name="Total Interactions" fill="#6366F1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400">No bot interactions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <CardDescription className="text-gray-400">Your recent bot interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <Card key={transaction._id} className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <div className="flex justify-between">
                          <CardTitle className="text-lg text-white">{transaction.botName}</CardTitle>
                          <span className={`text-sm ${
                            transaction.status === 'success' ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                        <CardDescription className="text-gray-400">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <h4 className="text-sm font-medium text-white">Input:</h4>
                            <p className="text-sm text-gray-300">{transaction.input}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-white">Response:</h4>
                            <p className="text-sm text-gray-300">{transaction.response}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No recent transactions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="credits">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Credit Transactions</CardTitle>
              <CardDescription className="text-gray-400">Your credit purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              {creditTransactions.length > 0 ? (
                <div className="space-y-4">
                  {creditTransactions.map((transaction) => (
                    <Card key={transaction._id} className="bg-gray-800 border-gray-700">
                      <CardHeader>
                        <div className="flex justify-between">
                          <CardTitle className="text-lg text-white">
                            {transaction.amount} Credits
                          </CardTitle>
                          <span className={`text-sm ${
                            transaction.status === 'completed' ? 'text-green-400' : 
                            transaction.status === 'pending' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                        <CardDescription className="text-gray-400">
                          {new Date(transaction.createdAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-300">Price:</span>
                            <span className="text-sm text-white">${transaction.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-300">Payment ID:</span>
                            <span className="text-sm text-white">{transaction.stripePaymentId}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No credit transactions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bot Analytics Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-6 text-white">Bot Analytics</h2>
        
        {loadingAnalytics ? (
          <div className="text-center">Loading analytics...</div>
        ) : analytics ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Total Bots</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{analytics.summary.totalBots}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Active Bots</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{analytics.summary.activeBots}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Public Bots</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">{analytics.summary.publicBots}</p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg text-white">Avg. Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-white">
                    {analytics.summary.averageSuccessRate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Bot Analytics Table */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Bot Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-800">
                        <th className="p-4 text-white">Bot Name</th>
                        <th className="p-4 text-white">Status</th>
                        <th className="p-4 text-white">Interactions</th>
                        <th className="p-4 text-white">Success Rate</th>
                        <th className="p-4 text-white">Avg. Response Time</th>
                        <th className="p-4 text-white">Last Interaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.botAnalytics.map((bot) => (
                        <tr key={bot.botId} className="border-b border-gray-800">
                          <td className="p-4 text-white">{bot.botName}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              bot.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {bot.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="p-4 text-white">{bot.totalInteractions}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={bot.successRate} 
                                className="w-24 bg-gray-700"
                              />
                              <span className="text-white">{bot.successRate.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-white">{bot.avgProcessingTime.toFixed(0)}ms</td>
                          <td className="p-4 text-white">
                            {bot.lastInteraction 
                              ? formatDistanceToNow(new Date(bot.lastInteraction), { addSuffix: true })
                              : 'Never'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Daily Usage Chart */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-white">Daily Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {/* Add your chart component here */}
                  <div className="flex items-end h-full gap-2">
                    {analytics.dailyUsage.map((day) => (
                      <div 
                        key={day.date} 
                        className="flex-1 bg-blue-600"
                        style={{ height: `${(day.count / Math.max(...analytics.dailyUsage.map(d => d.count))) * 100}%` }}
                      >
                        <div className="text-xs text-center text-white mt-2">
                          {new Date(day.date).toLocaleDateString()}
                          <br />
                          {day.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center text-white">No analytics data available</div>
        )}
      </div>
    </div>
  );
} 