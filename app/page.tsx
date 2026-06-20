import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getUserState } from '@/app/actions/app'
import { Onboarding } from '@/components/onboarding'
import { AppShell } from '@/components/app-shell'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const state = await getUserState()

  if (!state.onboarded || !state.activeMood) {
    return <Onboarding name={session.user.name} />
  }

  return (
    <AppShell
      userName={session.user.name}
      initialState={{
        activeMood: state.activeMood,
        stats: state.stats,
        swipedMovieIds: state.swipedMovieIds,
      }}
    />
  )
}
