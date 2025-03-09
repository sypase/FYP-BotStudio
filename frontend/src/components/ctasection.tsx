import { ArrowRight, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CtaSection() {
  return (
    <section className="py-20">
      <div className="container px-4 md:px-6">
        <div className="relative overflow-hidden rounded-lg bg-primary p-8 md:p-12">
          <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/3 opacity-10">
            <Bot className="h-96 w-96" />
          </div>

          <div className="relative grid gap-8 md:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-primary-foreground mb-4">
                Ready to Transform Your Customer Experience?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8">
                Join hundreds of businesses already using BotStudio to automate conversations, improve customer
                satisfaction, and reduce operational costs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="gap-2">
                    Get Started <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-transparent text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10"
                  >
                    Schedule a Demo
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-primary-foreground/10 p-6 rounded-lg backdrop-blur-sm">
              <div className="text-primary-foreground mb-4 font-medium">Start building your first bot in minutes</div>
              <ul className="space-y-3">
                {[
                  "No credit card required",
                  "Free 14-day trial",
                  "Cancel anytime",
                  "Full access to all features",
                  "Dedicated support",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-primary-foreground/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

