'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, Notification, DESTINATIONS } from '@/types'

// ── Local types ──────────────────────────────────────────────────────────────
interface QueueItem extends UserProfile { _realLikes?: number; _score?: number }
interface AdCard {
  _isAd: true; id: string; brand: string; logo: string
  tagline: string; headline: string; body: string
  cta: string; color: string; url: string
}
type SwipeItem = QueueItem | AdCard

// ── Stack transforms — pronounced depth ──────────────────────────────────────
const ST = [
  'scale(1) translateY(0)',
  'scale(0.952) translateY(9px)',
  'scale(0.908) translateY(18px)',
  'scale(0.868) translateY(27px)',
] as const

// ── Ad cards ─────────────────────────────────────────────────────────────────
const AD_CARDS: Omit<AdCard, '_isAd'>[] = [
  {
    id: 'ad1', brand: 'SafetyWing', logo: '🌐',
    tagline: 'ביטוח נסיעות לתרמילאים',
    headline: 'רק $1.8 ליום', cta: 'לפרטים',
    body: 'כיסוי רפואי מלא ב-180 מדינות. כולל קורונה ופינוי חירום.',
    color: '#38BDF8', url: 'https://safetywing.com',
  },
  {
    id: 'ad2', brand: 'Hostelworld', logo: '🏠',
    tagline: 'מצא הוסטל בדרך שלך',
    headline: '10% הנחה עם TM10', cta: 'לחפש הוסטל',
    body: 'מעל מיליון ביקורות אמיתיות. הזמן עכשיו ושלם בהוסטל.',
    color: '#F97316', url: 'https://hostelworld.com',
  },
  {
    id: 'ad3', brand: 'Airalo', logo: '📡',
    tagline: 'eSIM זול לכל העולם',
    headline: 'אינטרנט מ-$5', cta: 'קנה eSIM',
    body: 'תכניות eSIM ל-190+ מדינות. אין חוזים, אין הפתעות.',
    color: '#8B5CF6', url: 'https://airalo.com',
  },
  {
    id: 'ad4', brand: 'Wise', logo: '💸',
    tagline: 'העברת כסף בשער אמיתי',
    headline: 'ללא עמלות נסתרות', cta: 'פתח חשבון',
    body: 'שלח כסף הביתה בשער הבנק האמיתי. חסוך אלפי שקלים.',
    color: '#10B981', url: 'https://wise.com',
  },
]

// ── Sponsor data ─────────────────────────────────────────────────────────────
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

// ── Pure helpers ─────────────────────────────────────────────────────────────
function dateDiffText(myDate: Date, theirDate: Date): string {
  const diff = Math.round((theirDate.getTime() - myDate.getTime()) / 86400000)
  if (diff === 0) return '✨ אותו תאריך!'
  if (diff > 0) return `+${diff} ימים אחריך`
  return `${Math.abs(diff)} ימים לפניך`
}
function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'עכשיו'
  if (s < 3600) return `${Math.floor(s / 60)} דק'`
  if (s < 86400) return `${Math.floor(s / 3600)} שע'`
  return `${Math.floor(s / 86400)} ימים`
}
function getVisibleItems(queue: QueueItem[], idx: number, adCount: number, n = 4): SwipeItem[] {
  const items: SwipeItem[] = []
  let qi = idx
  let shown = adCount
  while (items.length < n && qi < queue.length) {
    if (shown > 0 && shown % 5 === 0) {
      const adBase = AD_CARDS[(Math.floor(shown / 5) - 1) % AD_CARDS.length]
      items.push({ ...adBase, _isAd: true })
      shown = 0
    } else {
      items.push(queue[qi])
      qi++
      shown++
    }
  }
  return items
}

// ── Compatibility scoring ─────────────────────────────────────────────────────
function compatScore(me: UserProfile, them: UserProfile): number {
  let score = 0
  if (them.dest === me.dest) score += 50
  const dateDiff = Math.abs((new Date(them.land_date).getTime() - new Date(me.land_date).getTime()) / 86400000)
  if (dateDiff <= 30) score += 30
  const myStyleSet = new Set(me.styles ?? [])
  score += (them.styles ?? []).filter(s => myStyleSet.has(s)).length * 15
  if (them.duration && me.duration && them.duration === me.duration) score += 10
  return score
}

// ── Undo daily limit persistence ──────────────────────────────────────────────
function getTodayKey() { return new Date().toISOString().split('T')[0] }
function loadUndosUsed(): number {
  if (typeof window === 'undefined') return 0
  try {
    const d = localStorage.getItem('tm_undos')
    if (!d) return 0
    const { date, used } = JSON.parse(d)
    return date === getTodayKey() ? (used ?? 0) : 0
  } catch { return 0 }
}
function saveUndosUsed(used: number) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem('tm_undos', JSON.stringify({ date: getTodayKey(), used })) } catch {}
}

// ── AdOverlay — beautiful 5-second countdown ad ───────────────────────────────
function AdOverlay({ onClose }: { onClose: (earned: boolean) => void }) {
  const [secs, setSecs] = useState(5)
  const [done, setDone] = useState(false)
  const ad = useMemo(() => AD_CARDS[Math.floor(Math.random() * AD_CARDS.length)], [])
  const CIRC = 175.93

  useEffect(() => {
    const t = setInterval(() => {
      setSecs(s => {
        if (s <= 1) { setDone(true); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  // Countdown: starts full (offset=0), drains to empty (offset=CIRC)
  const timerOffset = ((5 - secs) / 5) * CIRC

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(2,3,6,.97)', backdropFilter: 'blur(24px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '60px 22px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t4)', letterSpacing: '.16em', textTransform: 'uppercase' }}>פרסומת</div>
        <button
          onClick={() => done && onClose(false)}
          style={{
            padding: '7px 18px', borderRadius: 100,
            background: done ? 'rgba(255,255,255,.09)' : 'transparent',
            border: `1px solid ${done ? 'rgba(255,255,255,.2)' : 'transparent'}`,
            color: done ? 'var(--t2)' : 'transparent',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)',
            cursor: done ? 'pointer' : 'default', transition: 'all .45s',
          }}
        >
          דלג
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 28px 28px' }}>
        {/* Circular countdown timer */}
        <div style={{ position: 'relative', marginBottom: 28, width: 80, height: 80 }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="adTG" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A855F7"/>
                <stop offset="100%" stopColor="#EC4899"/>
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="28" fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="4.5" />
            <circle
              cx="40" cy="40" r="28" fill="none"
              stroke="url(#adTG)" strokeWidth="4.5" strokeLinecap="round"
              strokeDasharray={CIRC} strokeDashoffset={timerOffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--serif)', fontSize: done ? 20 : 26, fontWeight: 700, color: 'var(--t1)', transition: 'font-size .3s',
          }}>
            {done ? '✓' : secs}
          </div>
        </div>

        {/* Ad card */}
        <div style={{
          width: '100%', maxWidth: 340, borderRadius: 24, padding: '28px 24px', textAlign: 'center', marginBottom: 22,
          background: `linear-gradient(135deg, ${ad.color}18, ${ad.color}08)`,
          border: `1px solid ${ad.color}32`,
        }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>{ad.logo}</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 24, fontWeight: 700, marginBottom: 5, color: 'var(--t1)' }}>{ad.brand}</div>
          <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 8, lineHeight: 1.55 }}>{ad.tagline}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: ad.color, marginBottom: 10 }}>{ad.headline}</div>
          <div style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.65 }}>{ad.body}</div>
          {done && (
            <button onClick={() => window.open(ad.url, '_blank')} style={{
              marginTop: 14, padding: '9px 24px', borderRadius: 12,
              background: ad.color, border: 'none', color: '#fff',
              fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em',
            }}>
              {ad.cta} →
            </button>
          )}
        </div>

        {/* Reward / waiting */}
        {done ? (
          <div style={{
            width: '100%', maxWidth: 340, padding: '22px 24px', borderRadius: 22, textAlign: 'center',
            background: 'linear-gradient(135deg,rgba(72,216,154,.1),rgba(6,182,212,.07))',
            border: '1px solid rgba(72,216,154,.3)', animation: 'fade-up .4s ease',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--mint)', marginBottom: 4 }}>+5 לייקים!</div>
            <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 18 }}>הלייקים נוספו לחשבון שלך</div>
            <button onClick={() => onClose(true)} style={{
              width: '100%', padding: 15, borderRadius: 14,
              background: 'linear-gradient(135deg,var(--mint),var(--cyan))',
              border: 'none', color: '#fff', fontFamily: 'var(--sans)',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em',
            }}>
              המשך להחליק ❤️
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--t3)', textAlign: 'center', lineHeight: 1.6 }}>
            צפה עד הסוף לקבל{' '}
            <span style={{ color: 'var(--mint)', fontWeight: 700 }}>+5 לייקים</span> בחינם
          </div>
        )}
      </div>
    </div>
  )
}

