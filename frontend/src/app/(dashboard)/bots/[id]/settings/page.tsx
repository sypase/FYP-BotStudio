"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash, Copy, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { serverURL } from "@/utils/utils"
import { useToast } from "@/hooks/use-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Toaster } from "@/components/ui/toaster"

interface BotSettings {
  _id: string
  name: string
  isPublic: boolean
  isActive: boolean
  trainingStatus: string
  category: string
}

const categories = [
  "Customer Service",
  "Sales",
  "Support",
  "Education",
  "Entertainment",
  "Business",
  "Other"
]

export default function BotSettingsPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [bot, setBot] = useState<BotSettings | null>(null)
  const [newBotName, setNewBotName] = useState("")
  const [duplicateBotName, setDuplicateBotName] = useState("")
  const [isSavingPublic, setIsSavingPublic] = useState(false)
  const [isSavingActive, setIsSavingActive] = useState(false)
  const [category, setCategory] = useState("Other")

  useEffect(() => {
    const fetchBot = async () => {
      try {
        const response = await fetch(`${serverURL}/bot/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch bot information")
        }

        const data = await response.json()
        console.log(data.data);
        setBot(data.data)
        setNewBotName(data.data.name)
        setCategory(data.data.category || "Other")
      } catch (error) {
        console.error("Error fetching bot:", error)
        toast({
          title: "Error",
          description: "Failed to load bot information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBot()
  }, [id, toast])

  const handleSave = async () => {
    if (!bot) return

    setIsSaving(true)
    try {
      const response = await fetch(`${serverURL}/bot/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: newBotName,
          isPublic: bot.isPublic,
          isActive: bot.isActive,
          category: category,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update bot")
      }

      const data = await response.json()
      setBot(data.data)
      setCategory(data.data.category || "Other")
      toast({
        title: "Success",
        description: "Bot settings updated successfully",
      })
    } catch (error) {
      console.error("Error updating bot:", error)
      toast({
        title: "Error",
        description: "Failed to update bot settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!bot) return

    setIsDeleting(true)
    try {
      const response = await fetch(`${serverURL}/bot/delete/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete bot")
      }

      toast({
        title: "Success",
        description: "Bot deleted successfully",
      })
      router.push("/bots")
    } catch (error) {
      console.error("Error deleting bot:", error)
      toast({
        title: "Error",
        description: "Failed to delete bot",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    if (!bot || !duplicateBotName) return

    setIsDuplicating(true)
    try {
      const response = await fetch(`${serverURL}/bot/duplicate/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: duplicateBotName,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to duplicate bot")
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: "Bot duplicated successfully",
      })
      router.push(`/bots/${data.data._id}/settings`)
    } catch (error) {
      console.error("Error duplicating bot:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate bot",
        variant: "destructive",
      })
    } finally {
      setIsDuplicating(false)
    }
  }

  const togglePublic = async () => {
    if (!bot) return
    
    try {
      setIsSavingPublic(true)
      const response = await fetch(`${serverURL}/bot/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          isPublic: !bot.isPublic,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update bot")
      }

      const data = await response.json()
      setBot(data.data)
      toast({
        title: "Success",
        description: `Bot is now ${data.data.isPublic ? "public" : "private"}`,
      })
    } catch (error) {
      console.error("Error updating bot:", error)
      toast({
        title: "Error",
        description: "Failed to update bot settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingPublic(false)
    }
  }

  const toggleActive = async () => {
    if (!bot) return
    
    try {
      setIsSavingActive(true)
      const response = await fetch(`${serverURL}/bot/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          isActive: !bot.isActive,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update bot")
      }

      const data = await response.json()
      setBot(data.data)
      toast({
        title: "Success",
        description: `Bot is now ${data.data.isActive ? "active" : "inactive"}`,
      })
    } catch (error) {
      console.error("Error updating bot:", error)
      toast({
        title: "Error",
        description: "Failed to update bot settings",
        variant: "destructive",
      })
    } finally {
      setIsSavingActive(false)
    }
  }

  const handleCategoryChange = async (newCategory: string) => {
    if (!bot) return

    try {
      const response = await fetch(`${serverURL}/bot/update/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          category: newCategory,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update category")
      }

      const data = await response.json()
      setBot(data.data)
      setCategory(data.data.category || "Other")
      toast({
        title: "Success",
        description: "Category updated successfully",
      })
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Bot Settings</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Bot not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <Toaster />
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Bot Settings</h1>
            <p className="text-muted-foreground">Configure your bot settings</p>
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure your bot's basic settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Bot Name</Label>
            <Input
              id="name"
              value={newBotName}
              onChange={(e) => setNewBotName(e.target.value)}
              placeholder="Enter bot name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={category} 
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-black text-white">
                {categories.map((cat) => (
                  <SelectItem 
                    key={cat} 
                    value={cat}
                    className="hover:text-black"
                  >
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Public Access</Label>
              <p className="text-sm text-muted-foreground">
                Allow other users to interact with this bot
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSavingPublic && <Loader2 className="h-4 w-4 animate-spin" />}
              <Switch
                checked={bot.isPublic}
                onCheckedChange={togglePublic}
                disabled={bot.trainingStatus !== "completed" || isSavingPublic}
                className={bot.isPublic ? "bg-green-500" : "bg-red-500"}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable this bot
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSavingActive && <Loader2 className="h-4 w-4 animate-spin" />}
              <Switch
                checked={bot.isActive}
                onCheckedChange={toggleActive}
                disabled={bot.trainingStatus !== "completed" || isSavingActive}
                className={bot.isActive ? "bg-green-500" : "bg-red-500"}
              />
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              Training Status: <span className="font-medium">{bot.trainingStatus}</span>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate Bot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Duplicate Bot</DialogTitle>
                  <DialogDescription>
                    Create a copy of this bot with a new name
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4">
                  <Label htmlFor="duplicate-name">New Bot Name</Label>
                  <Input
                    id="duplicate-name"
                    value={duplicateBotName}
                    onChange={(e) => setDuplicateBotName(e.target.value)}
                    placeholder="Enter new bot name"
                  />
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleDuplicate}
                    disabled={!duplicateBotName || isDuplicating}
                  >
                    {isDuplicating ? "Duplicating..." : "Duplicate"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Bot
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your bot
                    and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Button className="text-black" onClick={handleSave} disabled={isSaving || newBotName === bot.name}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Name"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 