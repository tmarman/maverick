'use client'

import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  UserPlus, 
  Mail, 
  Key, 
  Users, 
  ArrowRight,
  Info
} from 'lucide-react'

export default function InviteRequiredPage() {
  return (
    <div className="min-h-screen bg-background-primary">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-4">
            Invite Code Required
          </h1>
          <p className="text-lg text-text-secondary">
            Maverick is currently in private beta. You'll need an invite code to create an account.
          </p>
        </div>

        <Alert className="mb-8 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <div className="font-medium mb-1">Don't have an invite code yet?</div>
            <div className="text-sm">
              Join our waitlist to be among the first to get access when we open up more spots.
            </div>
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          {/* Get Invite Code Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-green-600" />
                <span>How to get an invite code</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Join the Waitlist
                  </h3>
                  <p className="text-text-secondary text-sm mb-3">
                    The fastest way to get access. We're sending invite codes to waitlist members weekly.
                  </p>
                  <Link href="/waitlist">
                    <Button className="h-8 text-xs">
                      Join Waitlist <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Get Invited by a Friend
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Ask someone who already has Maverick access to send you an invite. 
                    Every user can invite others during the beta.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <Key className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-text-primary mb-2">
                    Already have a code?
                  </h3>
                  <p className="text-text-secondary text-sm mb-3">
                    If you have an invite code, you can register immediately.
                  </p>
                  <Link href="/register">
                    <Button variant="outline" className="h-8 text-xs">
                      Register with Code <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why Private Beta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Why is Maverick invite-only?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-text-secondary">
                <p>
                  We're building something revolutionary - AI that can create entire business applications from just a description. 
                  During our private beta, we want to:
                </p>
                <ul className="space-y-1 ml-4">
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    Ensure every user gets personalized support
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    Gather detailed feedback to improve the platform
                  </li>
                  <li className="flex items-start">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                    Build a community of early adopters who shape our development
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-center space-x-4 pt-8">
            <Link href="/waitlist">
              <Button size="lg">
                🚀 Join the Waitlist
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" size="lg">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}