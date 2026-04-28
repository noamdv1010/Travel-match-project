export interface UserProfile {
  id: string
  auth_id: string
  email: string
  name: string
  age: number
  gender: 'm' | 'f' | 'nb'
  dest: string
  dest_flag: string
  land_date: string
  duration: string
  styles: string[]
  bio: string
  photo: string
  is_bot: boolean
  is_gold: boolean
  likes_left: number
  created_at: string
}

export interface Swipe {
  id: string
  swiper_id: string
  swiped_id: string
  direction: 'left' | 'right' | 'super'
  created_at: string
}

export interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'like' | 'match' | 'super'
  from_user_id: string
  read: boolean
  created_at: string
}

export const DESTINATIONS = [
  { name: 'ארגנטינה', flag: '🇦🇷' },
  { name: 'פרו', flag: '🇵🇪' },
  { name: 'קולומביה', flag: '🇨🇴' },
  { name: 'ברזיל', flag: '🇧🇷' },
  { name: 'בוליביה', flag: '🇧🇴' },
  { name: 'צ׳ילה', flag: '🇨🇱' },
  { name: 'תאילנד', flag: '🇹🇭' },
  { name: 'ויאטנם', flag: '🇻🇳' },
  { name: 'הודו', flag: '🇮🇳' },
  { name: 'נפאל', flag: '🇳🇵' },
  { name: 'אינדונזיה', flag: '🇮🇩' },
  { name: 'פורטוגל', flag: '🇵🇹' },
] as const

export const DURATIONS = [
  'שבועיים',
  'חודש',
  'חודשיים',
  'שלושה חודשים',
  'חצי שנה',
  'שנה+',
] as const

export const TRAVEL_STYLES = [
  '🥾 טראקים',
  '🏖️ חופים',
  '🎉 מסיבות',
  '📸 צילום',
  '🍜 אוכל מקומי',
  '🧘 שקט',
  '💰 תקציבאי',
  '🏔️ הרים',
  '🚗 רכב שכור',
  '🌊 גלישה',
] as const
