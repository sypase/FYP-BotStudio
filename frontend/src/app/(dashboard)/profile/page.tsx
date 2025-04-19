'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { serverURL } from '@/utils/utils';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Name</h3>
                <p>{user?.name}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Email</h3>
                <p>{user?.email}</p>
              </div>
              <div>
                <h3 className="text-lg font-medium">Account Type</h3>
                <p className="capitalize">{user?.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credits</CardTitle>
            <CardDescription>Your available credits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4 text-black">{credits}</div>
            <Button onClick={handleAddCredits} className="w-full text-black">
              Add Credits
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics">Bot Analytics</TabsTrigger>
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Bot Interactions</CardTitle>
              <CardDescription>Number of interactions per bot</CardDescription>
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
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="botName" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p>No bot interactions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your recent bot interactions</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <Card key={transaction._id}>
                      <CardHeader>
                        <div className="flex justify-between">
                          <CardTitle className="text-lg">{transaction.botName}</CardTitle>
                          <span className={`text-sm ${
                            transaction.status === 'success' ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {transaction.status}
                          </span>
                        </div>
                        <CardDescription>
                          {new Date(transaction.createdAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div>
                            <h4 className="font-medium">Input:</h4>
                            <p className="text-sm">{transaction.input}</p>
                          </div>
                          <div>
                            <h4 className="font-medium">Response:</h4>
                            <p className="text-sm">{transaction.response}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p>No recent transactions</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 