"use client"

import type React from "react"
import { forwardRef, useRef } from "react"
import { User, Users, Briefcase, Bot, MessageSquare, HelpCircle, BookOpen } from "lucide-react"

import { cn } from "@/lib/utils"
import { AnimatedBeam } from "@/components/magicui/animated-beam"

const Circle = forwardRef<HTMLDivElement, { className?: string; children?: React.ReactNode }>(
  ({ className, children }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "z-10 flex size-10 items-center justify-center rounded-full border-2 bg-white p-2 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
          className,
        )}
      >
        {children}
      </div>
    )
  },
)

Circle.displayName = "Circle"

export default function AnimatedBeamDemo() {
  const containerRef = useRef<HTMLDivElement>(null)
  const user1Ref = useRef<HTMLDivElement>(null)
  const user2Ref = useRef<HTMLDivElement>(null)
  const user3Ref = useRef<HTMLDivElement>(null)
  const botStudioRef = useRef<HTMLDivElement>(null)
  const openaiRef = useRef<HTMLDivElement>(null)
  const llamaRef = useRef<HTMLDivElement>(null)
  const mistralRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative flex h-[400px] w-[800px] mx-auto items-center justify-center overflow-hidden p-10 bg-background" ref={containerRef}>
      {/* Left side - Customers/Users */}
      <div className="absolute left-10 flex flex-col items-center justify-between gap-8 h-[300px]">
        <Circle ref={user1Ref} className="bg-gray-100">
          <User className="h-5 w-5 text-gray-700" />
        </Circle>
        <Circle ref={user2Ref} className="bg-gray-100">
          <Briefcase className="h-5 w-5 text-gray-700" />
        </Circle>
        <Circle ref={user3Ref} className="bg-gray-100">
          <Users className="h-5 w-5 text-gray-700" />
        </Circle>
      </div>

      {/* Center - BotStudio with Bot Types */}
      <div
        ref={botStudioRef}
        className="z-20 flex flex-col items-center justify-center rounded-2xl border-2 bg-white px-8 py-6 shadow-[0_0_30px_-12px_rgba(0,0,0,0.5)]"
      >
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent mb-4">
          BotStudio
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Bot className="h-4 w-4 text-purple-600" />
            <span>AI Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="h-4 w-4 text-purple-600" />
            <span>Chat Bot</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="h-4 w-4 text-purple-600" />
            <span>Support Bot</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <span>QA Bot</span>
          </div>
        </div>
      </div>

      {/* Right side - Models */}
      <div className="absolute right-10 flex flex-col items-center justify-between gap-8 h-[300px]">
        <Circle ref={openaiRef} className="bg-gray-100">
          <Icons.openai />
        </Circle>
        <Circle ref={llamaRef} className="bg-gray-100">
          <Icons.llama />
        </Circle>
        <Circle ref={mistralRef} className="bg-gray-100">
          <Icons.mistral />
        </Circle>
      </div>

      {/* Beams from users to BotStudio */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={user1Ref}
        toRef={botStudioRef}
        curvature={20}
        pathWidth={0.3}
        pathOpacity={1}
        duration={2}
        delay={0}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={user2Ref}
        toRef={botStudioRef}
        pathWidth={0.3}
        pathOpacity={1}
        duration={2}
        delay={0.7}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={user3Ref}
        toRef={botStudioRef}
        curvature={-20}
        pathWidth={0.3}
        pathOpacity={1}
        duration={2}
        delay={1.4}
        gradientStartColor="#6366f1"
        gradientStopColor="#a855f7"
      />

      {/* Beams from BotStudio to models */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={botStudioRef}
        toRef={openaiRef}
        curvature={20}
        reverse
        pathWidth={0.3}
        pathOpacity={1}
        duration={2}
        delay={2.1}
        gradientStartColor="#a855f7"
        gradientStopColor="#ec4899"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={botStudioRef}
        toRef={llamaRef}
        reverse
        pathWidth={0.3}
        pathOpacity={1}
        duration={2}
        delay={2.8}
        gradientStartColor="#a855f7"
        gradientStopColor="#ec4899"
      />
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={botStudioRef}
        toRef={mistralRef}
        curvature={-20}
        reverse
        pathWidth={0.3}
        pathOpacity={1}
        duration={2}
        delay={3.5}
        gradientStartColor="#a855f7"
        gradientStopColor="#ec4899"
      />
    </div>
  )
}

const Icons = {
  openai: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
    </svg>
  ),
  llama: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
        fill="#F8F8F8"
        stroke="#CCCCCC"
        strokeWidth="0.5"
      />
      <path
        d="M15.5 7.5C15.5 8.88 14.38 10 13 10C11.62 10 10.5 8.88 10.5 7.5C10.5 6.12 11.62 5 13 5C14.38 5 15.5 6.12 15.5 7.5Z"
        fill="#FF8C00"
      />
      <path
        d="M8.5 10.5C8.5 11.88 7.38 13 6 13C4.62 13 3.5 11.88 3.5 10.5C3.5 9.12 4.62 8 6 8C7.38 8 8.5 9.12 8.5 10.5Z"
        fill="#FF8C00"
      />
      <path
        d="M12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12C5 15.866 8.13401 19 12 19Z"
        stroke="#FF8C00"
        strokeWidth="1.5"
      />
      <path
        d="M9 14C9.5 15 10.5 16 12 16C13.5 16 14.5 15 15 14"
        stroke="#FF8C00"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  mistral: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z"
        fill="#F8F8F8"
        stroke="#CCCCCC"
        strokeWidth="0.5"
      />
      <path d="M7 8L17 8" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 12L17 12" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 16L13 16" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
} 