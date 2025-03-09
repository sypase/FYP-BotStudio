import { Bot, Code, Cpu, Globe, MessageSquare, Settings, Zap } from "lucide-react"

const features = [
  {
    icon: <Bot className="h-6 w-6" />,
    title: "Custom AI Bots",
    description: "Create personalized AI bots tailored to your specific business needs and use cases.",
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: "Website Integration",
    description: "Seamlessly integrate your bots into your website with just a few lines of code.",
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: "Multi-channel Support",
    description: "Deploy your bots across multiple platforms including web, mobile, and messaging apps.",
  },
  {
    icon: <Settings className="h-6 w-6" />,
    title: "Easy Customization",
    description: "Customize your bot's appearance, behavior, and responses without coding knowledge.",
  },
  {
    icon: <Cpu className="h-6 w-6" />,
    title: "Advanced AI Capabilities",
    description: "Leverage state-of-the-art AI models to provide intelligent and natural conversations.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Automation Workflows",
    description: "Create complex automation workflows to handle repetitive tasks and increase efficiency.",
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
            <Zap className="h-3.5 w-3.5" />
            <span>Powerful Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything You Need to Build Amazing Bots
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl">
            BotStudio provides all the tools and features you need to create, deploy, and manage AI-powered bots for
            your business.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="flex flex-col gap-4 p-6 bg-background rounded-lg border">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-background rounded-lg border">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary mb-4">
                <Code className="h-3.5 w-3.5" />
                <span>Easy Integration</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Integrate with Just a Few Lines of Code</h3>
              <p className="text-muted-foreground mb-6">
                Adding your custom bot to your website is as simple as copying and pasting a small code snippet. No
                complex setup required.
              </p>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <pre className="text-sm overflow-x-auto">
                <code className="text-primary">
                  {`<script>
  window.BotStudio = {
    botId: "your-bot-id",
    theme: "light",
    position: "bottom-right"
  };
</script>
<script src="https://cdn.botstudio.ai/widget.js" async></script>`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

