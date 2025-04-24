"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Plus, BarChart3, MessageSquare, Users, Activity } from "lucide-react"
import { serverURL } from "@/utils/utils"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface DashboardStats {
  totalBots: number
  activeBots: number
  publicBots: number
  totalInteractions: number
  recentTransactions: Array<{
    _id: string
    botId: {
      _id: string
      name: string
    }
    input: string
    response: string
    status: string
    createdAt: string
    processingTime: number
  }>
}

interface BotTransaction {
  _id: string;
  botId: string;
  botName: string;
  input: string;
  response: string;
  createdAt: string;
  status: string;
  processingTime: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()
  const [recentTransactions, setRecentTransactions] = useState<BotTransaction[]>([])

  useEffect(() => {
    fetchDashboardStats()
    fetchRecentTransactions()
  }, [router])

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${serverURL}/bot/dashboard/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setStats(data.data)
      } else {
        throw new Error(data.message || "Failed to fetch dashboard stats")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentTransactions = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    try {
      const response = await axios.get(`${serverURL}/bot-transactions/recent`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setRecentTransactions(response.data.transactions)
    } catch (error) {
      console.error('Failed to fetch recent transactions', error)
      if (axios.isAxiosError(error) && error.response && error.response.status === 401) {
        localStorage.removeItem('token')
        router.push('/login')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <Button 
          onClick={() => router.push('/bots')}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create New Bot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Bots</CardTitle>
            <Bot className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats?.totalBots || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Bots</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats?.activeBots || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Public Bots</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats?.publicBots || 0}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-800">{stats?.totalInteractions || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg bg-gray-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white">Recent Conversations</CardTitle>
          <CardDescription className="text-gray-300">Your latest bot interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <Card key={transaction._id} className="bg-gray-700 border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-medium text-white">{transaction.botName}</CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                    <CardDescription className="text-gray-300">
                      {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-200 mb-1">Input:</h4>
                        <p className="text-sm bg-gray-600 p-3 rounded-lg border border-gray-500 text-gray-200">
                          {transaction.input}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-200 mb-1">Response:</h4>
                        <p className="text-sm bg-gray-600 p-3 rounded-lg border border-gray-500 text-gray-200">
                          {transaction.response}
                        </p>
                      </div>
                      {transaction.processingTime > 0 && (
                        <div className="text-xs text-gray-400 mt-2">
                          Processing time: {transaction.processingTime}ms
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300">No recent conversations</p>
              <p className="text-sm text-gray-400 mt-2">Start a new conversation with your bots</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => router.push('/bots')}
            className="w-full bg-primary hover:bg-primary/90 text-white"
          >
            Start New Conversation
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

