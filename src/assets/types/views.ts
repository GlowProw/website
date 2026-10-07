import type { ReminderTask } from './Reminder'

export type ViewMode = 'compact' | 'detailed'

export type SortField = 'name' | 'id' | 'quantity'
export type SortOrder = 'asc' | 'desc'

export interface SNode {
  id: string
  name: string
  text: string
  color: string
}

export interface SLink {
  source: string
  target: string
  value: number
  name: string
  text: string
  color: string
}

// Team.vue
export interface Teams {
  id: string | number
  username: string
  expiresAt: number
  createdAt: number
  description: string
  player: string
  tags: string[]
  userId?: string
}

export enum getTeamsType {
  none,
  load
}

export interface TaskCategoryGroup {
  key: string;
  title?: string;
  icon?: string;
  color?: string;
  showTitle: boolean;
  tasks: (ReminderTask & { nextTriggerTime: number | null; countdown: any })[];
}

export interface CategoryFilterItem {
  id: string
  label: string
  category: 'item' | 'material' | 'cosmetic' | 'ultimate' | 'modification' | 'ship'
  tags: string[]
  icon: string
}

export type ApiTab = 'backend' | 'assets' | 'lang'
