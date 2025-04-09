"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Bot, Send, ArrowLeft, RefreshCw, Info, Clock, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import TextareaAutosize from "react-textarea-autosize"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { serverURL } from "@/utils/utils"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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
}

export default function BotChatPage() {
  const { id } = useParams<{ id: string }>()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [botInfo, setBotInfo] = useState<BotInfo | null>(null)
  const [isFetchingBot, setIsFetchingBot] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const router = useRouter()

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
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load bot information",
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

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
    <div className="flex flex-col h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/80 backdrop-blur-sm p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/bots")}
              className="rounded-full hover:bg-gray-900 text-gray-400 hover:text-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 blur-sm opacity-70"></div>
                <Avatar className="relative h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-600 border-2 border-black">
                  <AvatarFallback className="text-white">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-100">{botInfo.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-normal border-gray-700 text-gray-400">
                    {botInfo.isPublic ? "Public" : "Private"}
                  </Badge>
                  {botInfo.trainingStatus === "completed" ? (
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white text-xs border-0">
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-xs font-normal flex items-center gap-1 border-amber-900 text-amber-500"
                    >
                      <Clock className="h-3 w-3" />
                      {botInfo.trainingStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-900">
                <MoreHorizontal className="h-5 w-5 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800 text-gray-200">
              <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800">Clear chat</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800">Bot settings</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-gray-800 focus:bg-gray-800">Share conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-black">
        <div className="max-w-4xl mx-auto space-y-6 py-4">
          {messages.map((message) => (
            <div key={message.id} className={cn("flex", message.sender === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm",
                  message.sender === "user"
                    ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white"
                    : "bg-gray-900 text-gray-100 border border-gray-800",
                )}
              >
                {message.isLoading ? (
                  <div className="flex items-center justify-center h-8 w-16">
                    <div className="flex space-x-1.5">
                      <div className="h-2.5 w-2.5 bg-gray-700 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2.5 w-2.5 bg-gray-700 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2.5 w-2.5 bg-gray-700 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {message.isTyping ? message.displayedContent : message.content}
                    {message.isTyping && (
                      <span className="inline-block w-1 h-4 ml-0.5 bg-gray-400 animate-pulse"></span>
                    )}
                  </div>
                )}
                <div
                  className={cn(
                    "text-xs mt-2 flex justify-end",
                    message.sender === "user" ? "text-violet-200" : "text-gray-500",
                  )}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-black/80 backdrop-blur-sm p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 items-end">
            <div className="relative flex-1">
              <TextareaAutosize
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className="w-full resize-none rounded-2xl border border-gray-800 bg-gray-900 px-4 py-3 focus:border-violet-700 focus:ring focus:ring-violet-900 focus:ring-opacity-50 text-gray-100 placeholder:text-gray-500"
                minRows={1}
                maxRows={4}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="rounded-full h-12 w-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:shadow-none"
            >
              {isLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          <p className="text-xs text-center mt-3 text-gray-500">
            {botInfo.name} is an AI assistant and may produce inaccurate information.
          </p>
        </div>
      </div>
    </div>
  )
}
