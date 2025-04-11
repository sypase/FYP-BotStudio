"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { serverURL } from "@/utils/utils"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Conversation {
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
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`${serverURL}/bot/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setConversations(data.data)
      } else {
        throw new Error(data.message || "Failed to fetch conversations")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load conversations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredConversations = conversations.filter((conversation) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      conversation.botId.name.toLowerCase().includes(searchLower) ||
      conversation.input.toLowerCase().includes(searchLower) ||
      conversation.response.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Conversations</h1>
        <div className="relative w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredConversations.map((conversation) => (
          <Card key={conversation._id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{conversation.botId.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.createdAt), { addSuffix: true })}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  conversation.status === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}>
                  {conversation.status}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-1">Your Message:</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">{conversation.input}</p>
                </div>
                <div>
                  <h3 className="font-medium mb-1">Bot Response:</h3>
                  <p className="text-sm bg-muted p-3 rounded-lg">{conversation.response}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Processing time: {conversation.processingTime}ms
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredConversations.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">
                {searchTerm ? "No conversations found matching your search" : "No conversations yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

