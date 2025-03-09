import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MessageSquare, Bot, Calendar, ArrowUpRight } from "lucide-react"

const conversations = [
  {
    id: 1,
    user: "John Doe",
    email: "john.doe@example.com",
    bot: "Customer Support Bot",
    messages: 12,
    lastActive: "10 minutes ago",
    status: "Active",
  },
  {
    id: 2,
    user: "Jane Smith",
    email: "jane.smith@example.com",
    bot: "Lead Generation Bot",
    messages: 8,
    lastActive: "1 hour ago",
    status: "Closed",
  },
  {
    id: 3,
    user: "Robert Johnson",
    email: "robert.j@example.com",
    bot: "Product Recommendation",
    messages: 15,
    lastActive: "3 hours ago",
    status: "Active",
  },
  {
    id: 4,
    user: "Emily Davis",
    email: "emily.d@example.com",
    bot: "Appointment Scheduler",
    messages: 6,
    lastActive: "Yesterday",
    status: "Closed",
  },
  {
    id: 5,
    user: "Michael Wilson",
    email: "michael.w@example.com",
    bot: "FAQ Bot",
    messages: 4,
    lastActive: "2 days ago",
    status: "Closed",
  },
  {
    id: 6,
    user: "Sarah Brown",
    email: "sarah.b@example.com",
    bot: "Feedback Collector",
    messages: 9,
    lastActive: "Just now",
    status: "Active",
  },
]

export default function ConversationsPage() {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Conversations</h1>
        <Button variant="outline" className="gap-2">
          <Calendar className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="mb-6">
        <Tabs defaultValue="all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Conversations</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="closed">Closed</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search conversations..." className="w-full sm:w-[250px] pl-8" />
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Recent Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  {conversations.map((conversation) => (
                    <ConversationItem key={conversation.id} conversation={conversation} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active" className="mt-0">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Active Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  {conversations
                    .filter((c) => c.status === "Active")
                    .map((conversation) => (
                      <ConversationItem key={conversation.id} conversation={conversation} />
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="closed" className="mt-0">
            <Card>
              <CardHeader className="pb-0">
                <CardTitle>Closed Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mt-4">
                  {conversations
                    .filter((c) => c.status === "Closed")
                    .map((conversation) => (
                      <ConversationItem key={conversation.id} conversation={conversation} />
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function ConversationItem({ conversation }: { conversation: (typeof conversations)[0] }) {
  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          {conversation.user
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <div className="font-medium">{conversation.user}</div>
          <div className="text-sm text-muted-foreground">{conversation.email}</div>
        </div>
      </div>
      <div className="hidden md:flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{conversation.bot}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{conversation.messages} messages</span>
        </div>
        <div className="text-sm text-muted-foreground">{conversation.lastActive}</div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`px-2 py-1 rounded-full text-xs ${
            conversation.status === "Active"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
          }`}
        >
          {conversation.status}
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

