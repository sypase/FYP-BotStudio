"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Plus, BarChart3, MessageSquare, Users, Activity } from "lucide-react"
import { serverURL } from "@/utils/utils"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

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

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button className="gap-2 text-black">
          <Plus className="h-4 w-4 text-black" />
          Create New Bot
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bots</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalBots || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bots</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeBots || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Bots</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.publicBots || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalInteractions || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentTransactions.map((transaction) => (
              <div key={transaction._id} className="border-b pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{transaction.botId.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    transaction.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}>
                    {transaction.status}
                  </span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">You:</span> {transaction.input}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Bot:</span> {transaction.response}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Processing time: {transaction.processingTime}ms
                </p>
              </div>
            ))}
            {(!stats?.recentTransactions || stats.recentTransactions.length === 0) && (
              <p className="text-center text-muted-foreground">No recent conversations</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