// ── MatchOverlay — full-screen spectacular celebration ────────────────────────
function MatchOverlay({
  user, myProfile, onClose, onGoToMatches,
}: { user: UserProfile; myProfile: UserProfile; onClose: () => void; onGoToMatches: () => void }) {
  const sp = getSponsor(user.dest)

  // Deterministic confetti — radial explosion from center
  const confetti = useMemo(() => Array.from({ length: 32 }, (_, i) => {
    const a = (i / 32) * Math.PI * 2
    const d = 155 + (i % 5) * 46
    const colors = ['#F472B6','#A855F7','#EC4899','#8B5CF6','#06B6D4','#10B981','#F59E0B','#FB7185']
    const w = 7 + (i % 4) * 2.5
    return {
      id: i,
      tx: Math.round(Math.cos(a) * d),
      ty: Math.round(Math.sin(a) * d - 55),
      tr: i * 53,
      color: colors[i % 8],
      w, h: i % 3 === 2 ? w * 1.7 : w,
      radius: i % 3 === 1 ? '50%' : '3px',
      delay: `${(i % 8) * 0.045}s`,
    }
  }), [])

  // Floating hearts — staggered, continuous
  const hearts = useMemo(() => Array.from({ length: 9 }, (_, i) => ({
    id: i,
    left: `${5 + (i / 8) * 90}%`,
    delay: `${i * 0.24}s`,
    fontSize: 14 + (i % 3) * 8,
    dur: `${2.4 + (i % 3) * 0.55}s`,
  })), [])

  function copyCode() {
    try { navigator.clipboard.writeText(sp.code) } catch {}
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden', background: 'rgba(2,3,8,.98)' }}>

      {/* Atmospheric background glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 440, height: 440, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.4) 0%,transparent 65%)', filter: 'blur(72px)', top: '2%', left: '50%', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,.32) 0%,transparent 65%)', filter: 'blur(60px)', bottom: '12%', left: '8%' }} />
        <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(6,182,212,.22) 0%,transparent 65%)', filter: 'blur(55px)', bottom: '10%', right: '5%' }} />
      </div>

      {/* Expanding rings */}
      <div style={{ position: 'absolute', top: '34%', left: '50%', pointerEvents: 'none' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            position: 'absolute', width: 148, height: 148, borderRadius: '50%',
            border: `1.5px solid rgba(236,72,153,${0.55 - i * 0.12})`,
            animation: `ring-expand 1.6s ${i * 0.3}s cubic-bezier(.25,.46,.45,.94) forwards`,
          }} />
        ))}
      </div>

      {/* Floating hearts — continuous */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {hearts.map(h => (
          <div key={h.id} style={{
            position: 'absolute', bottom: '18%', left: h.left,
            fontSize: h.fontSize, opacity: 0,
            animation: `heart-rise ${h.dur} ${h.delay} ease-in infinite`,
          }}>❤️</div>
        ))}
      </div>

      {/* Confetti explosion */}
      <div style={{ position: 'absolute', top: '37%', left: '50%', pointerEvents: 'none' }}>
        {confetti.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            width: p.w, height: p.h, borderRadius: p.radius, background: p.color,
            animation: `confetti-fly 1.7s ${p.delay} cubic-bezier(.25,.46,.45,.94) forwards`,
            '--tx': `${p.tx}px`, '--ty': `${p.ty}px`, '--tr': `${p.tr}deg`,
          } as React.CSSProperties} />
        ))}
      </div>

      {/* Scrollable content */}
      <div style={{
        position: 'relative', zIndex: 10, height: '100%',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '64px 24px 44px', textAlign: 'center',
      }}>

        {/* Overlapping photos — fly in from sides */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr', marginBottom: 22 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
            border: '3px solid rgba(236,72,153,.55)', background: 'var(--ink3)',
            marginRight: -20, zIndex: 2, flexShrink: 0,
            boxShadow: '-4px 0 24px rgba(0,0,0,.55), 0 4px 22px rgba(236,72,153,.28)',
            animation: 'photo-from-left .55s var(--spring) .2s both',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={myProfile.photo} alt={myProfile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg,#EC4899,#A855F7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, zIndex: 10, flexShrink: 0,
            boxShadow: '0 0 32px rgba(236,72,153,.75)',
            animation: 'scale-pop .4s var(--spring) .74s both',
          }}>💛</div>
          <div style={{
            width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
            border: '3px solid rgba(168,85,247,.55)', background: 'var(--ink3)',
            marginLeft: -20, zIndex: 2, flexShrink: 0,
            boxShadow: '4px 0 24px rgba(0,0,0,.55), 0 4px 22px rgba(168,85,247,.28)',
            animation: 'photo-from-right .55s var(--spring) .2s both',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>

        {/* "IT'S A MATCH" title — dramatic spring bounce */}
        <div style={{
          fontFamily: 'var(--serif)', fontSize: 46, fontWeight: 700,
          lineHeight: 1, letterSpacing: '.01em',
          background: 'linear-gradient(135deg,#F472B6 0%,#A855F7 55%,#EC4899 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          animation: 'match-title .65s var(--spring) .65s both',
          marginBottom: 10,
        }}>
          זה מאצ׳!
        </div>

        <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.65, marginBottom: 22, animation: 'fade-up .5s ease .92s both' }}>
          {`אתה ו${user.name} שניכם טסים ל${user.dest}! 🌍`}
        </div>

        {/* Sponsor box */}
        <div style={{
          background: 'rgba(164,40,180,.07)', border: '1px solid rgba(164,40,180,.22)',
          borderRadius: 18, padding: 16, width: '100%', maxWidth: 320, textAlign: 'right',
          position: 'relative', overflow: 'hidden', marginBottom: 18,
          animation: 'fade-up .5s ease 1.02s both',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1.5, background: 'linear-gradient(90deg,var(--g1),var(--cyan))' }} />
          <div style={{ fontSize: 8, fontWeight: 700, color: 'var(--g2)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 5 }}>✦ הצעה בלעדית</div>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 15, fontWeight: 700, marginBottom: 2, color: 'var(--t1)' }}>{sp.name}</div>
          <div style={{ fontSize: 12, color: 'var(--cyan)', fontWeight: 600, marginBottom: 2 }}>{sp.deal}</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 8 }}>{sp.sub}</div>
          <div onClick={copyCode} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(164,40,180,.12)', border: '1px solid rgba(164,40,180,.28)',
            borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, color: 'var(--g3)', cursor: 'pointer',
          }}>
            📋 {sp.code}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 10, animation: 'fade-up .5s ease 1.12s both' }}>
          <button onClick={onGoToMatches} style={{
            width: '100%', padding: 17, borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg,#A855F7 0%,#EC4899 100%)',
            color: '#fff', fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '.04em',
            boxShadow: '0 8px 36px rgba(168,85,247,.42)',
          }}>
            שלח הודעה 💬
          </button>
          <button onClick={onClose} style={{
            width: '100%', padding: 14, borderRadius: 16,
            background: 'transparent', border: '1px solid rgba(255,255,255,.1)',
            color: 'var(--t3)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer',
          }}>
            המשך להחליק
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ProfileModal ─────────────────────────────────────────────────────────────
function ProfileModal({
  user, myProfile, onClose, onSwipe,
}: { user: UserProfile; myProfile: UserProfile; onClose: () => void; onSwipe: (dir: 'left' | 'right') => void }) {
  const myDate = new Date(myProfile.land_date)
  const diffTxt = dateDiffText(myDate, new Date(user.land_date))
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.88)', backdropFilter: 'blur(16px)', overflowY: 'auto' }}>
      <div style={{ maxWidth: 430, margin: '0 auto' }}>
        {/* Hero */}
        <div style={{ position: 'relative', height: 380 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'var(--ink3)', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(2,3,6,1) 0%,rgba(2,3,6,.3) 55%,transparent 100%)' }} />
          <button onClick={onClose} style={{ position: 'absolute', top: 54, right: 16, background: 'rgba(2,3,6,.6)', backdropFilter: 'blur(12px)', border: '1px solid var(--b2)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, color: 'var(--t2)' }}>✕</button>
        </div>
        {/* Info */}
        <div style={{ background: 'var(--ink1)', padding: '20px 22px 26px', borderTop: '1px solid var(--b2)' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 30, fontWeight: 700, marginBottom: 5, letterSpacing: .3 }}>{user.name}, {user.age}</div>
          <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 14, letterSpacing: '.02em' }}>{user.dest_flag} {user.dest} · {user.duration}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--b2)', borderRadius: 10, padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t2)' }}>📅 {diffTxt}</div>
            <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid var(--b2)', borderRadius: 10, padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--t2)' }}>⏱️ {user.duration}</div>
            {!user.is_bot && <div style={{ background: 'rgba(77,189,232,.08)', border: '1px solid rgba(77,189,232,.25)', borderRadius: 10, padding: '8px 14px', fontSize: 12, color: 'var(--cyan)' }}>👤 משתמש אמיתי</div>}
          </div>
          {user.bio && <div style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, marginBottom: 16 }}>{user.bio}</div>}
          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10 }}>סגנון טיול</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {(user.styles ?? []).map(s => (
              <div key={s} style={{ background: 'rgba(255,255,255,.05)', border: '1px solid var(--b2)', borderRadius: 100, padding: '6px 14px', fontSize: 11, color: 'var(--t2)', letterSpacing: '.02em' }}>{s}</div>
            ))}
          </div>
        </div>
        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, padding: '0 22px 36px', background: 'var(--ink1)' }}>
          <button onClick={() => { onClose(); onSwipe('left') }} style={{ flex: 1, padding: 15, background: 'rgba(232,85,128,.08)', border: '1px solid rgba(232,85,128,.2)', borderRadius: 14, color: 'var(--pink)', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer', letterSpacing: '.04em' }}>
            דלג ✕
          </button>
          <button onClick={() => { onClose(); onSwipe('right') }} style={{ flex: 1, padding: 15, background: 'linear-gradient(145deg,var(--cyan),var(--cyan2))', border: 'none', borderRadius: 14, color: '#fff', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em' }}>
            לייק ♥
          </button>
        </div>
      </div>
    </div>
  )
}

// ── NotifPanel ────────────────────────────────────────────────────────────────
function NotifPanel({
  notifs, userMap, onClose,
}: { notifs: Notification[]; userMap: Map<string, UserProfile>; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 170, background: 'rgba(0,0,0,.4)' }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, width: 'min(340px, 95vw)', height: '100vh',
        background: 'rgba(10,12,18,.97)', backdropFilter: 'blur(24px)',
        borderLeft: '1px solid var(--b2)', zIndex: 180, display: 'flex', flexDirection: 'column',
        padding: '58px 0 0',
      }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 58, left: 16, background: 'none', border: 'none', color: 'var(--t3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        <div style={{ padding: '0 22px 18px', borderBottom: '1px solid var(--b1)' }}>
          <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--t1)' }}>התראות</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
          {notifs.length === 0
            ? <div style={{ padding: 20, textAlign: 'center', color: 'var(--t3)', fontSize: 14 }}>עוד אין התראות 👀</div>
            : notifs.map(n => {
              const sender = userMap.get(n.from_user_id)
              const isLike = n.type === 'like' || n.type === 'super'
              const isMatch = n.type === 'match'
              return (
                <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: n.read ? 'rgba(255,255,255,.03)' : 'rgba(77,189,232,.05)', border: `1px solid ${n.read ? 'var(--b1)' : 'rgba(77,189,232,.2)'}`, borderRadius: 14, marginBottom: 8 }}>
                  {/* Avatar — silhouette only for likes/supers, revealed for matches */}
                  <div style={{ width: 48, height: 48, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: isLike ? 'rgba(255,255,255,.06)' : 'var(--ink3)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', border: isLike ? '1.5px solid rgba(255,255,255,.1)' : 'none' }}>
                    {isLike ? (
                      <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, fill: 'rgba(255,255,255,0.18)' }}>
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                      </svg>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sender?.photo ?? ''} alt={sender?.name ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: isLike ? 'var(--t3)' : 'var(--t1)' }}>
                      {isLike ? 'מישהו' : (sender?.name ?? 'מישהו')}
                    </div>
                    <div style={{ fontSize: 12, color: isLike ? 'var(--t2)' : 'var(--t3)', marginTop: 2, fontWeight: isLike ? 500 : 400 }}>
                      {n.type === 'like' ? 'קיבלת לייק חדש 👀' :
                       n.type === 'super' ? 'קיבלת סופר לייק! ⭐' :
                       isMatch ? `${sender?.name ?? 'מישהו'} — זה מאצ׳! 🎉` :
                       'פעילות חדשה'}
                    </div>
                    {isLike && (
                      <div style={{ fontSize: 10, color: 'var(--g3)', marginTop: 3, letterSpacing: '.03em' }}>שדרג ל-Gold לחשיפה ✦</div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--t4)', marginTop: 2, letterSpacing: '.04em' }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.read && <div style={{ width: 8, height: 8, background: 'var(--cyan)', borderRadius: '50%', flexShrink: 0 }} />}
                </div>
              )
            })
          }
        </div>
      </div>
    </>
  )
}

