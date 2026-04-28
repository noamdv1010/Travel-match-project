'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

interface MatchRow {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
}
interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
}

const SPONSORS: Record<string, { name: string; deal: string; sub: string; code: string }> = {
  'ארגנטינה':  { name: 'Milhouse Hostel BA',  deal: '10% הנחה לחדרים', sub: 'בואנוס איירס · Palermo Soho', code: 'TM10ARG' },
  'פרו':        { name: 'Loki Lima Hostel',     deal: '1 לילה חינם על 3',  sub: 'לימה · Miraflores',           code: 'TM1FREE' },
  'קולומביה':  { name: 'El Poblado Hostel',    deal: '15% הנחה',          sub: 'מדיין · El Poblado',           code: 'TM15COL' },
  'ברזיל':     { name: 'Mango Tree Hostel',    deal: '10% הנחה',          sub: 'ריו · Santa Teresa',           code: 'TM10BRA' },
  'בוליביה':   { name: 'Koala Den La Paz',     deal: '1 לילה חינם',       sub: 'לה פאז · Sopocachi',           code: 'TMKOALA' },
  "צ'ילה":     { name: 'Aji Hostel Santiago',  deal: '10% הנחה',          sub: 'סנטיאגו · Barrio Italia',      code: 'TM10CHL' },
  'תאילנד':    { name: 'NapPark Hostel BKK',   deal: '10% הנחה',          sub: "בנגקוק · Khaosan Rd",          code: 'TM10THA' },
  'ויאטנם':    { name: 'Hanoi Backpackers',    deal: '10% הנחה',          sub: 'האנוי · Old Quarter',          code: 'TM10VNM' },
  'הודו':      { name: 'Zostel Jaipur',        deal: '15% הנחה',          sub: "ג'איפור · העיר הורודה",        code: 'TM15IND' },
  'נפאל':      { name: 'Kathmandu GH',         deal: '1 לילה חינם על 3',  sub: 'קטמנדו · Thamel',              code: 'TM1NPL'  },
  'אינדונזיה': { name: 'Bali Backpackers',     deal: '10% הנחה',          sub: 'באלי · Seminyak',              code: 'TM10BAL' },
  'פורטוגל':   { name: 'Lisbon Lounge Hostel', deal: '10% הנחה',          sub: 'ליסבון · Bairro Alto',         code: 'TM10PRT' },
}
function getSponsor(dest: string) {
  return SPONSORS[dest] ?? { name: 'Hostelworld', deal: '10% הנחה', sub: 'מיליון הוסטלים ברחבי העולם', code: 'TM10' }
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'עכשיו'
  if (s < 3600) return `${Math.floor(s / 60)} דק'`
  if (s < 86400) return `${Math.floor(s / 3600)} שע'`
  return `${Math.floor(s / 86400)} ימים`
}

const BOT_REPLIES = [
  'מגניב! 🙌', 'כן בדיוק!', 'נשמע מטורף!', 'בוא נתכנן! 🗺️',
  'אחלה, מה הפלאן שלך שם?', 'כמה זמן אתה שם?', 'אני גם! נתאם פגישה?',
  'וואו גם אני! 🔥', 'כל כך נרגש! 🎉',
]

