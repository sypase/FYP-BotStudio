import { Star } from "lucide-react"
import Image from "next/image"

const testimonials = [
  {
    quote:
      "BotStudio transformed our customer service. We've reduced response times by 80% while maintaining high customer satisfaction.",
    author: "Sarah Johnson",
    role: "Customer Success Manager",
    company: "TechCorp Inc.",
    rating: 5,
    avatar: "/placeholder.svg?height=64&width=64&text=SJ",
  },
  {
    quote:
      "Setting up our first bot took less than an hour. The customization options are incredible, and our users love the natural conversations.",
    author: "Michael Chen",
    role: "Marketing Director",
    company: "GrowthLabs",
    rating: 5,
    avatar: "/placeholder.svg?height=64&width=64&text=MC",
  },
  {
    quote:
      "The ROI we've seen from BotStudio is remarkable. It's handling 65% of our support queries automatically, freeing our team for complex issues.",
    author: "Alex Rivera",
    role: "Operations Lead",
    company: "Streamline Solutions",
    rating: 5,
    avatar: "/placeholder.svg?height=64&width=64&text=AR",
  },
  {
    quote:
      "As a small business owner, I was hesitant about AI, but BotStudio made it accessible and affordable. Best decision we've made this year.",
    author: "Emma Thompson",
    role: "Founder",
    company: "Boutique Essentials",
    rating: 4,
    avatar: "/placeholder.svg?height=64&width=64&text=ET",
  },
]

export default function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            <Star className="h-3.5 w-3.5" />
            <span>Customer Stories</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Trusted by Businesses Worldwide</h2>
          <p className="text-xl text-muted-foreground max-w-3xl">
            See what our customers have to say about their experience with BotStudio.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="p-6 bg-background rounded-lg border">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-muted"}`}
                  />
                ))}
              </div>
              <blockquote className="text-lg mb-6">&ldquo;{testimonial.quote}&rdquo;</blockquote>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.author}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-background rounded-lg border text-center">
          <h3 className="text-2xl font-bold mb-6">Join 500+ Satisfied Customers</h3>
          <div className="flex flex-wrap justify-center gap-8 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12">
                <Image
                  src={`/placeholder.svg?height=48&width=120&text=Company+${i + 1}`}
                  alt={`Company ${i + 1}`}
                  width={120}
                  height={48}
                  className="h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

