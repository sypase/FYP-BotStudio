import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Bot, Plus, BarChart3, MessageSquare, Users } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button className="gap-2 text-black">
          <Plus className="h-4 w-4 text-black" />
          Create New Bot
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { title: "Total Bots", value: "12", icon: Bot, color: "bg-blue-100 dark:bg-blue-900" },
          {
            title: "Active Conversations",
            value: "1,234",
            icon: MessageSquare,
            color: "bg-green-100 dark:bg-green-900",
          },
          { title: "Team Members", value: "8", icon: Users, color: "bg-purple-100 dark:bg-purple-900" },
          { title: "Avg. Response Time", value: "1.2s", icon: BarChart3, color: "bg-amber-100 dark:bg-amber-900" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Bots</CardTitle>
            <CardDescription>Your recently created or updated bots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Customer Support Bot", updated: "2 hours ago", type: "Support" },
                { name: "Lead Generation Bot", updated: "Yesterday", type: "Marketing" },
                { name: "Product Recommendation", updated: "3 days ago", type: "Sales" },
              ].map((bot, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{bot.name}</div>
                      <div className="text-sm text-muted-foreground">Updated {bot.updated}</div>
                    </div>
                  </div>
                  <div className="text-xs bg-muted px-2 py-1 rounded-full">{bot.type}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Bots
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Latest interactions with your bots</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: "John Doe", time: "10 minutes ago", bot: "Customer Support Bot" },
                { user: "Jane Smith", time: "1 hour ago", bot: "Lead Generation Bot" },
                { user: "Robert Johnson", time: "3 hours ago", bot: "Product Recommendation" },
              ].map((convo, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                      {convo.user
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className="font-medium">{convo.user}</div>
                      <div className="text-sm text-muted-foreground">{convo.time}</div>
                    </div>
                  </div>
                  <div className="text-xs bg-muted px-2 py-1 rounded-full">{convo.bot}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              View All Conversations
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

