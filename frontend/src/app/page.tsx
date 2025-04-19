'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Bot, Code, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import AnimatedBeamDemo from "@/components/magicui/animated-beam-demo";

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="flex flex-col items-center justify-center w-full">
          <section className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted py-20">
            <div className="container mx-auto px-4 text-center">
              <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Build Intelligent Bots with Ease
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Create, train, and deploy AI-powered bots for your business. No coding required.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild className="text-black">
                  <Link href="/login">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-foreground hover:text-black">
                  <Link href="/docs">
                    View Documentation
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="relative w-full h-[400px] -mt-20 mb-12">
                <AnimatedBeamDemo />
              </div>
              <h2 className="text-3xl font-bold text-center mb-12 text-foreground">Why Choose BotStudio?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="h-6 w-6 text-primary" />
                      <CardTitle className="text-foreground">Easy Bot Creation</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      Create custom bots in minutes with our intuitive interface
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      No coding required. Just upload your data and let our AI do the rest.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-6 w-6 text-primary" />
                      <CardTitle className="text-foreground">Powerful API</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      Integrate with your existing systems
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Use our API to interact with your bots programmatically.
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-6 w-6 text-primary" />
                      <CardTitle className="text-foreground">Secure & Reliable</CardTitle>
                    </div>
                    <CardDescription className="text-muted-foreground">
                      Enterprise-grade security and reliability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Your data is safe with our secure infrastructure.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          <section className="py-20 bg-gradient-to-b from-background to-muted">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-6 text-foreground">Ready to Get Started?</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join thousands of businesses using BotStudio to automate their operations.
              </p>
              <Button size="lg" asChild className="text-black">
                <Link href="/signup">
                  Create Free Account <Zap className="ml-2 h-4 w-4" />
                </Link> 
              </Button>
            </div>
          </section>
        </main>
        <footer className="border-t py-6 md:py-8">
          <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-6">
            <p className="text-center text-sm text-muted-foreground">© 2025 BotStudio. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="text-sm text-muted-foreground hover:underline">
                Terms
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:underline">
                Privacy
              </a>
              <a href="#" className="text-sm text-muted-foreground hover:underline">
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