// ── Shared bottom nav ─────────────────────────────────────────────────────────
function BottomNav({ active }: { active: number }) {
  const tabs = [
    { href: '/swipe', label: 'גלה', icon: <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: active === 0 ? 'var(--g2)' : 'var(--t4)', fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
    { href: '/matches', label: "מאצ'ים", icon: <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: active === 1 ? 'var(--g2)' : 'var(--t4)', fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
    { href: '/likes', label: 'לייקים', icon: <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: active === 2 ? 'var(--g2)' : 'var(--t4)', fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> },
    { href: '/profile', label: 'פרופיל', icon: <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: active === 3 ? 'var(--g2)' : 'var(--t4)', fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
  ]
  return (
    <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 24px', flexShrink: 0, borderTop: '1px solid var(--b1)', background: 'linear-gradient(to top,var(--ink),rgba(5,6,10,.92))' }}>
      {tabs.map((tab, i) => (
        <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 16px' }}>
            {tab.icon}
            <span style={{ fontSize: 9, fontWeight: 600, color: active === i ? 'var(--g2)' : 'var(--t4)', letterSpacing: '.06em' }}>{tab.label}</span>
          </div>
        </Link>
      ))}
    </nav>
  )
}

// ── Chat view — premium redesign ──────────────────────────────────────────────
function ChatView({
  partner, matchId, myProfile, onBack,
}: { partner: UserProfile; matchId: string; myProfile: UserProfile; onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = useRef(createClient()).current
  const sp = getSponsor(partner.dest)
  const lastMsgCount = useRef(0)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight }, 60)
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('messages')
        .select('*').eq('match_id', matchId).order('created_at', { ascending: true })
      if (data) { setMessages(data); lastMsgCount.current = data.length }
      scrollToBottom()
    }
    load()

    if (!partner.is_bot) {
      pollRef.current = setInterval(async () => {
        const { data } = await supabase.from('messages')
          .select('*').eq('match_id', matchId).order('created_at', { ascending: true })
        if (data && data.length > lastMsgCount.current) {
          setMessages(data)
          lastMsgCount.current = data.length
          scrollToBottom()
        }
      }, 3000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [matchId, partner.is_bot, supabase, scrollToBottom])

  async function sendMsg() {
    const txt = input.trim()
    if (!txt || sending) return
    setInput('')
    setSending(true)
    const optimistic: Message = {
      id: Date.now().toString(), match_id: matchId,
      sender_id: myProfile.id, content: txt, created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])
    lastMsgCount.current++
    scrollToBottom()

    await supabase.from('messages').insert({ match_id: matchId, sender_id: myProfile.id, content: txt })
    setSending(false)

    if (partner.is_bot) {
      setIsTyping(true)
      setTimeout(() => {
        setIsTyping(false)
        const reply: Message = {
          id: (Date.now() + 1).toString(), match_id: matchId,
          sender_id: partner.id,
          content: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
          created_at: new Date().toISOString(),
        }
        setMessages(prev => [...prev, reply])
        scrollToBottom()
      }, 900 + Math.random() * 600)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--ink)' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '56px 18px 14px',
        flexShrink: 0, borderBottom: '1px solid var(--b1)',
        background: 'linear-gradient(to bottom,var(--ink1),var(--ink))',
        backdropFilter: 'blur(12px)',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', padding: '4px 8px 4px 0', display: 'flex', alignItems: 'center' }}>
          <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: 'var(--t2)', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', overflow: 'hidden', background: 'var(--ink3)', border: '2px solid var(--b2)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={partner.photo} alt={partner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${partner.gender === 'f' ? 'women' : 'men'}/1.jpg` }} />
          </div>
          {/* Online dot */}
          <div style={{
            position: 'absolute', bottom: 1, right: 1, width: 11, height: 11,
            borderRadius: '50%', background: 'var(--mint)',
            border: '2px solid var(--ink)',
            animation: 'online-pulse 2.5s ease-in-out infinite',
          }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--t1)', letterSpacing: '.01em' }}>{partner.name}</div>
          <div style={{ fontSize: 11, color: 'var(--mint)', marginTop: 1, letterSpacing: '.04em' }}>
            {isTyping ? '...מקליד' : 'מחובר'}
          </div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,.04)', border: '1px solid var(--b2)',
          borderRadius: 10, padding: '5px 10px',
          fontSize: 11, color: 'var(--t3)', flexShrink: 0,
        }}>
          {partner.dest_flag} {partner.dest}
        </div>
      </div>

      {/* Messages area */}
      <div ref={msgsRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 8px' }}>

        {/* Sponsor card */}
        <div style={{
          background: 'var(--ink3)', border: '1px solid var(--b2)',
          borderRadius: 18, padding: 14, marginBottom: 18,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,var(--g1),var(--cyan))' }} />
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--g2)', letterSpacing: '.12em', textTransform: 'uppercase', marginBottom: 4 }}>🏨 הצעה ל-TravelMatch</div>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--t1)', marginBottom: 2 }}>{sp.name}</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>{sp.deal} · קוד: <span style={{ color: 'var(--g3)', fontWeight: 700 }}>{sp.code}</span></div>
        </div>

        {/* Empty state — no auto messages */}
        {messages.length === 0 && !isTyping && (
          <div style={{ textAlign: 'center', padding: '28px 20px', color: 'var(--t3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>👋</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t2)', marginBottom: 6 }}>שניכם טסים ל{partner.dest}!</div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>שלח הודעה ראשונה והתחל לתכנן!</div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((m, idx) => {
          const isMe = m.sender_id === myProfile.id
          const prevMsg = messages[idx - 1]
          const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== m.sender_id)
          return (
            <div key={m.id} style={{
              display: 'flex',
              justifyContent: isMe ? 'flex-end' : 'flex-start',
              alignItems: 'flex-end',
              gap: 8,
              marginBottom: showAvatar && !isMe ? 10 : 4,
              animation: 'msg-in .28s ease',
            }}>
              {/* Avatar for partner — only on first message in a group */}
              {!isMe && (
                <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--ink3)', opacity: showAvatar ? 1 : 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={partner.photo} alt={partner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${partner.gender === 'f' ? 'women' : 'men'}/1.jpg` }} />
                </div>
              )}
              <div style={{
                maxWidth: '72%',
                borderRadius: isMe ? '20px 20px 6px 20px' : '20px 20px 20px 6px',
                padding: '11px 15px',
                fontSize: 14, lineHeight: 1.5,
                background: isMe
                  ? 'linear-gradient(135deg,#A855F7,#EC4899)'
                  : 'var(--ink3)',
                border: isMe ? 'none' : '1px solid var(--b2)',
                color: isMe ? '#fff' : 'var(--t1)',
                boxShadow: isMe
                  ? '0 4px 16px rgba(168,85,247,.28)'
                  : '0 2px 8px rgba(0,0,0,.25)',
              }}>
                {m.content}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 8, animation: 'msg-in .28s ease' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--ink3)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={partner.photo} alt={partner.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${partner.gender === 'f' ? 'women' : 'men'}/1.jpg` }} />
            </div>
            <div style={{
              background: 'var(--ink3)', border: '1px solid var(--b2)',
              borderRadius: '20px 20px 20px 6px', padding: '12px 16px',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%', background: 'var(--t3)',
                  animation: `bounce .9s ${i * 0.18}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div style={{
        padding: '10px 14px 32px', flexShrink: 0,
        background: 'var(--ink1)', borderTop: '1px solid var(--b1)',
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMsg()}
          placeholder="הודעה..."
          style={{
            flex: 1, background: 'rgba(255,255,255,.06)',
            border: '1px solid var(--b2)', borderRadius: 24,
            color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 14,
            padding: '12px 18px', outline: 'none',
            transition: 'border-color .2s',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--gborder)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--b2)' }}
        />
        <button
          onClick={sendMsg}
          disabled={!input.trim() || sending}
          style={{
            width: 46, height: 46, flexShrink: 0,
            background: input.trim()
              ? 'linear-gradient(135deg,#A855F7,#EC4899)'
              : 'rgba(255,255,255,.06)',
            border: 'none', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            transition: 'all .2s',
            boxShadow: input.trim() ? '0 4px 16px rgba(168,85,247,.35)' : 'none',
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: input.trim() ? '#fff' : 'var(--t4)', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MatchesClient({ profile }: { profile: UserProfile }) {
  const [matches, setMatches] = useState<(UserProfile & { matchId: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState<{ partner: UserProfile; matchId: string } | null>(null)
  const [lastMessages, setLastMessages] = useState<Record<string, Message>>({})
  const supabase = useRef(createClient()).current

  const fetchLastMessages = useCallback(async (matchList: (UserProfile & { matchId: string })[]) => {
    if (!matchList.length) return
    const results: Record<string, Message> = {}
    await Promise.all(matchList.map(async m => {
      const { data } = await supabase.from('messages')
        .select('*').eq('match_id', m.matchId)
        .order('created_at', { ascending: false }).limit(1)
      if (data?.length) results[m.matchId] = data[0]
    }))
    setLastMessages(results)
  }, [supabase])

  useEffect(() => {
    async function load() {
      const { data: matchRows } = await supabase.from('matches').select('*')
        .or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })

      if (!matchRows?.length) { setLoading(false); return }

      const partnerIds = matchRows.map((m: MatchRow) => m.user1_id === profile.id ? m.user2_id : m.user1_id)
      const { data: partners } = await supabase.from('users').select('*').in('id', partnerIds)

      const enriched = matchRows.map((m: MatchRow) => {
        const partnerId = m.user1_id === profile.id ? m.user2_id : m.user1_id
        const partner = partners?.find((p: UserProfile) => p.id === partnerId)
        return partner ? { ...partner, matchId: m.id } : null
      }).filter(Boolean) as (UserProfile & { matchId: string })[]

      setMatches(enriched)
      setLoading(false)
      fetchLastMessages(enriched)
    }
    load()
  }, [profile.id, supabase, fetchLastMessages])

  if (activeChat) {
    return (
      <ChatView
        partner={activeChat.partner}
        matchId={activeChat.matchId}
        myProfile={profile}
        onBack={() => {
          setActiveChat(null)
          // Refresh last messages when returning from chat
          fetchLastMessages(matches)
        }}
      />
    )
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--ink)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '58px 22px 14px', flexShrink: 0, borderBottom: '1px solid var(--b1)' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, letterSpacing: .3, marginBottom: 2 }}>מאצ׳ים</div>
        <div style={{ fontSize: 12, color: 'var(--t3)', letterSpacing: '.04em' }}>
          {loading ? 'טוען...' : matches.length === 0 ? 'עוד אין מאצ\'ים — המשך להחליק!' : `יש לך ${matches.length} מאצ'ים`}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* New matches row */}
        {matches.length > 0 && (
          <>
            <div style={{ padding: '14px 22px 6px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>חדשים</div>
            <div style={{ display: 'flex', gap: 14, padding: '0 18px 16px', overflowX: 'auto' }}>
              {matches.slice(0, 8).map(m => (
                <div key={m.matchId} onClick={() => setActiveChat({ partner: m, matchId: m.matchId })} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', background: 'var(--ink3)', border: '2px solid var(--g2)', padding: 2, position: 'relative' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${m.gender === 'f' ? 'women' : 'men'}/1.jpg` }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--t2)', letterSpacing: '.02em', maxWidth: 64, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name.split(' ')[0]}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Conversations */}
        {matches.length > 0 && (
          <div style={{ padding: '0 0 8px' }}>
            <div style={{ padding: '6px 22px 10px', fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>שיחות</div>
            {matches.map(m => {
              const lastMsg = lastMessages[m.matchId]
              const hasUnread = lastMsg && lastMsg.sender_id !== profile.id
              return (
                <div
                  key={m.matchId}
                  onClick={() => setActiveChat({ partner: m, matchId: m.matchId })}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', borderBottom: '1px solid var(--b1)', transition: 'background .15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,.025)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{ width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', background: 'var(--ink3)' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${m.gender === 'f' ? 'women' : 'men'}/1.jpg` }} />
                    </div>
                    {hasUnread && (
                      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, background: 'var(--g2)', border: '2px solid var(--ink)', borderRadius: '50%' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--t1)', marginBottom: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{m.name}</span>
                      <span style={{ fontSize: 10, color: 'var(--t3)', fontWeight: 400, letterSpacing: '.02em' }}>
                        {lastMsg ? timeAgo(lastMsg.created_at) : ''}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: hasUnread ? 'var(--t2)' : 'var(--t3)', fontWeight: hasUnread ? 500 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
                      {lastMsg
                        ? (lastMsg.sender_id === profile.id ? 'אתה: ' : '') + lastMsg.content
                        : 'אין הודעות עדיין — שלח ראשון!'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--t4)' }}>{m.dest_flag} {m.dest}{!m.is_bot ? ' · 👤' : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!loading && matches.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center', gap: 10 }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>💫</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--t1)' }}>עוד אין מאצ׳ים</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.65 }}>החלק ימינה כדי למצוא שותפים לטיול!</div>
            <Link href="/swipe" style={{ textDecoration: 'none' }}>
              <button style={{ marginTop: 12, padding: '13px 28px', background: 'linear-gradient(145deg,var(--g3),var(--g1),var(--g2))', border: 'none', borderRadius: 14, color: '#fff', fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 13, cursor: 'pointer', letterSpacing: '.06em' }}>
                גלה תרמילאים ✦
              </button>
            </Link>
          </div>
        )}
      </div>

      <BottomNav active={1} />
    </div>
  )
}
