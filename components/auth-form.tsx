'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-between px-6 pb-10 pt-14">
      <div>
        <div className="flex items-center justify-between border-b border-foreground pb-3">
          <span className="eyebrow">Issue 01</span>
          <span className="eyebrow">Est. 2026</span>
        </div>

        <header className="mt-10">
          <p className="eyebrow">A curated cinema almanac</p>
          <h1 className="mt-4 font-display text-[3.75rem] font-bold uppercase leading-[0.86] tracking-tight">
            Reel
            <br />
            <span className="italic font-medium normal-case">Mood</span>
          </h1>
          <p className="mt-5 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">
            {isSignUp
              ? 'Create your reader card. Pick a mood, train your taste, and discover films worth your evening.'
              : 'Welcome back. Sign in to return to your moods and the films chosen for you.'}
          </p>
        </header>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <span className="index-numeral text-2xl text-muted-foreground">
            {isSignUp ? '00' : '01'}
          </span>
          <h2 className="font-display text-2xl font-bold">
            {isSignUp ? 'New subscriber' : 'Sign in'}
          </h2>
        </div>

        {isSignUp && (
          <div className="flex flex-col gap-1.5 border-b border-input pb-2">
            <Label htmlFor="name" className="eyebrow">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="h-9 rounded-none border-0 bg-transparent px-0 text-lg font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5 border-b border-input pb-2">
          <Label htmlFor="email" className="eyebrow">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="h-9 rounded-none border-0 bg-transparent px-0 text-lg font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>
        <div className="flex flex-col gap-1.5 border-b border-input pb-2">
          <Label htmlFor="password" className="eyebrow">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="h-9 rounded-none border-0 bg-transparent px-0 text-lg font-medium shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-12 w-full rounded-none text-sm font-semibold uppercase tracking-[0.18em]"
        >
          {loading
            ? 'Please wait…'
            : isSignUp
              ? 'Create account'
              : 'Enter'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already a subscriber? ' : 'Not yet a subscriber? '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </form>
    </main>
  )
}
