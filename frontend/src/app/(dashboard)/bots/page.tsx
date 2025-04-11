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
      <div className="p-6 dark:bg-gray-950 dark:text-gray-100 min-h-screen ">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">My Bots</h1>
          <Button disabled className="dark:bg-gray-800 dark:text-gray-100">
            <Plus className="h-4 w-4 mr-2" />
            Create New Bot
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="dark:bg-gray-900 dark:border-gray-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                </div>
                <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 w-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                ))}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 dark:bg-gray-950 dark:text-gray-100 min-h-screen w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">My Bots</h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Manage and interact with your trained AI assistants
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all duration-200 hover:shadow-lg">
              <Plus className="h-4 w-4" />
              Create New Bot
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-gray-900 dark:border-gray-800">
            <DialogHeader>
              <DialogTitle className="dark:text-gray-100">Create New Bot</DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Create a new bot from your existing scrapes
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right dark:text-gray-300">
                  Bot Name
                </Label>
                <Input
                  id="name"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  placeholder="My Awesome Bot"
                  className="col-span-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="scrape" className="text-right dark:text-gray-300">
                  Select Scrape
                </Label>
                <Select value={selectedScrape} onValueChange={setSelectedScrape}>
                  <SelectTrigger className="col-span-3 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
                    <SelectValue placeholder="Select a scrape" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {scrapes.map((scrape) => (
                      <SelectItem
                        key={scrape._id}
                        value={scrape._id}
                        className="dark:text-gray-100 dark:focus:bg-gray-700"
                      >
                        {scrape.name || scrape.url || `Scrape ${new Date(scrape.createdAt).toLocaleDateString()}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={handleCreateBot}
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Bot
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <TabsList className="dark:bg-gray-800">
              <TabsTrigger
                value="all"
                className="dark:data-[state=active]:bg-gray-700 dark:text-gray-300 dark:data-[state=active]:text-white"
              >
                All Bots
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="dark:data-[state=active]:bg-gray-700 dark:text-gray-300 dark:data-[state=active]:text-white"
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="dark:data-[state=active]:bg-gray-700 dark:text-gray-300 dark:data-[state=active]:text-white"
              >
                Training
              </TabsTrigger>
              <TabsTrigger
                value="failed"
                className="dark:data-[state=active]:bg-gray-700 dark:text-gray-300 dark:data-[state=active]:text-white"
              >
                Failed
              </TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground dark:text-gray-400" />
              <Input
                type="search"
                placeholder="Search bots..."
                className="w-full sm:w-[250px] pl-8 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            {filteredBots.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800">
                <Bot className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium dark:text-gray-300 mb-1">No bots found</h3>
                <p className="text-muted-foreground dark:text-gray-500 max-w-md mx-auto">
                  Create your first bot to get started with AI-powered conversations
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredBots.map((bot) => (
                  <BotCard key={bot._id} bot={bot} onCheckStatus={handleCheckStatus} refreshLoading={refreshLoading} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-0">
            {activeBots.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800">
                <Check className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium dark:text-gray-300 mb-1">No active bots found</h3>
                <p className="text-muted-foreground dark:text-gray-500 max-w-md mx-auto">
                  Your active bots will appear here once training is complete
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeBots.map((bot) => (
                  <BotCard key={bot._id} bot={bot} onCheckStatus={handleCheckStatus} refreshLoading={refreshLoading} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            {pendingBots.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800">
                <Clock className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium dark:text-gray-300 mb-1">No bots in training</h3>
                <p className="text-muted-foreground dark:text-gray-500 max-w-md mx-auto">
                  Bots that are currently being trained will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingBots.map((bot) => (
                  <BotCard key={bot._id} bot={bot} onCheckStatus={handleCheckStatus} refreshLoading={refreshLoading} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="failed" className="mt-0">
            {failedBots.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border dark:border-gray-800">
                <X className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium dark:text-gray-300 mb-1">No failed bots</h3>
                <p className="text-muted-foreground dark:text-gray-500 max-w-md mx-auto">
                  Bots that failed during training will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {failedBots.map((bot) => (
                  <BotCard key={bot._id} bot={bot} onCheckStatus={handleCheckStatus} refreshLoading={refreshLoading} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
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
  const { toast } = useToast()
  const router = useRouter()

  const getStatusBadge = () => {
    switch (bot.trainingStatus) {
      case "completed":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="default" className={`flex items-center gap-1 ${bot.isActive ? "bg-green-600 hover:bg-green-700" : "bg-gray-500 hover:bg-gray-600"}`}>
              <Check className="h-3 w-3" />
              {bot.isActive ? "Active" : "Inactive"}
            </Badge>
            {bot.isPublic && (
              <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-500">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            )}
          </div>
        )
      case "pending":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600">
            <Clock className="h-3 w-3" />
            Training
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <X className="h-3 w-3" />
            Failed
          </Badge>
        )
      default:
        return null
    }
  }

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/bot/${bot._id}`, {
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
        // You might want to refresh the bots list here
      } else {
        const data = await response.json()
        throw new Error(data.message || "Failed to delete bot")
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
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md dark:bg-gray-900 dark:border-gray-800 dark:hover:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full text-white">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="dark:text-gray-100">{bot.name}</CardTitle>
              {bot.description && (
                <CardDescription className="mt-1 dark:text-gray-400">{bot.description}</CardDescription>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="dark:bg-gray-900 dark:border-gray-800">
              <DropdownMenuLabel className="dark:text-gray-300">Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => router.push(`/bots/${bot._id}/edit`)}
                className="dark:text-gray-300 dark:focus:bg-gray-800 cursor-pointer"
              >
                Edit Bot
              </DropdownMenuItem>
              <DropdownMenuItem className="dark:text-gray-300 dark:focus:bg-gray-800 cursor-pointer">
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator className="dark:bg-gray-800" />
              <DropdownMenuItem
                className="text-red-500 dark:text-red-400 dark:focus:bg-gray-800 cursor-pointer"
                onClick={handleDelete}
              >
                Delete Bot
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground dark:text-gray-500 mb-1">Status</span>
            {getStatusBadge()}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground dark:text-gray-500 mb-1">Created</span>
            <span className="text-sm dark:text-gray-300">{new Date(bot.createdAt).toLocaleDateString()}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCheckStatus(bot._id)}
            disabled={refreshLoading || bot.trainingStatus === "completed"}
            className="dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 dark:disabled:text-gray-700"
          >
            {refreshLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 border-t dark:border-gray-800 pt-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-700"
                  onClick={() => router.push(`/bots/${bot._id}/chat`)}
                  disabled={bot.trainingStatus !== "completed" || !bot.isActive}
                >
                  <MessageSquare className="h-4 w-4" />
                  Chat
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {bot.trainingStatus !== "completed" 
                ? "Bot is still training" 
                : !bot.isActive 
                  ? "Bot is inactive. Enable it in settings to chat." 
                  : "Chat with this bot"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:bg-gray-900 dark:disabled:text-gray-700"
          onClick={() => router.push(`/bots/${bot._id}/analytics`)}
          disabled={bot.trainingStatus !== "completed"}
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
          onClick={() => router.push(`/bots/${bot._id}/settings`)}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </CardFooter>
    </Card>
  )
}
