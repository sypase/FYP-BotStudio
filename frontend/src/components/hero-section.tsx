"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Bot, Sparkles } from "lucide-react"

export default function HeroSection() {
  const { theme } = useTheme()

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-background/50" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-br from-primary/20 via-purple-500/10 to-background blur-3xl opacity-50" />
      </div>

      <div className="container px-4 md:px-6">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-center">
          <div className="flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI-powered automation for everyone</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Create Custom Bots for Your Business
              <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                {" "}
                in Minutes
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">
              BotStudio helps organizations build custom AI bots for their websites and personal use at an affordable
              price.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                    <img
                      src={`/placeholder.svg?height=32&width=32&text=${i}`}
                      alt="User avatar"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <div>
                <span className="font-medium">500+</span> businesses trust BotStudio
              </div>
            </div>
          </div>
          <div className="relative aspect-video md:aspect-square rounded-lg overflow-hidden border bg-muted/50 p-2">
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="h-24 w-24 text-primary/30" />
            </div>
            <div className="relative h-full w-full rounded-md overflow-hidden bg-background">
              <img
                src="assets/Chatbot-UI.png"
                alt="Bot interface preview"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

