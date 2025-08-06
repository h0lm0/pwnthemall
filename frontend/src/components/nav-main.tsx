"use client"

import * as React from "react"
import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

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
  const { open } = useSidebar()
  
  // Track which collapsible items are open (independent of sidebar state)
  const [openItems, setOpenItems] = React.useState<Set<string>>(new Set())

  return (
    <div className="p-2">
      <div className="space-y-1">
        {items.map((item) =>
          item.items && item.items.length > 0 ? (
            !open ? (
              <div key={item.title}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        item.isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      {item.icon && <item.icon className="w-4 h-4" />}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="min-w-48">
                    {item.items.map((subItem) => (
                      <DropdownMenuItem asChild key={subItem.title}>
                        <Link href={subItem.url}>{subItem.title}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Collapsible
                key={item.title}
                open={openItems.has(item.title)}
                onOpenChange={(isOpen) => {
                  const newOpenItems = new Set(openItems)
                  if (isOpen) {
                    newOpenItems.add(item.title)
                  } else {
                    newOpenItems.delete(item.title)
                  }
                  setOpenItems(newOpenItems)
                }}
                className="group/collapsible"
              >
                <div>
                  <CollapsibleTrigger asChild>
                    <button
                      className={cn(
                        "flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200",
                        item.isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                      )}
                    >
                      {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                      <span className={cn(
                        "truncate transition-all duration-200",
                        open ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                      )}>
                        {item.title}
                      </span>
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-all duration-200 ease-in-out group-data-[state=open]/collapsible:rotate-90",
                        open ? "opacity-100 ml-auto" : "opacity-0 w-0 overflow-hidden"
                      )} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-6 mt-1 space-y-1">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.title}
                          href={subItem.url}
                          className="block rounded-lg p-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          {subItem.title}
                            </Link>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          ) : (
            <div key={item.title}>
              <Link
                href={item.url}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200",
                  item.isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
              >
                {item.icon && <item.icon className="w-4 h-4 flex-shrink-0" />}
                <span className={cn(
                  "truncate transition-all duration-200",
                  open ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                )}>
                  {item.title}
                </span>
                </Link>
            </div>
          )
        )}
      </div>
    </div>
  )
}
