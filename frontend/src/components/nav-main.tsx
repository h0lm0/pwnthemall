"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const { state, isMobile, open } = useSidebar()
  const collapsed = state === "collapsed" && !isMobile

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex flex-col gap-2">
        {open && (
          <div className="px-2 py-1">
            <h2 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
              Navigation
            </h2>
          </div>
        )}
        <SidebarMenu>
          {items.map((item) =>
            item.items && item.items.length > 0 ? (
              collapsed ? (
                <SidebarMenuItem key={item.title}>
                  <DropdownMenu>
                    <Tooltip>
                      <DropdownMenuTrigger asChild>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton>
                            {item.icon && <item.icon className="w-4 h-4" />}
                            {open && <span>{item.title}</span>}
                          </SidebarMenuButton>
                        </TooltipTrigger>
                      </DropdownMenuTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent side="right" align="start" className="min-w-48">
                      {item.items.map((subItem) => (
                        <DropdownMenuItem asChild key={subItem.title}>
                          <Link href={subItem.url}>{subItem.title}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ) : (
                <Collapsible
                  key={item.title}
                  defaultOpen={item.isActive}
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.icon && <item.icon className="w-4 h-4" />}
                        {open && <span>{item.title}</span>}
                        {open && (
                          <ChevronRight className="ml-auto w-4 h-4 transition-transform duration-400 ease-in-out group-data-[state=open]/collapsible:rotate-90" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-6 mt-1 space-y-1">
                        {item.items.map((subItem) => (
                          <div key={subItem.title}>
                            <Link 
                              href={subItem.url}
                              className="flex items-center gap-2 px-3 py-1 text-sm rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )
            ) : (
              <SidebarMenuItem key={item.title}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={item.url}>
                        <SidebarMenuButton>
                          {item.icon && <item.icon className="w-4 h-4" />}
                          {open && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Link href={item.url}>
                    <SidebarMenuButton>
                      {item.icon && <item.icon className="w-4 h-4" />}
                      {open && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </Link>
                )}
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </div>
    </TooltipProvider>
  )
}
