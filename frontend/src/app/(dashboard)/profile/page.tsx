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

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [botInteractions, setBotInteractions] = useState<BotInteraction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<BotTransaction[]>([]);
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
        const response = await axios.get(`${serverURL}/bot-interactions/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setBotInteractions(response.data.interactions);
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

        setRecentTransactions(response.data.transactions);
      } catch (error) {
        console.error('Failed to fetch recent transactions', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    fetchCredits();
    fetchBotInteractions();
    fetchRecentTransactions();

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
        <TabsList className="grid w-full grid-cols-2 bg-gray-900 border-gray-800">
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
            Recent Transactions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="analytics">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Bot Interactions</CardTitle>
              <CardDescription className="text-gray-400">Number of interactions per bot</CardDescription>
            </CardHeader>
            <CardContent>
              {botInteractions.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={botInteractions}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="botName" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937',
                          border: '1px solid #374151',
                          color: '#F3F4F6'
                        }}
                      />
                      <Bar dataKey="count" fill="#6366F1" />
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
      </Tabs>
    </div>
  );
} 