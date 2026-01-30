'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Layers,
  Settings,
  Building2,
  LogOut,
  User,
  ChevronRight,
  ChevronsUpDown,
} from 'lucide-react'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
  badge?: string
}

const navItems: NavItem[] = [
  {
    label: 'Cocoon Planner',
    icon: <Layers className="w-5 h-5" />,
    href: '/',
  },
]

const settingsItems: NavItem[] = [
  {
    label: 'User Settings',
    icon: <Settings className="w-5 h-5" />,
    href: '/settings',
  },
  {
    label: 'Workspace',
    icon: <Building2 className="w-5 h-5" />,
    href: '/workspace',
    badge: 'Pro',
  },
]

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, initialize, signOut } = useAuthStore()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleSignOut = async () => {
    await signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary text-primary-foreground">
                  {item.badge}
                </span>
              )}
              {isActive && <ChevronRight className="w-4 h-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="md:hidden">
            {item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <aside className="w-64 bg-background border-r flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b">
        <img
          src={resolvedTheme === 'dark' ? '/logo-dark.svg' : '/logo.svg'}
          alt="Meridian - Semantic Cocoon Planner"
          className="h-12 w-auto"
        />
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Tools Section */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Tools
          </p>
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        {/* Settings Section */}
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Settings
          </p>
          {settingsItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 h-auto py-2"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
                <span className="text-primary-foreground text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || 'Loading...'}
                </p>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="w-4 h-4 mr-2" />
              Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
