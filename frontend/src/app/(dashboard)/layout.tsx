import type React from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
      <AppSidebar />
      <main className="flex-1 overflow-auto w-full">{children}</main>
      </div>
    </SidebarProvider>
  )
}

