'use client'

import { colors } from '@/design-system'
import React from 'react'

export type IconName =
  | 'dashboard' | 'projects' | 'goals' | 'reports' | 'employees' | 'organization'
  | 'bell' | 'calendar' | 'chevronDown' | 'chevronRight' | 'filter' | 'export' | 'check'
  | 'chart' | 'star' | 'target' | 'person' | 'people' | 'box' | 'layers'
  | 'alert' | 'clock' | 'search' | 'plus' | 'x' | 'edit' | 'trash'
  | 'arrowUp' | 'arrowDown' | 'mail' | 'linkExternal'
  | 'layoutGrid' | 'list' | 'briefcase' | 'fileText' | 'settings' | 'users' | 'globe' | 'key' | 'user'
  | 'sparkles' | 'refresh' | 'chevronUp' | 'logOut'
  | 'trendingUp' | 'trendingDown' | 'minus' | 'help' | 'checkCircle' | 'alertTriangle' | 'lightbulb'

interface IconProps {
  name: IconName
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

const icons: Record<IconName, React.ReactNode> = {
  dashboard: (
    <path d="M1 1h6v6H1V1zm8 0h6v6H9V1zm-8 8h6v6H1V9zm8 0h6v6H9V9z" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  projects: (
    <>
      <rect x="2" y="2" width="12" height="12" rx="2" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M2 6h12M6 6v8" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  goals: (
    <>
      <circle cx="8" cy="8" r="6" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M8 5v3l2 2" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  reports: (
    <>
      <path d="M2 4h12M2 8h8M2 12h10" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  employees: (
    <>
      <circle cx="6" cy="5" r="3" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M1 14c0-3 2-5 5-5h1" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <circle cx="12" cy="11" r="3" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M12 9v2l1.5 1" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  organization: (
    <>
      <rect x="2" y="2" width="12" height="12" rx="2" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M5 8h6M8 5v6" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  bell: (
    <>
      <path d="M8 2a5 5 0 0 1 5 5v2l1.5 2.5h-13L3 9V7a5 5 0 0 1 5-5z" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M6 13.5a2 2 0 0 0 4 0" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  calendar: (
    <>
      <rect x="2" y="3" width="12" height="11" rx="2" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M5 1v3M11 1v3M2 7h12" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  chevronDown: (
    <path d="M4 6l4 4 4-4" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" />
  ),
  chevronRight: (
    <path d="M6 4l4 4-4 4" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" />
  ),
  filter: (
    <path d="M3 4h18M5 9h14M7 14h10" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" />
  ),
  export: (
    <path d="M14 3v4h-4M8 11l-4 4 4 4M12 15H4" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  check: (
    <path d="M3 8l3 3 6-6" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chart: (
    <path d="M1 12c2-5 6-7 10-5s6 6 8 8M1 4c3-3 7-2 10 1s5 6 7 7" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" />
  ),
  star: (
    <path d="M8 1l1.5 4h4.5l-3.5 2.5 1.3 4-4.3-2.3-4.3 2.3 1.3-4L2 5h4.5L8 1z" strokeWidth="1.6" fill="none" stroke="currentColor" />
  ),
  target: (
    <>
      <circle cx="8" cy="8" r="6" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <circle cx="8" cy="8" r="3" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <circle cx="8" cy="8" r="0.5" fill="currentColor" />
    </>
  ),
  person: (
    <>
      <circle cx="8" cy="5" r="3" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  people: (
    <>
      <circle cx="5" cy="6" r="3" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M1 15c0-2.5 2-4.5 4.5-4.5" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <circle cx="11" cy="8" r="2.5" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M14 15c0-2 1.5-3.5 3.5-3.5" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  box: (
    <path d="M2 4h6l2 8h8l2-8h6" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  layers: (
    <>
      <path d="M8 1l5 4-5 4-5-4 5-4z" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M3 7l5 4 5-4" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M3 10l5 4 5-4" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  alert: (
    <>
      <circle cx="8" cy="8" r="6" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M8 5v3M8 11v1" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  clock: (
    <>
      <circle cx="8" cy="8" r="6" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M8 4v4l3 2" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  search: (
    <>
      <circle cx="6" cy="6" r="4.5" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M9.5 9.5L14 14" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  plus: (
    <path d="M8 2v12M2 8h12" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" />
  ),
  x: (
    <path d="M4 4l8 8M12 4l-8 8" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" />
  ),
  edit: (
    <path d="M11 2l2 2-8 8H3v-2l8-8z" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  trash: (
    <>
      <path d="M3 4h10M5 4v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4M6 4V3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  arrowUp: (
    <path d="M8 13V3M4 7l4-4 4 4" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  arrowDown: (
    <path d="M8 3v10M4 7l4 4 4-4" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  mail: (
    <>
      <rect x="2" y="4" width="12" height="8" rx="2" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M2 6l6 4 6-4" strokeWidth="1.6" fill="none" stroke="currentColor" />
    </>
  ),
  linkExternal: (
    <path d="M10 3H4a1 1 0 0 0-1 1v6M14 13h4a1 1 0 0 0 1-1V7M11 6l5 5" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  layoutGrid: (
    <>
      <rect x="2" y="2" width="5" height="5" rx="1" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <rect x="9" y="2" width="5" height="5" rx="1" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <rect x="2" y="9" width="5" height="5" rx="1" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <rect x="9" y="9" width="5" height="5" rx="1" strokeWidth="1.6" stroke="currentColor" fill="none" />
    </>
  ),
  list: (
    <>
      <path d="M2 4h12M2 8h12M2 12h12" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="5" width="12" height="9" rx="2" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <path d="M5 5V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeWidth="1.6" stroke="currentColor" />
    </>
  ),
  fileText: (
    <>
      <path d="M3 2h7l3 3v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <path d="M3 6h10M6 9h4M6 12h4" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  settings: (
    <>
      <circle cx="8" cy="8" r="2.5" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <path d="M8 12.5v1.5M8 2v1.5M12.5 8h1.5M2 8h1.5M11.2 11.2l1.1 1.1M3.7 3.7l1.1 1.1M11.2 4.8l1.1-1.1M3.7 12.3l1.1-1.1" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  users: (
    <>
      <circle cx="6" cy="6" r="3" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <path d="M1 14a5 5 0 0 1 10 0" strokeWidth="1.6" stroke="currentColor" />
      <circle cx="11" cy="6" r="2.5" strokeWidth="1.6" stroke="currentColor" fill="none" />
    </>
  ),
  globe: (
    <>
      <circle cx="8" cy="8" r="6" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <path d="M2 8h12M8 2a11 11 0 0 0 0 12M8 2a11 11 0 0 1 0 12" strokeWidth="1.6" stroke="currentColor" />
    </>
  ),
  key: (
    <>
      <circle cx="5" cy="11" r="3" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <path d="M7.5 8.5L13 3l1.5 1.5M10.5 5.5l1.5 1.5" strokeWidth="1.6" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
  user: (
    <>
      <circle cx="8" cy="5" r="3" strokeWidth="1.6" stroke="currentColor" fill="none" />
      <path d="M3 14a5 5 0 0 1 10 0" strokeWidth="1.6" stroke="currentColor" />
    </>
  ),
  sparkles: (
    <path d="M8 1L9 5L13 6L9 7L8 11L7 7L3 6L7 5L8 1ZM13 10L13.5 12L15 12.5L13.5 13L13 15L12.5 13L11 12.5L12.5 12L13 10ZM3 2L3.5 4L5 4.5L3.5 5L3 7L2.5 5L1 4.5L2.5 4L3 2Z" fill="currentColor" stroke="none" />
  ),
  refresh: (
    <path d="M14 8a6 6 0 1 1-1-3.3M14 2v3h-3" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  chevronUp: (
    <path d="M4 10l4-4 4 4" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" />
  ),
  logOut: (
    <path d="M9 3h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9M1 8h9m-4-4l4 4-4 4" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  trendingUp: (
    <path d="M1 12l4-4 3 3 5-6 2 1" strokeWidth="1.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  trendingDown: (
    <path d="M1 4l4 4 3-3 5 6 2-1" strokeWidth="1.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
  ),
  minus: (
    <path d="M3 8h10" strokeWidth="1.8" fill="none" stroke="currentColor" strokeLinecap="round" />
  ),
  help: (
    <>
      <circle cx="8" cy="8" r="6" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M6 6.5a2 2 0 0 1 4 .7c0 1.3-2 1.8-2 3" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="8" cy="8" r="6" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M5 8l2 2 4-4" strokeWidth="1.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  alertTriangle: (
    <>
      <path d="M8 2L1 14h14L8 2z" strokeWidth="1.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6v4" strokeWidth="1.7" fill="none" stroke="currentColor" strokeLinecap="round" />
      <circle cx="8" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  lightbulb: (
    <>
      <path d="M8 1a5 5 0 0 1 3.5 8.5L11 11H5l-.5-1.5A5 5 0 0 1 8 1z" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M5.5 11v1a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1" strokeWidth="1.6" fill="none" stroke="currentColor" />
      <path d="M6.5 13.5h3" strokeWidth="1.4" fill="none" stroke="currentColor" strokeLinecap="round" />
    </>
  ),
}

export function Icon({ name, size = 16, color = colors.text2, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {icons[name]}
    </svg>
  )
}