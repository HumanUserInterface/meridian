'use client'

import { useEffect } from 'react'
import Sidebar from '@/components/dashboard/Sidebar'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Building2, Users, CreditCard, Sparkles, Check } from 'lucide-react'

export default function WorkspacePage() {
  const { initialize } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="bg-background border-b sticky top-0 z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Workspace</h1>
              <p className="text-sm text-muted-foreground">
                Manage your team and organization
              </p>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 max-w-4xl">
          <div className="space-y-6">
            {/* Upgrade Banner */}
            <Card className="border-[#1A4A6B]/20" style={{ background: 'linear-gradient(to right, rgba(26, 74, 107, 0.1), rgba(26, 74, 107, 0.05))' }}>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1A4A6B' }}>
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Upgrade to Pro</h3>
                      <p className="text-muted-foreground">
                        Unlock team collaboration and advanced features
                      </p>
                    </div>
                  </div>
                  <Button className="text-white hover:opacity-90" style={{ backgroundColor: '#1A4A6B' }}>
                    Upgrade Now
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Current Plan
                </CardTitle>
                <CardDescription>
                  Your subscription and billing details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <p className="font-semibold">Free Plan</p>
                    <p className="text-sm text-muted-foreground">Basic features for individuals</p>
                  </div>
                  <span className="text-2xl font-bold">$0/mo</span>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium">Includes:</p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Unlimited projects
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Export to CSV, JSON, XML
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Local storage
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Team Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Invite team members to collaborate on projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">Team collaboration is a Pro feature</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upgrade to invite team members and work together on projects
                  </p>
                  <Button variant="outline">
                    View Pro Plans
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Organization Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Organization
                </CardTitle>
                <CardDescription>
                  Create an organization for your company or team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No organization yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an organization to manage team access and billing centrally
                  </p>
                  <Button variant="outline" disabled>
                    Create Organization (Pro)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
