"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Contact,
  FileText,
  Home,
  PieChart,
  Settings,
  Users,
  Briefcase,
  Target,
  Mail,
  FolderOpen,
  Users2,
  UserPlus,
  UserCheck,
  Building,
  Handshake,
  TrendingUp,
  Send,
  Folder,
  CheckSquare,
  FileCheck,
  Plus,
  Eye,
  Edit,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import User from "@/models/User"

type MenuSubItem = {
  title: string
  href: string
  icon: React.ElementType
}

type MenuItem = {
  title: string
  href: string
  icon: React.ElementType
  badge: null | string
  subItems?: MenuSubItem[]
}

type MenuSection = {
  title: string
  items: MenuItem[]
}

const menuItems: MenuSection[] = [
  {
    title: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
        badge: null,
      },
    ],
  },
  {
    title: "CRM",
    items: [
      {
        title: "Users",
        href: "/users",
        icon: Users2,
        badge: null,
        subItems: [
          {
            title: "All Users",
            href: "/users",
            icon: Eye,
          },
          {
            title: "Add User",
            href: "/users/add",
            icon: UserPlus,
          },
          {
            title: "User Roles",
            href: "/users/roles",
            icon: UserCheck,
          },
        ],
      },
      {
        title: "Companies",
        href: "/companies",
        icon: Building2,
        badge: null,
        subItems: [
          {
            title: "All Companies",
            href: "/companies",
            icon: Eye,
          },
          {
            title: "Add Company",
            href: "/companies/add",
            icon: Plus,
          },
          {
            title: "Company Types",
            href: "/companies/types",
            icon: Building,
          },
        ],
      },
      {
        title: "Deals",
        href: "/deals",
        icon: Briefcase,
        badge: null,
        subItems: [
          {
            title: "All Deals",
            href: "/deals",
            icon: Eye,
          },
          {
            title: "Add Deal",
            href: "/deals/add",
            icon: Plus,
          },
          {
            title: "Deal Stages",
            href: "/deals/stages",
            icon: TrendingUp,
          },
        ],
      },
      {
        title: "Leads",
        href: "/leads",
        icon: Target,
        badge: null,
        subItems: [
          {
            title: "All Leads",
            href: "/leads",
            icon: Eye,
          },
          {
            title: "Add Lead",
            href: "/leads/add",
            icon: Plus,
          },
          {
            title: "Lead Sources",
            href: "/leads/sources",
            icon: Target,
          },
        ],
      },
      {
        title: "Pipeline",
        href: "/pipeline",
        icon: BarChart3,
        badge: null,
        subItems: [
          {
            title: "Sales Pipeline",
            href: "/pipeline",
            icon: TrendingUp,
          },
          {
            title: "Pipeline Reports",
            href: "/pipeline/reports",
            icon: BarChart3,
          },
        ],
      },
      {
        title: "Campaign",
        href: "/campaign",
        icon: Mail,
        badge: null,
        subItems: [
          {
            title: "All Campaigns",
            href: "/campaign",
            icon: Eye,
          },
          {
            title: "Create Campaign",
            href: "/campaign/create",
            icon: Plus,
          },
          {
            title: "Email Templates",
            href: "/campaign/templates",
            icon: Send,
          },
        ],
      },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderOpen,
        badge: null,
        subItems: [
          {
            title: "All Projects",
            href: "/projects",
            icon: Eye,
          },
          {
            title: "Create Project",
            href: "/projects/create",
            icon: Plus,
          },
          {
            title: "Project Templates",
            href: "/projects/templates",
            icon: Folder,
          },
        ],
      },
      {
        title: "Tasks",
        href: "/tasks",
        icon: Calendar,
        badge: null,
        subItems: [
          {
            title: "All Tasks",
            href: "/tasks",
            icon: Eye,
          },
          {
            title: "Create Task",
            href: "/tasks/create",
            icon: Plus,
          },
          {
            title: "Task Calendar",
            href: "/tasks/calendar",
            icon: Calendar,
          },
        ],
      },
      {
        title: "Proposals",
        href: "/proposals",
        icon: FileText,
        badge: null,
        subItems: [
          {
            title: "All Proposals",
            href: "/proposals",
            icon: Eye,
          },
          {
            title: "Create Proposal",
            href: "/proposals/create",
            icon: Plus,
          },
          {
            title: "Proposal Templates",
            href: "/proposals/templates",
            icon: FileCheck,
          },
        ],
      },
    ],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title)
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isItemExpanded = (title: string) => expandedItems.includes(title)

  return (
    <div
      className={cn(
        "relative flex h-screen flex-col border-r bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b bg-sidebar/95 px-4 backdrop-blur-sm">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-sidebar-foreground">DEPLLC CRMS</span>
              <div className="text-xs text-muted-foreground/70 font-medium">Customer Relations</div>
            </div>
          </div>
        )}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setCollapsed(!collapsed)} 
          className="h-9 w-9 p-0 hover:bg-sidebar-accent/60 transition-all duration-200"
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-6">
        <nav className="space-y-8">
          {menuItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-3">
              {!collapsed && (
                <div className="flex items-center px-3 pb-2 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    {section.title}
                  </h3>
                  <div className="ml-2 flex-1 border-t border-sidebar-border/40" />
                </div>
              )}
              <div className="space-y-1 px-1">
                {section.items.map((item, itemIndex) => {
                  const isActive = pathname === item.href || (item.subItems && item.subItems.some(subItem => pathname === subItem.href))
                  const isExpanded = isItemExpanded(item.title)
                  const hasSubItems = item.subItems && item.subItems.length > 0

                  return (
                    <div key={itemIndex}>
                      {hasSubItems && !collapsed ? (
                        <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(item.title)}>
                          <CollapsibleTrigger asChild>
                            <div
                              className={cn(
                                "group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer",
                                "hover:bg-gradient-to-r hover:from-sidebar-accent hover:to-sidebar-accent/50 hover:shadow-sm",
                                isActive 
                                  ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/60 text-sidebar-accent-foreground shadow-md font-semibold" 
                                  : "text-sidebar-foreground hover:text-sidebar-accent-foreground",
                              )}
                            >
                              <div className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors mr-3",
                                isActive 
                                  ? "bg-primary/15 text-primary" 
                                  : "bg-sidebar-accent/20 text-sidebar-foreground/70 group-hover:bg-sidebar-accent/40 group-hover:text-sidebar-foreground"
                              )}>
                                <item.icon className="h-4 w-4" />
                              </div>
                              <span className="flex-1 text-left tracking-wide">{item.title}</span>
                              {item.badge && (
                                <span className="ml-2 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">
                                  {item.badge}
                                </span>
                              )}
                              <div className="ml-3 flex h-6 w-6 items-center justify-center">
                                <ChevronDown 
                                  className={cn(
                                    "h-4 w-4 transition-all duration-300 text-sidebar-foreground/60",
                                    isExpanded && "rotate-180 text-sidebar-foreground"
                                  )} 
                                />
                              </div>
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-0">
                            <div className="mt-2 ml-3 space-y-1">
                              {item.subItems?.map((subItem, subIndex) => {
                                const isSubActive = pathname === subItem.href
                                return (
                                  <Link key={subIndex} href={subItem.href}>
                                    <div
                                      className={cn(
                                        "group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        "hover:bg-gradient-to-r hover:from-sidebar-accent/40 hover:to-sidebar-accent/20",
                                        "hover:shadow-sm hover:translate-x-1",
                                        isSubActive 
                                          ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-l-2 border-primary shadow-sm font-semibold" 
                                          : "text-sidebar-foreground/70 hover:text-sidebar-foreground border-l-2 border-transparent",
                                        "ml-1 mr-2"
                                      )}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div className={cn(
                                          "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
                                          isSubActive 
                                            ? "bg-primary/15 text-primary" 
                                            : "bg-sidebar-accent/30 text-sidebar-foreground/60 group-hover:bg-sidebar-accent/50 group-hover:text-sidebar-foreground"
                                        )}>
                                          <subItem.icon className="h-3.5 w-3.5" />
                                        </div>
                                        <span className="flex-1 tracking-wide">{subItem.title}</span>
                                      </div>
                                      {isSubActive && (
                                        <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary" />
                                      )}
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      ) : (
                        <Link href={item.href}>
                          <div
                            className={cn(
                              "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                              "hover:bg-gradient-to-r hover:from-sidebar-accent hover:to-sidebar-accent/50 hover:shadow-sm",
                              isActive 
                                ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/60 text-sidebar-accent-foreground shadow-md font-semibold" 
                                : "text-sidebar-foreground hover:text-sidebar-accent-foreground",
                              collapsed && "justify-center px-2",
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center rounded-lg transition-colors",
                              collapsed ? "h-8 w-8" : "h-8 w-8 mr-3",
                              isActive 
                                ? "bg-primary/15 text-primary" 
                                : "bg-sidebar-accent/20 text-sidebar-foreground/70 group-hover:bg-sidebar-accent/40 group-hover:text-sidebar-foreground"
                            )}>
                              <item.icon className="h-4 w-4" />
                            </div>
                            {!collapsed && (
                              <>
                                <span className="flex-1 tracking-wide">{item.title}</span>
                                {item.badge && (
                                  <span className="ml-auto rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">
                                    {item.badge}
                                  </span>
                                )}
                                {hasSubItems && (
                                  <ChevronRight className="h-4 w-4 ml-3 text-sidebar-foreground/60" />
                                )}
                              </>
                            )}
                          </div>
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
