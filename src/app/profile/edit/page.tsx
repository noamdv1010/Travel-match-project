import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EditProfileClient from './EditProfileClient'

export default async function EditProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('users').select('*').eq('auth_id', user.id).single()
  if (!profile) redirect('/register')

  return <EditProfileClient profile={profile} />
}
