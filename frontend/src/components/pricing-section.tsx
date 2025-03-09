import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const plans = [
  {
    name: "Starter",
    price: "$9",
    description: "Perfect for small businesses and personal websites",
    features: [
      "1 Custom Bot",
      "500 Monthly Conversations",
      "Basic Customization",
      "Email Support",
      "Website Integration",
    ],
    popular: false,
    buttonText: "Get Started",
  },
  {
    name: "Professional",
    price: "$29",
    description: "Ideal for growing businesses with multiple needs",
    features: [
      "5 Custom Bots",
      "5,000 Monthly Conversations",
      "Advanced Customization",
      "Priority Support",
      "Multi-channel Integration",
      "Analytics Dashboard",
      "Workflow Automation",
    ],
    popular: true,
    buttonText: "Get Started",
  },
  {
    name: "Enterprise",
    price: "$99",
    description: "For large organizations with complex requirements",
    features: [
      "Unlimited Custom Bots",
      "50,000 Monthly Conversations",
      "Full Customization",
      "24/7 Dedicated Support",
      "All Integrations",
      "Advanced Analytics",
      "Custom AI Training",
      "API Access",
      "White Labeling",
    ],
    popular: false,
    buttonText: "Contact Sales",
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            <Check className="h-3.5 w-3.5" />
            <span>Affordable Plans</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Choose the perfect plan for your business needs. All plans include core features with no hidden fees.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`flex flex-col p-8 bg-background rounded-lg border ${
                plan.popular ? "border-primary shadow-lg relative" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-2">/month</span>
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                  {plan.buttonText}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">Need a custom plan for your specific requirements?</p>
          <Link href="/contact">
            <Button variant="link">Contact our sales team</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

