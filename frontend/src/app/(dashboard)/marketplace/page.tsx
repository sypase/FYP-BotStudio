"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Bot, TrendingUp, Filter, Star, MessageSquare, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { serverURL } from "@/utils/utils"

interface PublicBot {
  _id: string
  name: string
  description?: string
  category: string
  owner: {
    name: string
  }
  totalInteractions: number
  rating: number
  isActive: boolean
}

const categories = [
  "All",
  "Customer Service",
  "Sales",
  "Support",
  "Education",
  "Entertainment",
  "Business",
  "Other"
]

export default function MarketplacePage() {
  const [bots, setBots] = useState<PublicBot[]>([])
  const [trendingBots, setTrendingBots] = useState<PublicBot[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [loading, setLoading] = useState(true)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchBots()
    fetchTrendingBots()
    fetchUserCredits()
  }, [])

  const fetchBots = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${serverURL}/bot/public`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setBots(data.data)
      } else {
        throw new Error(data.message || "Failed to fetch bots")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load bots",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchTrendingBots = async () => {
    try {
      const response = await fetch(`${serverURL}/bot/trending`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setTrendingBots(data.data)
      }
    } catch (error) {
      console.error("Error fetching trending bots:", error)
    }
  }

  const fetchUserCredits = async () => {
    try {
      const response = await fetch(`${serverURL}/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setUserCredits(data.user.credits)
      }
    } catch (error) {
      console.error("Error fetching user credits:", error)
    }
  }

  const handleChat = async (botId: string) => {
    if (userCredits === null || userCredits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "Please purchase credits to chat with this bot",
        variant: "destructive",
      })
      router.push("/credits")
      return
    }

    router.push(`/marketplace/${botId}/chat`)
  }

  const filteredBots = bots.filter((bot) => {
    const matchesSearch = bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bot.description?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "All" || bot.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto py-8 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white">Bot Marketplace</h1>
        <p className="text-gray-400">
          Discover and interact with public bots created by the community
        </p>
      </div>

      {/* Search and Categories */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search bots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-400"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category 
                ? "bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black" 
                : "bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800 hover:text-white"}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Trending Bots */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-white" />
          <h2 className="text-xl font-semibold text-white">Trending Bots</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trendingBots.map((bot) => (
            <Card key={bot._id} className="overflow-hidden bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-800 rounded-full">
                      <Bot className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-white">{bot.name}</CardTitle>
                      {bot.owner?.name && (
                        <CardDescription className="text-gray-400">
                          Created by {bot.owner.name.trim()}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gray-800 text-gray-300">{bot.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4">
                  {bot.description || ""}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" />
                    {bot.totalInteractions}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-400" />
                    {bot.rating.toFixed(1)}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
                  onClick={() => handleChat(bot._id)}
                  disabled={!bot.isActive}
                >
                  {!bot.isActive ? (
                    "Bot Inactive"
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Chat (1 Credit)
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {/* All Bots */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-white" />
          <h2 className="text-xl font-semibold text-white">All Bots</h2>
        </div>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="h-6 w-3/4 bg-gray-800 animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-gray-800 animate-pulse rounded mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 w-full bg-gray-800 animate-pulse rounded mb-2" />
                  <div className="h-4 w-2/3 bg-gray-800 animate-pulse rounded" />
                </CardContent>
                <CardFooter>
                  <div className="h-10 w-full bg-gray-800 animate-pulse rounded" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filteredBots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">No bots found matching your criteria</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBots.map((bot) => (
              <Card key={bot._id} className="overflow-hidden bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-800 rounded-full">
                        <Bot className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white">{bot.name}</CardTitle>
                        {bot.owner?.name && (
                          <CardDescription className="text-gray-400">
                            Created by {bot.owner.name.trim()}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-800 text-gray-300">{bot.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 mb-4">
                    {bot.description || ""}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {bot.totalInteractions}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400" />
                      {bot.rating.toFixed(1)}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
                    onClick={() => handleChat(bot._id)}
                    disabled={!bot.isActive}
                  >
                    {!bot.isActive ? (
                      "Bot Inactive"
                    ) : (
                      <>
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Chat (1 Credit)
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 