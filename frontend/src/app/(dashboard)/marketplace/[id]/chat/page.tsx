"use client"

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

interface Message {
  id: string
  content: string
  sender: "user" | "bot"
  timestamp: Date
  isLoading?: boolean
  isTyping?: boolean
  displayedContent?: string
}

interface PublicBotInfo {
  _id: string
  name: string
  description?: string
  category: string
  owner: {
    username: string
  }
  totalInteractions: number
  rating: number
  isActive: boolean
}

export default function MarketplaceChatPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [botInfo, setBotInfo] = useState<PublicBotInfo | null>(null)
  const [isFetchingBot, setIsFetchingBot] = useState(true)
  const [userCredits, setUserCredits] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchBotInfo()
    fetchUserCredits()
  }, [id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const fetchBotInfo = async () => {
    try {
      setIsFetchingBot(true)
      const response = await fetch(`${serverURL}/bot/public/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch bot information")
      }

      const data = await response.json()
      setBotInfo(data.data)

      if (!data.data.isActive) {
        toast({
          title: "Bot Inactive",
          description: "This bot is currently inactive",
          variant: "destructive",
        })
      }

      // Add welcome message
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    if (userCredits === null || userCredits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "Please purchase credits to chat with this bot",
        variant: "destructive",
      })
      router.push("/credits")
      return
    }

    if (!botInfo?.isActive) {
      toast({
        title: "Bot Inactive",
        description: "This bot is currently inactive",
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
      const response = await fetch(`${serverURL}/bot/public/interact/${id}`, {
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

      // Replace loading message with actual response
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

  if (isFetchingBot) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading bot...</p>
        </div>
      </div>
    )
  }

  if (!botInfo) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-semibold">Bot Not Found</h2>
            <p className="text-muted-foreground">
              The bot you're looking for doesn't exist or is no longer available.
            </p>
            <Button onClick={() => router.push("/marketplace")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Marketplace
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-lg font-semibold">{botInfo.name}</h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">by {botInfo.owner.username}</Badge>
                <Badge variant={botInfo.isActive ? "default" : "secondary"}>
                  {botInfo.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <CreditCard className="h-4 w-4" />
            {userCredits} Credits
          </Badge>
        </div>
      </div>

      {/* Status Banner */}
      {!botInfo.isActive && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 p-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">
              This bot is currently inactive. Please try again later.
            </p>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.isLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">
                  {message.isTyping ? message.displayedContent : message.content}
                </p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <TextareaAutosize
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                !botInfo.isActive
                  ? "Bot is inactive. Please try again later."
                  : "Type your message..."
              }
              disabled={!botInfo.isActive}
              className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!inputMessage.trim() || isLoading || !botInfo.isActive}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
} 