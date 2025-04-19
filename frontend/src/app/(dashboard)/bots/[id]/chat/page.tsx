"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Bot, Send, ArrowLeft, RefreshCw, Info, Clock, MoreHorizontal, CreditCard, BarChart3, AlertCircle, Settings, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import TextareaAutosize from "react-textarea-autosize"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { serverURL } from "@/utils/utils"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  isLoading?: boolean
  isTyping?: boolean
  displayedContent?: string
}

interface BotInfo {
  _id: string
  name: string
  description?: string
  trainingStatus: string
  isPublic: boolean
  isActive: boolean
}

export default function BotChatPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null)
  const [isFetchingBot, setIsFetchingBot] = useState(true)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const [showInsufficientCreditsDialog, setShowInsufficientCreditsDialog] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Typing effect for bot messages
  useEffect(() => {
    const typingMessages = messages.filter((m) => m.isTyping && !m.isLoading)

    if (typingMessages.length === 0) return

    const currentMessage = typingMessages[0]
    const fullContent = currentMessage.content
    const displayedContent = currentMessage.displayedContent || ""

    if (displayedContent.length < fullContent.length) {
      const timeoutId = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === currentMessage.id
              ? {
                  ...m,
                  displayedContent: fullContent.substring(0, displayedContent.length + 1),
                }
              : m,
          ),
        )
      }, 15) // Speed of typing

      return () => clearTimeout(timeoutId)
    } else {
      // Typing finished
      setMessages((prev) => prev.map((m) => (m.id === currentMessage.id ? { ...m, isTyping: false } : m)))
    }
  }, [messages])

  // Fetch bot information
  useEffect(() => {
    const fetchBotInfo = async () => {
      try {
        setIsFetchingBot(true)
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

        // Check if bot is active
        if (!data.data.isActive) {
          toast({
            title: "Bot Inactive",
            description: "This bot is currently inactive. Please activate it in the settings.",
            variant: "destructive",
          })
        }

        // Add welcome message with typing effect
        setMessages([
          {
            id: "welcome",
            content: `Hello! I'm ${data.data.name}. How can I assist you today?`,
            sender: "bot",
            timestamp: new Date(),
            isTyping: true,
            displayedContent: "",
          },
        ])
      } catch (error) {
        console.error("Error fetching bot:", error)
        toast({
          title: "Error",
          description: "Failed to load bot information",
          variant: "destructive",
        })
      } finally {
        setIsFetchingBot(false)
      }
    }

    if (id) {
      fetchBotInfo()
    }
  }, [id, toast])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Fetch user credits
  useEffect(() => {
    const fetchUserCredits = async () => {
      try {
        const response = await fetch(`${serverURL}/users`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch user information")
        }

        const data = await response.json()
        setUserCredits(data.user.credits)
      } catch (error) {
        console.error("Error fetching user credits:", error)
      }
    }

    fetchUserCredits()
  }, [])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Check if user has enough credits
    if (userCredits !== null && userCredits < 1) {
      setShowInsufficientCreditsDialog(true)
      return
    }

    // Check if bot is active
    if (!botInfo?.isActive) {
      toast({
        title: "Bot Inactive",
        description: "This bot is currently inactive. Please activate it in the settings.",
        variant: "destructive",
      })
      return
    }

    // Check if bot is ready
    if (botInfo.trainingStatus !== "completed") {
      toast({
        title: "Bot Not Ready",
        description: `Bot training in progress. Current status: ${botInfo.trainingStatus}`,
        variant: "destructive",
      })
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: "user",
      timestamp: new Date(),
    }

    // Add loading message placeholder
    const loadingMessage: Message = {
      id: `loading-${Date.now()}`,
      content: "",
      sender: "bot",
      timestamp: new Date(),
      isLoading: true,
    }

    setMessages((prev) => [...prev, userMessage, loadingMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const response = await fetch(`${serverURL}/bot/interact/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ message: userMessage.content }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to get response from bot")
      }

      // Update user credits
      if (data.userCredits !== undefined) {
        setUserCredits(data.userCredits)
      }

      // Replace loading message with actual response with typing effect
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? {
                id: Date.now().toString(),
                content: data.data.response,
                sender: "bot",
                timestamp: new Date(),
                isTyping: true,
                displayedContent: "",
              }
            : msg,
        ),
      )
    } catch (error) {
      // Replace loading message with error
      setMessages((prev) =>
        prev.map((msg) =>
          msg.isLoading
            ? {
                id: Date.now().toString(),
                content: `Sorry, I encountered an error: ${
                  error instanceof Error ? error.message : "Unknown error occurred"
                }`,
                sender: "bot",
                timestamp: new Date(),
                isTyping: true,
                displayedContent: "",
              }
            : msg,
        ),
      )

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to communicate with the bot",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleAddCredits = () => {
    router.push('/credits')
  }

  if (isFetchingBot) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 blur-lg opacity-70 animate-pulse"></div>
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-black shadow-md">
              <RefreshCw className="h-8 w-8 text-violet-600 animate-spin" />
            </div>
          </div>
          <p className="text-lg font-medium text-gray-200">Loading bot...</p>
        </div>
      </div>
    )
  }

  if (!botInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <Card className="p-8 max-w-md border-0 shadow-xl bg-black border-gray-800 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center">
              <Info className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-100 mb-2">Bot Not Found</h2>
              <p className="text-gray-400">The bot you're looking for doesn't exist or you don't have access to it.</p>
            </div>
            <Button
              onClick={() => router.push("/bots")}
              className="mt-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bots
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold">{botInfo?.name || "Loading..."}</h1>
              <div className="flex items-center gap-2">
                {botInfo && (
                  <>
                    <Badge
                      variant={botInfo.isActive ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        botInfo.isActive ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600"
                      )}
                    >
                      {botInfo.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge
                      variant={botInfo.trainingStatus === "completed" ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        botInfo.trainingStatus === "completed"
                          ? "bg-blue-500 hover:bg-blue-600"
                          : botInfo.trainingStatus === "pending"
                          ? "bg-yellow-500 hover:bg-yellow-600"
                          : "bg-red-500 hover:bg-red-600"
                      )}
                    >
                      {botInfo.trainingStatus === "completed"
                        ? "Ready"
                        : botInfo.trainingStatus === "pending"
                        ? "Training"
                        : "Failed"}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/bots/${id}/analytics`)}
            className="dark:hover:bg-gray-800"
          >
            <BarChart3 className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/bots/${id}/settings`)}
            className="dark:hover:bg-gray-800"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Status Banner */}
      {botInfo && (!botInfo.isActive || botInfo.trainingStatus !== "completed") && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              {!botInfo.isActive
                ? "This bot is currently inactive. Please activate it in the settings to start chatting."
                : botInfo.trainingStatus === "pending"
                ? "Bot training is in progress. You can chat once training is complete."
                : "Bot training has failed. Please check the settings for more information."}
            </p>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            {!botInfo?.isActive ? (
              <>
                <AlertCircle className="h-12 w-12 mb-4 text-yellow-500" />
                <h3 className="text-lg font-semibold mb-2">Bot is Inactive</h3>
                <p className="max-w-md">
                  This bot is currently inactive. Please activate it in the settings to start chatting.
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push(`/bots/${id}/settings`)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Go to Settings
                </Button>
              </>
            ) : botInfo?.trainingStatus !== "completed" ? (
              <>
                <Loader2 className="h-12 w-12 mb-4 animate-spin text-primary" />
                <h3 className="text-lg font-semibold mb-2">Bot is Training</h3>
                <p className="max-w-md">
                  This bot is still being trained. Please wait until training is complete before chatting.
                </p>
              </>
            ) : (
              <>
                <MessageSquare className="h-12 w-12 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                <p className="max-w-md">
                  Send a message to start chatting with your bot. The bot will respond based on its training.
                </p>
              </>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.sender === "user"
                    ? "bg-primary text-black"
                    : "bg-muted"
                }`}
              >
                {message.sender === "user" ? (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <p className="whitespace-pre-wrap">{message.isTyping ? message.displayedContent : message.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t dark:border-gray-800">
        <form
          onSubmit={handleSendMessage}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <TextareaAutosize
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !botInfo?.isActive
                  ? "Bot is inactive. Please activate it in settings to chat."
                  : botInfo?.trainingStatus !== "completed"
                  ? "Bot is still training. Please wait until training is complete."
                  : "Type your message..."
              }
              disabled={!botInfo?.isActive || botInfo?.trainingStatus !== "completed"}
              className="w-full resize-none rounded-md border dark:border-gray-800 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-black"
              rows={1}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={
              !inputMessage.trim() ||
              isLoading ||
              !botInfo?.isActive ||
              botInfo?.trainingStatus !== "completed"
            }
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Insufficient Credits Dialog */}
      <Dialog open={showInsufficientCreditsDialog} onOpenChange={setShowInsufficientCreditsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Insufficient Credits</DialogTitle>
            <DialogDescription>
              You don't have enough credits to interact with this bot. Please add more credits to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInsufficientCreditsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCredits}>
              Add Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