// ── PremiumModal ──────────────────────────────────────────────────────────────
function PremiumModal({ onClose }: { onClose: () => void }) {
  const features = [
    { icon: '❤️', bg: 'rgba(232,85,128,.1)', title: 'לייקים ללא הגבלה', sub: 'החלק כמה שאתה רוצה' },
    { icon: '👀', bg: 'rgba(77,189,232,.1)', title: 'ראה מי לייקד אותך', sub: 'גלה מי מחכה לך' },
    { icon: '⭐', bg: 'rgba(168,85,247,.12)', title: 'סופר לייקים יומיים', sub: '5 סופר לייקים ביום' },
    { icon: '↩️', bg: 'rgba(255,255,255,.05)', title: 'ביטול החלקה', sub: '3 ביטולים ביום' },
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', background: 'rgba(2,3,6,.82)', backdropFilter: 'blur(16px)' }}>
      <div style={{ background: 'linear-gradient(160deg,var(--ink2),var(--ink3))', borderRadius: '28px 28px 0 0', padding: '30px 24px 50px', width: '100%', maxWidth: 430, margin: '0 auto', borderTop: '1px solid var(--b2)' }}>
        <div style={{ width: 40, height: 3, borderRadius: 2, background: 'var(--b3)', margin: '0 auto 28px' }} />
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 6, letterSpacing: .5 }}>
          Travel<em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>Gold</em> ✦
        </div>
        <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 20 }}>שדרג את חוויית ההחלקה שלך</div>
        {features.map(f => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--b1)', borderRadius: 14, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, background: f.bg }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{f.title}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{f.sub}</div>
            </div>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, margin: '18px 0' }}>
          <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid var(--b2)', borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer' }}>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>79₪</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3, letterSpacing: '.04em' }}>לחודש</div>
          </div>
          <div style={{ background: 'var(--glow2)', border: '1px solid var(--gborder)', borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,var(--g3),var(--g1))', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '.06em' }}>הכי פופולרי</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>199₪</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>ל-3 חודשים</div>
            <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 5, fontWeight: 600 }}>חסוך 38₪</div>
          </div>
        </div>
        <button style={{ width: '100%', padding: 17, background: 'linear-gradient(145deg,var(--g3),var(--g1),var(--g2))', border: 'none', borderRadius: 16, color: '#fff', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '.08em', textTransform: 'uppercase', boxShadow: '0 6px 24px rgba(168,85,247,.30)' }}>
          הפעל Gold ✦
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: 13, background: 'transparent', border: 'none', color: 'var(--t3)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
          אולי מאוחר יותר
        </button>
      </div>
    </div>
  )
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
const UndoIcon = () => <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-4.95" /></svg>
const NopeIcon = () => <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: 'var(--pink)', fill: 'none', strokeWidth: 2.2, strokeLinecap: 'round' }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const SuperIcon = () => <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'var(--g2)', fill: 'none', strokeWidth: 2 }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
const LikeIcon = () => <svg viewBox="0 0 24 24" style={{ width: 26, height: 26, stroke: '#fff', fill: 'none', strokeWidth: 2.5, strokeLinecap: 'round' }}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
const BoostIcon = () => <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'var(--g2)', fill: 'none', strokeWidth: 2 }}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
const BellIcon = () => <svg viewBox="0 0 24 24" style={{ width: 17, height: 17, stroke: 'var(--t3)', fill: 'none', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>

// ── Main component ────────────────────────────────────────────────────────────
export default function SwipeClient({ profile }: { profile: UserProfile }) {
  const router = useRouter()

  // ── State ──
  const [users, setUsers] = useState<UserProfile[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [queueIdx, setQueueIdx] = useState(0)
  const [activeFilter, setActiveFilter] = useState('same')
  const [likesLeft, setLikesLeft] = useState(profile.likes_left ?? 8)
  const [canUndo, setCanUndo] = useState(false)
  const [undosUsed, setUndosUsed] = useState(0)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [notifUsers, setNotifUsers] = useState<Map<string, UserProfile>>(new Map())
  const [showMatch, setShowMatch] = useState(false)
  const [matchUser, setMatchUser] = useState<UserProfile | null>(null)
  const [profModal, setProfModal] = useState<UserProfile | null>(null)
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [showPremium, setShowPremium] = useState(false)
  const [showAdOverlay, setShowAdOverlay] = useState(false)
  const [loading, setLoading] = useState(true)

  const MAX_UNDOS = profile.is_gold ? 3 : 0
  const undosLeft = MAX_UNDOS - undosUsed

  // ── Refs ──
  const stackRef = useRef<HTMLDivElement>(null)
  const topCardRef = useRef<HTMLDivElement>(null)
  const likeLabelRef = useRef<HTMLDivElement>(null)
  const nopeLabelRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, dx: 0 })
  const lastSwipedRef = useRef<{ user: UserProfile; dir: string } | null>(null)
  const adCountRef = useRef(0)
  const undoPending = useRef(false)
  const likesRef = useRef(profile.likes_left ?? 8)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const supabase = useRef(createClient()).current

  // ── Build queue ──
  const buildQueue = useCallback((allUsers: UserProfile[], filter: string) => {
    const filtered = allUsers.filter(u => {
      if (u.id === profile.id) return false
      if (filter === 'same' && u.dest !== profile.dest) return false
      if (filter !== 'same' && filter !== 'all' && u.dest !== filter) return false
      const diff = Math.abs((new Date(u.land_date).getTime() - new Date(profile.land_date).getTime()) / 86400000)
      return diff <= 180
    })
    const scored: QueueItem[] = filtered.map(u => ({ ...u, _score: compatScore(profile, u) }))
    scored.sort((a, b) => (b._score ?? 0) - (a._score ?? 0))
    setQueue(scored)
    setQueueIdx(0)
    adCountRef.current = 0
  }, [profile])

  // ── Load notifications ──
  const loadNotifs = useCallback(async () => {
    const { data } = await supabase
      .from('notifications').select('*')
      .eq('user_id', profile.id).order('created_at', { ascending: false }).limit(20)
    if (data) setNotifs(data)
  }, [supabase, profile.id])

  // ── Initial load ──
  useEffect(() => {
    let cancelled = false
    async function load() {
      // Daily likes reset — if it's a new day, restore 8 free likes
      if (!profile.is_gold) {
        const todayKey = new Date().toISOString().split('T')[0]
        const resetKey = `tm_reset_${profile.id}`
        try {
          const lastReset = typeof window !== 'undefined' ? localStorage.getItem(resetKey) : null
          if (lastReset !== todayKey) {
            const { error } = await supabase.from('users').update({ likes_left: 8 }).eq('id', profile.id)
            if (!error) {
              localStorage.setItem(resetKey, todayKey)
              setLikesLeft(8)
              likesRef.current = 8
            }
          }
        } catch {}
      }
      const { data: allUsers } = await supabase.from('users')
        .select('id,auth_id,email,name,age,gender,dest,dest_flag,land_date,duration,styles,bio,photo,is_bot,is_gold,likes_left,created_at')
      if (cancelled) return
      const u = allUsers ?? []
      setUsers(u)
      buildQueue(u, 'same')
      await loadNotifs()
      setLoading(false)
    }
    load()
    setUndosUsed(loadUndosUsed())
    const interval = setInterval(loadNotifs, 30_000)
    return () => { cancelled = true; clearInterval(interval) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Build notifUsers map ──
  useEffect(() => {
    const map = new Map<string, UserProfile>()
    notifs.forEach(n => {
      const u = users.find(x => x.id === n.from_user_id)
      if (u) map.set(n.from_user_id, u)
    })
    setNotifUsers(map)
  }, [notifs, users])

  // ── Undo animation ──
  useEffect(() => {
    if (undoPending.current && topCardRef.current) {
      const card = topCardRef.current
      card.style.transition = 'none'
      card.style.transform = 'translateX(-700px) rotate(-20deg)'
      card.style.opacity = '0'
      requestAnimationFrame(() => requestAnimationFrame(() => {
        card.style.transition = 'transform .42s cubic-bezier(.34,1.56,.64,1), opacity .4s'
        card.style.transform = ST[0]
        card.style.opacity = '1'
      }))
      undoPending.current = false
    }
  }, [queueIdx])

  // ── Animate card off screen ──
  function animateCardOff(dir: 'left' | 'right' | 'super') {
    const card = topCardRef.current
    if (!card) return
    card.style.transition = 'transform .38s cubic-bezier(.25,.46,.45,.94), opacity .35s'
    if (dir === 'super') {
      card.style.transform = 'translateY(-900px) scale(1.05)'
    } else {
      card.style.transform = `translateX(${dir === 'right' ? 720 : -720}px) rotate(${dir === 'right' ? 26 : -26}deg)`
    }
    card.style.opacity = '0'
  }

  // ── Earn likes from ad ──
  async function earnLikes() {
    const newCount = Math.max(0, likesRef.current) + 5
    likesRef.current = newCount
    setLikesLeft(newCount)
    const { error } = await supabase
      .from('users')
      .update({ likes_left: newCount })
      .eq('id', profile.id)
    if (error) {
      console.warn('earnLikes: update by id failed, trying auth_id:', error.message)
      const { error: e2 } = await supabase
        .from('users')
        .update({ likes_left: newCount })
        .eq('auth_id', profile.auth_id)
      if (e2) console.error('earnLikes: both updates failed:', e2.message)
    }
  }

  // ── Swipe ──
  const swipe = useCallback(async (dir: 'left' | 'right' | 'super') => {
    const visibleItems = getVisibleItems(queue, queueIdx, adCountRef.current)
    if (!visibleItems.length) return
    const topItem = visibleItems[0]

    // Ad card
    if ('_isAd' in topItem && topItem._isAd) {
      if (dir === 'right') window.open(topItem.url, '_blank')
      animateCardOff(dir === 'super' ? 'right' : dir)
      setTimeout(() => {
        adCountRef.current = 0
        setQueueIdx(i => i)
      }, 370)
      return
    }

    const user = topItem as QueueItem
    lastSwipedRef.current = { user, dir }
    setCanUndo(true)

    if ((dir === 'right' || dir === 'super') && !profile.is_gold) {
      if (likesRef.current <= 0) { setShowAdOverlay(true); return }
      likesRef.current--
      setLikesLeft(l => l - 1)
    }

    animateCardOff(dir)

    setTimeout(async () => {
      adCountRef.current++
      setQueueIdx(i => i + 1)

      if (user.id) {
        await supabase.from('swipes').insert({ swiper_id: profile.id, swiped_id: user.id, direction: dir })
      }

      if (dir === 'right' || dir === 'super') {
        if (!user.is_bot && user.id) {
          await supabase.from('notifications').insert({ user_id: user.id, from_user_id: profile.id, type: dir === 'super' ? 'super' : 'like', read: false })
        }
        if (!profile.is_gold) {
          await supabase.from('users').update({ likes_left: likesRef.current }).eq('id', profile.id)
        }

        let shouldMatch = false
        if (dir === 'super') {
          shouldMatch = true
        } else if (user.is_bot) {
          shouldMatch = true
        } else if (user.id) {
          const { data } = await supabase.from('swipes')
            .select('id').eq('swiper_id', user.id).eq('swiped_id', profile.id).eq('direction', 'right').limit(1)
          shouldMatch = (data?.length ?? 0) > 0
        }

        if (shouldMatch) {
          await supabase.from('matches').insert({ user1_id: profile.id, user2_id: user.id })
          await supabase.from('notifications').insert({ user_id: profile.id, from_user_id: user.id, type: 'match', read: false })
          if (!user.is_bot && user.id) {
            await supabase.from('notifications').insert({ user_id: user.id, from_user_id: profile.id, type: 'match', read: false })
          }
          setTimeout(() => { setMatchUser(user); setShowMatch(true) }, 420)
        }
      }
    }, 370)
  }, [queue, queueIdx, profile.id, profile.is_gold, supabase])

  // ── Undo — gold only, 3 per day ──
  function undoSwipe() {
    if (!canUndo || !lastSwipedRef.current) return
    if (undosLeft <= 0) {
      setShowPremium(true)
      return
    }
    const newUsed = undosUsed + 1
    setUndosUsed(newUsed)
    saveUndosUsed(newUsed)
    setCanUndo(false)
    undoPending.current = true
    lastSwipedRef.current = null
    adCountRef.current = Math.max(0, adCountRef.current - 1)
    setQueueIdx(i => Math.max(0, i - 1))
  }

  // ── Pointer gesture system ──
  useEffect(() => {
    const el = stackRef.current
    if (!el) return

    function onDown(e: PointerEvent) {
      if (!topCardRef.current) return
      drag.current = { active: true, startX: e.clientX, dx: 0 }
      topCardRef.current.style.transition = 'none'
      el!.setPointerCapture(e.pointerId)
    }

    function onMove(e: PointerEvent) {
      if (!drag.current.active || !topCardRef.current) return
      const dx = e.clientX - drag.current.startX
      drag.current.dx = dx
      const tiltY = dx * 0.012
      topCardRef.current.style.transform = `perspective(1200px) translateX(${dx}px) rotate(${dx * 0.065}deg) rotateY(${tiltY}deg)`
      if (likeLabelRef.current) likeLabelRef.current.style.opacity = dx > 55 ? '1' : '0'
      if (nopeLabelRef.current) nopeLabelRef.current.style.opacity = dx < -55 ? '1' : '0'
    }

    function onUp(_e: PointerEvent) {
      if (!drag.current.active) return
      drag.current.active = false
      const { dx } = drag.current
      if (likeLabelRef.current) likeLabelRef.current.style.opacity = '0'
      if (nopeLabelRef.current) nopeLabelRef.current.style.opacity = '0'

      if (Math.abs(dx) < 5) {
        const visible = getVisibleItems(queue, queueIdx, adCountRef.current)
        const top = visible[0]
        if (top && !('_isAd' in top && top._isAd)) setProfModal(top as QueueItem)
        return
      }

      if (dx > 75) { swipe('right'); return }
      if (dx < -75) { swipe('left'); return }

      if (topCardRef.current) {
        topCardRef.current.style.transition = 'transform .42s cubic-bezier(.34,1.56,.64,1)'
        topCardRef.current.style.transform = ST[0]
      }
      drag.current.dx = 0
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
    }
  }, [queue, queueIdx, swipe])

  // ── Open notif panel ──
  async function openNotifPanel() {
    setShowNotifPanel(true)
    const unreadIds = notifs.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds)
      setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  // ── Filter bar ──
  const filterOptions = useMemo(() => [
    { key: 'same', label: `${profile.dest_flag} ${profile.dest}` },
    { key: 'all', label: '🌍 כל היעדים' },
    ...DESTINATIONS.filter(d => d.name !== profile.dest).map(d => ({ key: d.name, label: `${d.flag} ${d.name}` })),
  ], [profile.dest_flag, profile.dest])

  // adCountRef.current changes always accompany a queueIdx change, so [queue, queueIdx] is sufficient
  const visibleItems = useMemo(
    () => getVisibleItems(queue, queueIdx, adCountRef.current),
    [queue, queueIdx]
  )
  const isEmpty = !loading && visibleItems.length === 0
  const unreadCount = useMemo(() => notifs.filter(n => !n.read).length, [notifs])

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--ink)', overflow: 'hidden' }}>

      {/* ── Topbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '58px 20px 10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <svg width="22" height="27" viewBox="0 0 40 49" fill="none">
            <defs>
              <linearGradient id="tnav" x1="38" y1="2" x2="2" y2="46" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#F472B6"/>
                <stop offset="100%" stopColor="#A855F7"/>
              </linearGradient>
            </defs>
            <path d="M20 2C9.85 2 1.5 10.35 1.5 20.5C1.5 31.8 11 41.5 20 47C29 41.5 38.5 31.8 38.5 20.5C38.5 10.35 30.15 2 20 2Z" fill="url(#tnav)"/>
            <circle cx="20" cy="20" r="10.5" fill="rgba(255,255,255,.18)"/>
            <path d="M10 27.5L16.5 19L21.5 23.5L26.5 17L31.5 27.5Z" fill="rgba(255,255,255,.92)"/>
            <line x1="12.5" y1="26" x2="31" y2="11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily: 'var(--sans)', fontSize: 16, fontWeight: 800, letterSpacing: '-.02em', background: 'linear-gradient(135deg,#A855F7,#EC4899,#F472B6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', display: 'inline-block' }}>
            travel<span style={{ fontWeight: 900 }}>match</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openNotifPanel} style={{ width: 40, height: 40, background: 'rgba(255,255,255,.05)', border: '1px solid var(--b2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(8px)', position: 'relative' }}>
            <BellIcon />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -2, background: 'var(--pink)', color: '#fff', fontSize: 8, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--ink)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div style={{ display: 'flex', gap: 6, padding: '4px 20px 8px', overflowX: 'auto', flexShrink: 0 }}>
        {filterOptions.map(f => (
          <button key={f.key} onClick={() => { setActiveFilter(f.key); buildQueue(users, f.key) }}
            style={{
              padding: '7px 14px', borderRadius: 100, fontSize: 10, fontWeight: 600,
              whiteSpace: 'nowrap', cursor: 'pointer', letterSpacing: '.08em', textTransform: 'uppercase',
              border: `1px solid ${activeFilter === f.key ? 'var(--gborder)' : 'var(--b2)'}`,
              color: activeFilter === f.key ? 'var(--g3)' : 'var(--t3)',
              background: activeFilter === f.key ? 'var(--glow)' : 'transparent',
              fontFamily: 'var(--sans)', transition: 'all .2s', flexShrink: 0,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Card stack ── */}
      <div
        ref={stackRef}
        style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: '4px 16px', touchAction: 'none' }}
      >
        {loading && (
          <div style={{ position: 'absolute', inset: '4px 16px', borderRadius: 26, overflow: 'hidden', background: 'var(--ink2)' }}>
            {/* Skeleton shimmer */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,.05) 50%, transparent 100%)', backgroundSize: '200% 100%', backgroundPosition: '-200% 0', animation: 'shimmer 1.6s linear infinite' }} />
            {/* Skeleton badges */}
            <div style={{ position: 'absolute', top: 14, right: 14, width: 80, height: 26, borderRadius: 100, background: 'rgba(255,255,255,.07)' }} />
            <div style={{ position: 'absolute', top: 14, left: 14, width: 70, height: 26, borderRadius: 100, background: 'rgba(255,255,255,.05)' }} />
            {/* Skeleton content bottom */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '28px 18px 18px', background: 'linear-gradient(to top, rgba(2,3,6,.9), transparent)' }}>
              <div style={{ width: 160, height: 28, borderRadius: 8, background: 'rgba(255,255,255,.08)', marginBottom: 10 }} />
              <div style={{ width: 100, height: 14, borderRadius: 6, background: 'rgba(255,255,255,.05)', marginBottom: 8 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                {[60, 80, 70].map(w => <div key={w} style={{ width: w, height: 22, borderRadius: 100, background: 'rgba(255,255,255,.05)' }} />)}
              </div>
            </div>
          </div>
        )}

        {isEmpty && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 52, marginBottom: 8 }}>🌍</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: 'var(--t1)' }}>אין תרמילאים</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.65, maxWidth: 240 }}>כרגע אין אנשים עם תאריכים קרובים.<br />נסה יעד אחר.</div>
            <button onClick={() => buildQueue(users, activeFilter)} style={{ marginTop: 12, padding: '13px 28px', background: 'var(--glow)', border: '1px solid var(--gborder)', borderRadius: 14, color: 'var(--g3)', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: 13, cursor: 'pointer', letterSpacing: '.04em' }}>
              הצג שוב
            </button>
          </div>
        )}

        {/* Cards — back to front */}
        {!loading && !isEmpty && [...visibleItems].reverse().map((item, revIdx) => {
          const stackPos = visibleItems.length - 1 - revIdx
          const isTop = stackPos === 0
          const transform = ST[Math.min(stackPos, ST.length - 1)]
          const cardShadow = stackPos === 0
            ? '0 32px 80px rgba(0,0,0,.78), 0 8px 24px rgba(0,0,0,.55)'
            : stackPos === 1
            ? '0 16px 40px rgba(0,0,0,.55)'
            : '0 8px 24px rgba(0,0,0,.38)'

          if ('_isAd' in item && item._isAd) {
            return (
              <div key={item.id} ref={isTop ? topCardRef : undefined} style={{
                position: 'absolute', inset: '4px 16px', borderRadius: 26, overflow: 'hidden',
                cursor: 'grab', userSelect: 'none', transformOrigin: 'bottom center',
                willChange: 'transform', transform, boxShadow: cardShadow,
                background: item.color ?? 'var(--ink3)',
              }}>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 100, opacity: .06, userSelect: 'none' }}>{item.logo}</div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(2,3,6,1) 0%,rgba(2,3,6,.6) 40%,rgba(2,3,6,.1) 70%,transparent 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(2,3,6,.4) 0%,transparent 20%)' }} />
                <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(2,3,6,.55)', backdropFilter: 'blur(16px)', border: '1px solid var(--b3)', borderRadius: 100, padding: '5px 12px', fontSize: 9, fontWeight: 700, color: 'var(--t2)', zIndex: 5, letterSpacing: '.1em', textTransform: 'uppercase' }}>📢 פרסומת</div>
                {isTop && <>
                  <div ref={likeLabelRef} style={{ position: 'absolute', padding: '10px 18px', borderRadius: 12, fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 30, border: '3px solid #4DBDE8', color: '#4DBDE8', background: 'rgba(77,189,232,.1)', right: 16, transform: 'rotate(-18deg)', opacity: 0, pointerEvents: 'none', zIndex: 20, top: '34%', letterSpacing: '.04em' }}>לייק ❤️</div>
                  <div ref={nopeLabelRef} style={{ position: 'absolute', padding: '10px 18px', borderRadius: 12, fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 30, border: '3px solid #E85580', color: '#E85580', background: 'rgba(232,85,128,.1)', left: 16, transform: 'rotate(18deg)', opacity: 0, pointerEvents: 'none', zIndex: 20, top: '34%', letterSpacing: '.04em' }}>נופ ✕</div>
                </>}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 20px 16px', zIndex: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 26 }}>{item.logo}</span>
                    <span style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: .5 }}>{item.brand}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 8 }}>{item.tagline}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--glow)', border: '1px solid var(--gborder)', borderRadius: 100, padding: '5px 13px', fontSize: 11, fontWeight: 600, color: 'var(--g3)', marginBottom: 8 }}>✨ {item.headline}</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 100, padding: '4px 10px', fontSize: 9, color: 'rgba(255,255,255,.6)', letterSpacing: '.06em', textTransform: 'uppercase' }}>❤️ לייק = פרטים</div>
                    <div style={{ background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 100, padding: '4px 10px', fontSize: 9, color: 'rgba(255,255,255,.6)', letterSpacing: '.06em', textTransform: 'uppercase' }}>✕ = הבא</div>
                  </div>
                </div>
              </div>
            )
          }

          // User card
          const user = item as QueueItem
          const myDate = new Date(profile.land_date)
          const theirDate = new Date(user.land_date)
          const score = user._score ?? compatScore(profile, user)
          const diffTxt = dateDiffText(myDate, theirDate)

          return (
            <div key={user.id} ref={isTop ? topCardRef : undefined} style={{
              position: 'absolute', inset: '4px 16px', borderRadius: 26, overflow: 'hidden',
              cursor: 'grab', userSelect: 'none', transformOrigin: 'bottom center',
              willChange: 'transform', transform, background: 'var(--ink3)', boxShadow: cardShadow,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.photo} alt={user.name}
                loading={isTop ? 'eager' : 'lazy'}
                decoding="async"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${user.gender === 'f' ? 'women' : 'men'}/1.jpg` }}
              />

              {/* Gradients */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(2,3,6,.55) 0%,transparent 28%)' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(2,3,6,1) 0%,rgba(2,3,6,.72) 38%,rgba(2,3,6,.08) 65%,transparent 100%)' }} />

              {/* Dest badge top-right */}
              <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(2,3,6,.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 100, padding: '6px 14px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, zIndex: 5, color: 'var(--t1)' }}>
                {user.dest_flag} {user.dest}
              </div>

              {/* Match badge top-left */}
              <div style={{ position: 'absolute', top: 14, left: 14, backdropFilter: 'blur(12px)', borderRadius: 100, padding: '5px 11px', fontSize: 9, fontWeight: 700, zIndex: 5, letterSpacing: '.08em', textTransform: 'uppercase', background: score >= 80 ? 'rgba(72,216,154,.14)' : score >= 50 ? 'rgba(232,160,56,.14)' : 'rgba(77,189,232,.08)', border: `1px solid ${score >= 80 ? 'rgba(72,216,154,.35)' : score >= 50 ? 'rgba(232,160,56,.35)' : 'rgba(77,189,232,.2)'}`, color: score >= 80 ? 'var(--mint)' : score >= 50 ? 'var(--amber)' : 'var(--cyan)' }}>
                {score >= 80 ? '🟢 התאמה גבוהה' : score >= 50 ? '🟡 התאמה בינונית' : '🔵 נוסע חדש'}
              </div>

              {/* Likes counter */}
              <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', background: 'rgba(2,3,6,.65)', backdropFilter: 'blur(12px)', border: '1px solid var(--b2)', borderRadius: 100, padding: '5px 14px', fontSize: 11, color: 'var(--t3)', zIndex: 5, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                נשארו <b style={{ color: 'var(--g3)', fontWeight: 700 }}>{profile.is_gold ? '∞' : likesLeft}</b> לייקים
              </div>

              {/* Swipe labels — top card only */}
              {isTop && <>
                <div ref={likeLabelRef} style={{ position: 'absolute', padding: '10px 18px', borderRadius: 12, fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 30, border: '3px solid #4DBDE8', color: '#4DBDE8', background: 'rgba(77,189,232,.1)', right: 16, transform: 'rotate(-18deg)', opacity: 0, pointerEvents: 'none', zIndex: 20, top: '34%', letterSpacing: '.04em' }}>לייק ❤️</div>
                <div ref={nopeLabelRef} style={{ position: 'absolute', padding: '10px 18px', borderRadius: 12, fontFamily: 'var(--serif)', fontWeight: 700, fontSize: 30, border: '3px solid #E85580', color: '#E85580', background: 'rgba(232,85,128,.1)', left: 16, transform: 'rotate(18deg)', opacity: 0, pointerEvents: 'none', zIndex: 20, top: '34%', letterSpacing: '.04em' }}>נופ ✕</div>
              </>}

              {/* Card body */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 18px 16px', zIndex: 5 }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, lineHeight: 1.1, marginBottom: 3, color: '#fff', letterSpacing: '.01em' }}>
                  {user.name}, {user.age}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '.02em' }}>
                  <span>{user.dest_flag} {user.dest}</span>
                  {!user.is_bot && <>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,.3)', display: 'inline-block' }} />
                    <span style={{ color: 'var(--cyan)', fontSize: 10, letterSpacing: '.06em' }}>REAL</span>
                  </>}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 6, letterSpacing: '.02em' }}>
                  📅 {diffTxt}
                  {(user._realLikes ?? 0) > 0 && <> · ❤️ {user._realLikes}</>}
                </div>
                {user.bio && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', lineHeight: 1.55, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {user.bio}
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(user.styles ?? []).map(s => (
                    <span key={s} style={{ background: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 100, padding: '4px 11px', fontSize: 10, color: 'rgba(255,255,255,.75)', letterSpacing: '.03em' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Likes boost bar (free users with ≤ 5 likes left) ── */}
      {!profile.is_gold && likesLeft <= 5 && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 20px 4px', flexShrink: 0 }}>
          <button
            onClick={() => setShowAdOverlay(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '8px 20px', borderRadius: 100,
              background: 'rgba(72,216,154,.09)', border: '1px solid rgba(72,216,154,.28)',
              color: 'var(--mint)', fontSize: 12, fontWeight: 600, fontFamily: 'var(--sans)',
              cursor: 'pointer', letterSpacing: '.02em',
            }}
          >
            <span>📺</span>
            <span>צפה בפרסומת → <b style={{ fontWeight: 700 }}>+5 לייקים</b></span>
          </button>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '8px 20px 6px', flexShrink: 0 }}>

        {/* Undo — with daily count badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={undoSwipe}
            disabled={!canUndo}
            style={{
              width: 46, height: 46, background: 'rgba(255,255,255,.05)',
              border: `1px solid ${canUndo && undosLeft > 0 ? 'rgba(255,255,255,.18)' : 'var(--b2)'}`,
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canUndo && undosLeft > 0 ? 'pointer' : 'not-allowed',
              opacity: canUndo && undosLeft > 0 ? 1 : .22,
              transition: 'all .15s', color: 'var(--t2)',
            }}
          >
            <UndoIcon />
          </button>
          {profile.is_gold && (
            <span style={{
              position: 'absolute', bottom: -1, right: -3,
              width: 17, height: 17, borderRadius: '50%',
              background: undosLeft > 0 ? 'var(--mint)' : 'var(--t4)',
              border: '2px solid var(--ink)', color: '#fff',
              fontSize: 8, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {undosLeft}
            </span>
          )}
        </div>

        <button onClick={() => swipe('left')} style={{ width: 56, height: 56, background: 'rgba(232,85,128,.1)', border: '1.5px solid rgba(232,85,128,.28)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <NopeIcon />
        </button>
        <button onClick={() => swipe('super')} style={{ width: 46, height: 46, background: 'rgba(168,85,247,.12)', border: '1.5px solid var(--gborder)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <SuperIcon />
        </button>
        <button onClick={() => swipe('right')} style={{ width: 64, height: 64, background: 'linear-gradient(145deg,var(--cyan),var(--cyan2))', border: 'none', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 32px rgba(77,189,232,.3),0 0 0 1px rgba(77,189,232,.2)' }}>
          <LikeIcon />
        </button>
        <button onClick={() => setShowPremium(true)} style={{ width: 46, height: 46, background: 'rgba(168,85,247,.08)', border: '1.5px solid rgba(168,85,247,.20)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <BoostIcon />
        </button>
      </div>

      {/* ── Bottom nav ── */}
      <nav style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 0 24px', flexShrink: 0, borderTop: '1px solid var(--b1)', background: 'rgba(6,8,18,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
        {[
          { href: '/swipe', active: true, label: 'גלה', icon: <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: 'var(--g2)', fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg> },
          { href: '/matches', active: false, label: "מאצ'ים", icon: <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: 'var(--t4)', fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg> },
          { href: '/likes', active: false, label: 'לייקים', icon: <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: 'var(--t4)', fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg> },
          { href: '/profile', active: false, label: 'פרופיל', icon: <svg viewBox="0 0 24 24" style={{ width: 22, height: 22, stroke: 'var(--t4)', fill: 'none', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' } as React.CSSProperties}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg> },
        ].map(tab => (
          <Link key={tab.href} href={tab.href} style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 16px', position: 'relative' }}>
              {tab.active && <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', width: 32, height: 2, borderRadius: 2, background: 'linear-gradient(90deg,var(--g1),var(--g3))', boxShadow: '0 0 8px var(--g2)' }} />}
              {tab.icon}
              <span style={{ fontSize: 9, fontWeight: 600, color: tab.active ? 'var(--g2)' : 'var(--t4)', letterSpacing: '.06em' }}>{tab.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      {/* ── Overlays ── */}
      {showMatch && matchUser && (
        <MatchOverlay
          user={matchUser} myProfile={profile}
          onClose={() => setShowMatch(false)}
          onGoToMatches={() => { setShowMatch(false); router.push('/matches') }}
        />
      )}
      {profModal && (
        <ProfileModal
          user={profModal} myProfile={profile}
          onClose={() => setProfModal(null)}
          onSwipe={dir => swipe(dir)}
        />
      )}
      {showNotifPanel && (
        <NotifPanel notifs={notifs} userMap={notifUsers} onClose={() => setShowNotifPanel(false)} />
      )}
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
      {showAdOverlay && (
        <AdOverlay onClose={async (earned) => {
          setShowAdOverlay(false)
          if (earned) await earnLikes()
        }} />
      )}
    </div>
  )
}
