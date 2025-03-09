import HeroSection from "@/components/hero-section"
import FeaturesSection from "@/components/features-section"
import PricingSection from "@/components/pricing-section"
import TestimonialsSection from "@/components/testimonials-section"
import CtaSection from "@/components/ctasection"
import Navbar from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider"

export default function Home() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <div className="min-h-screen bg-background text-foreground text-white">
        <Navbar/>
        <main className="flex flex-col items-center justify-center w-full">
          <HeroSection />
          <FeaturesSection />
          <PricingSection />
          <TestimonialsSection />
          <CtaSection />
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
  )
}

