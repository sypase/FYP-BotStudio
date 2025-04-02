import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, Plus, Search, Settings, MessageSquare, BarChart3, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const bots = [
  {
    id: 1,
    name: "Customer Support Bot",
    description: "Handles customer inquiries and support tickets",
    type: "Support",
    conversations: 1245,
    status: "Active",
  },
  {
    id: 2,
    name: "Lead Generation Bot",
    description: "Qualifies leads and collects contact information",
    type: "Marketing",
    conversations: 867,
    status: "Active",
  },
  {
    id: 3,
    name: "Product Recommendation",
    description: "Suggests products based on customer preferences",
    type: "Sales",
    conversations: 532,
    status: "Active",
  },
  {
    id: 4,
    name: "Appointment Scheduler",
    description: "Books appointments and sends reminders",
    type: "Utility",
    conversations: 321,
    status: "Inactive",
  },
  {
    id: 5,
    name: "FAQ Bot",
    description: "Answers frequently asked questions",
    type: "Support",
    conversations: 1876,
    status: "Active",
  },
  {
    id: 6,
    name: "Feedback Collector",
    description: "Gathers customer feedback and suggestions",
    type: "Marketing",
    conversations: 245,
    status: "Inactive",
  },
]

export default function BotsPage() {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">My Bots</h1>
        <Button className="gap-2">
          <Plus className="h-4 w-4 text-black" />
          Create New Bot
        </Button>
      </div>

      <div className="mb-6">
        <Tabs defaultValue="all">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Bots</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search bots..." className="w-full sm:w-[250px] pl-8" />
            </div>
          </div>

          <TabsContent value="all" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bots.map((bot) => (
                <BotCard key={bot.id} bot={bot} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bots
                .filter((bot) => bot.status === "Active")
                .map((bot) => (
                  <BotCard key={bot.id} bot={bot} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="inactive" className="mt-0">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bots
                .filter((bot) => bot.status === "Inactive")
                .map((bot) => (
                  <BotCard key={bot.id} bot={bot} />
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function BotCard({ bot }: { bot: (typeof bots)[0] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <CardTitle>{bot.name}</CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>Edit Bot</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{bot.status === "Active" ? "Deactivate" : "Activate"}</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete Bot</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>{bot.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground">Type</span>
            <span>{bot.type}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Status</span>
            <span className={bot.status === "Active" ? "text-green-500" : "text-amber-500"}>{bot.status}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">Conversations</span>
            <span>{bot.conversations.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <MessageSquare className="h-4 w-4" />
          Chat
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <BarChart3 className="h-4 w-4" />
          Analytics
        </Button>
        <Button variant="outline" size="sm" className="flex-1 gap-1">
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </CardFooter>
    </Card>
  )
}

