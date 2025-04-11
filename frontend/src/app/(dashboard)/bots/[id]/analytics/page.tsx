"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BarChart3, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { serverURL } from "@/utils/utils"
import { useToast } from "@/hooks/use-toast"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BotAnalytics {
  totalInteractions: number
  dailyUsage: Array<{
    date: string
    count: number
  }>
  recentInteractions: Array<{
    _id: string
    input: string
    response: string
    createdAt: string
    status: string
    processingTime: number
  }>
  avgResponseTime: number
  successRate: number
}

interface BotInfo {
  _id: string
  name: string
  trainingStatus: string
}

export default function BotAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null)
  const [analytics, setAnalytics] = useState<BotAnalytics | null>(null)

  useEffect(() => {
    const fetchBotInfo = async () => {
      try {
        const response = await fetch(`${serverURL}/bot/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch bot information")
        }

        const data = await response.json()
        setBotInfo(data.data)
      } catch (error) {
        console.error("Error fetching bot info:", error)
        toast({
          title: "Error",
          description: "Failed to load bot information",
          variant: "destructive",
        })
      }
    }

    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`${serverURL}/bot-analytics/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch analytics")
        }

        const data = await response.json()
        setAnalytics(data)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBotInfo()
    fetchAnalytics()
  }, [id, toast])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{botInfo?.name || "Bot Analytics"}</h1>
            <p className="text-muted-foreground">Usage statistics and interaction history</p>
          </div>
        </div>
        <Badge variant={botInfo?.trainingStatus === "completed" ? "default" : "secondary"}>
          {botInfo?.trainingStatus || "Loading"}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalInteractions || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.successRate ? `${Math.round(analytics.successRate)}%` : "0%"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.avgResponseTime ? `${Math.round(analytics.avgResponseTime)}ms` : "0ms"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Usage Trends</TabsTrigger>
          <TabsTrigger value="recent">Recent Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Usage</CardTitle>
              <CardDescription>Number of interactions per day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.dailyUsage || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Interactions</CardTitle>
              <CardDescription>Last 10 interactions with the bot</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.recentInteractions?.map((interaction) => (
                  <Card key={interaction._id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {interaction.status === "success" ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm text-muted-foreground">
                            {formatDate(interaction.createdAt)} at{" "}
                            {formatTime(interaction.createdAt)}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {interaction.processingTime}ms
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium">Input:</span>
                          <p className="text-sm">{interaction.input}</p>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Response:</span>
                          <p className="text-sm">{interaction.response}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!analytics?.recentInteractions || analytics.recentInteractions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No interactions yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 