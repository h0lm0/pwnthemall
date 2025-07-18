import type { LucideIcon } from "lucide-react";

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavItem extends NavSubItem {
  icon?: LucideIcon;
  items?: NavSubItem[];
  isActive?: boolean;
}
