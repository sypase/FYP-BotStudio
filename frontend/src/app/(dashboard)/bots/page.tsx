"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  Plus,
  Search,
  Settings,
  MessageSquare,
  BarChart3,
  MoreHorizontal,
  RefreshCw,
  Check,
  X,
  Clock,
  Zap,
  Globe,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { serverURL } from "@/utils/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface BotType {
  _id: string
  name: string
  description?: string
  botModelId: string
  trainingStatus: "pending" | "completed" | "failed"
  isPublic: boolean
  isActive: boolean
  createdAt: string
  fileId: string
  owner: string
}

export default function BotsPage() {
  const [bots, setBots] = useState<BotType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [newBotName, setNewBotName] = useState("")
  const [selectedScrape, setSelectedScrape] = useState("")
  const [scrapes, setScrapes] = useState<any[]>([])
  const [refreshLoading, setRefreshLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Fetch bots from API
  useEffect(() => {
    const fetchBots = async () => {
      try {
        setLoading(true)
        const response = await fetch(`${serverURL}/bot`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
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
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBots()
  }, [toast])

  // Fetch available scrapes for bot creation
  useEffect(() => {
    const fetchScrapes = async () => {
      try {
        const response = await fetch(`${serverURL}/scrape/history`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        const data = await response.json()
        if (response.ok) {
          setScrapes(data.data)
        }
      } catch (error) {
        console.error("Error fetching scrapes:", error)
      }
    }

    fetchScrapes()
  }, [])

  const handleCreateBot = async () => {
    if (!selectedScrape || !newBotName) {
      toast({
        title: "Error",
        description: "Please provide both a name and select a scrape",
        variant: "destructive",
      })
      return
    }

    try {
      setIsCreating(true)
      const response = await fetch(`${serverURL}/bot/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          scrapeId: selectedScrape,
          name: newBotName,
        }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Success",
          description: "Bot creation started successfully",
        })
        setBots((prev) => [data.data.bot, ...prev])
        setNewBotName("")
        setSelectedScrape("")
      } else {
        throw new Error(data.message || "Failed to create bot")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleCheckStatus = async (botId: string) => {
    try {
      setRefreshLoading(true)
      const response = await fetch(`${serverURL}/bot/finetunestatus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ botId }),
      })

      const data = await response.json()
      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Training status: ${data.data.status}`,
        })
        setBots((prev) => prev.map((bot) => (bot._id === botId ? { ...bot, ...data.data } : bot)))
      } else {
        throw new Error(data.message || "Failed to check status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setRefreshLoading(false)
    }
  }

  const filteredBots = bots.filter((bot) => {
    const matchesSearch =
      bot.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bot.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const activeBots = filteredBots.filter((bot) => bot.trainingStatus === "completed")
  const pendingBots = filteredBots.filter((bot) => bot.trainingStatus === "pending")
  const failedBots = filteredBots.filter((bot) => bot.trainingStatus === "failed")

  if (loading) {
    return (
      <div className="p-6 dark:bg-gray-950 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white">My Bots</h1>
          <Button disabled className="bg-gray-800 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create New Bot
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse" />
                  <div className="h-8 w-8 rounded-full bg-gray-700 animate-pulse" />
                </div>
                <div className="h-6 w-3/4 bg-gray-700 animate-pulse rounded" />
                <div className="h-4 w-full bg-gray-700 animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-700 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-gray-700 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-gray-700 animate-pulse rounded" />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-full bg-gray-700 animate-pulse rounded" />
                ))}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 dark:bg-gray-950 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">My Bots</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black">
              <Plus className="h-4 w-4 mr-2" />
              Create New Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Bot</DialogTitle>
              <DialogDescription className="text-gray-300">
                Create a new bot using your scraped data
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="text-gray-300">Bot Name</Label>
                <Input
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Enter bot name"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-gray-300">Select Scrape</Label>
                <Select value={selectedScrape} onValueChange={setSelectedScrape}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select a scrape" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-800">
                    {scrapes.map((scrape) => (
                      <SelectItem
                        key={scrape._id}
                        value={scrape._id}
                        className="text-gray-300 hover:bg-gray-800"
                      >
                        {scrape.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                className="bg-black hover:bg-white text-white hover:text-black border border-black hover:border-black"
                onClick={handleCreateBot}
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Bot"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            className="pl-10 bg-gray-800 border-gray-700 text-white"
            placeholder="Search bots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="all" className="text-gray-300 data-[state=active]:text-white">
            All Bots
          </TabsTrigger>
          <TabsTrigger value="active" className="text-gray-300 data-[state=active]:text-white">
            Active
          </TabsTrigger>
          <TabsTrigger value="pending" className="text-gray-300 data-[state=active]:text-white">
            Pending
          </TabsTrigger>
          <TabsTrigger value="failed" className="text-gray-300 data-[state=active]:text-white">
            Failed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBots.map((bot) => (
              <BotCard
                key={bot._id}
                bot={bot}
                onCheckStatus={handleCheckStatus}
                refreshLoading={refreshLoading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeBots.map((bot) => (
              <BotCard
                key={bot._id}
                bot={bot}
                onCheckStatus={handleCheckStatus}
                refreshLoading={refreshLoading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {pendingBots.map((bot) => (
              <BotCard
                key={bot._id}
                bot={bot}
                onCheckStatus={handleCheckStatus}
                refreshLoading={refreshLoading}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {failedBots.map((bot) => (
              <BotCard
                key={bot._id}
                bot={bot}
                onCheckStatus={handleCheckStatus}
                refreshLoading={refreshLoading}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BotCard({
  bot,
  onCheckStatus,
  refreshLoading,
}: {
  bot: BotType
  onCheckStatus: (id: string) => void
  refreshLoading: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()

  const getStatusBadge = () => {
    switch (bot.trainingStatus) {
      case "completed":
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Training
          </Badge>
        )
      case "failed":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/20">
            <X className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`${serverURL}/bot/${bot._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Bot deleted successfully",
        })
        router.refresh()
      } else {
        throw new Error("Failed to delete bot")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-white">{bot.name}</CardTitle>
              <CardDescription className="text-gray-400">
                {bot.description || "No description"}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-900 border-gray-800">
              <DropdownMenuLabel className="text-white">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem
                className="text-gray-300 hover:bg-white hover:text-black"
                onClick={() => router.push(`/bots/${bot._id}/settings`)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-white hover:text-black"
                onClick={() => router.push(`/bots/${bot._id}/chat`)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-300 hover:bg-white hover:text-black"
                onClick={() => router.push(`/bots/${bot._id}/analytics`)}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-800" />
              <DropdownMenuItem
                className="text-red-400 hover:bg-white hover:text-red-600"
                onClick={handleDelete}
              >
                <X className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {getStatusBadge()}
          {bot.isPublic && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/20">
              <Globe className="h-3 w-3 mr-1" />
              Public
            </Badge>
          )}
          {bot.isActive && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/20">
              <Zap className="h-3 w-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
          onClick={() => router.push(`/bots/${bot._id}/chat`)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Chat
        </Button>
        {bot.trainingStatus === "pending" && (
          <Button
            variant="outline"
            className="flex-1 bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
            onClick={() => onCheckStatus(bot._id)}
            disabled={refreshLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshLoading ? "animate-spin" : ""}`} />
            Check Status
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
