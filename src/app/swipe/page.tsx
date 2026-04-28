import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SwipeClient from './SwipeClient'

export default async function SwipePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single()

  if (!profile) redirect('/register')

  return <SwipeClient profile={profile} />
}
