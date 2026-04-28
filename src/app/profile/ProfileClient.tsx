'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

const EditIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

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

function PremiumModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'flex-end', background: 'rgba(2,3,6,.82)', backdropFilter: 'blur(16px)' }}>
      <div style={{ background: 'linear-gradient(160deg,var(--ink2),var(--ink3))', borderRadius: '28px 28px 0 0', padding: '30px 24px 50px', width: '100%', maxWidth: 430, margin: '0 auto', borderTop: '1px solid var(--b2)' }}>
        <div style={{ width: 40, height: 3, borderRadius: 2, background: 'var(--b3)', margin: '0 auto 28px' }} />
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
          Travel<em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>Gold</em> ✦
        </div>
        {[
          { icon: '❤️', bg: 'rgba(232,85,128,.1)', title: 'לייקים ללא הגבלה', sub: 'החלק כמה שאתה רוצה' },
          { icon: '👀', bg: 'rgba(77,189,232,.1)', title: 'ראה מי לייקד אותך', sub: 'גלה מי מחכה לך' },
          { icon: '⭐', bg: 'rgba(168,85,247,.12)', title: 'סופר לייקים יומיים', sub: '5 סופר לייקים ביום' },
          { icon: '↩️', bg: 'rgba(255,255,255,.05)', title: 'ביטול החלקה', sub: 'תן שניה לחשיבה' },
        ].map(f => (
          <div key={f.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(255,255,255,.03)', border: '1px solid var(--b1)', borderRadius: 14, marginBottom: 8 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, background: f.bg }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{f.title}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{f.sub}</div>
            </div>
          </div>
        ))}
        <button style={{ width: '100%', padding: 17, background: 'linear-gradient(145deg,var(--g3),var(--g1),var(--g2))', border: 'none', borderRadius: 16, color: '#fff', fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '.08em', textTransform: 'uppercase', boxShadow: '0 6px 24px rgba(168,85,247,.30)', marginTop: 16 }}>
          הפעל Gold ✦
        </button>
        <button onClick={onClose} style={{ width: '100%', padding: 13, background: 'transparent', border: 'none', color: 'var(--t3)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer', marginTop: 8 }}>
          אולי מאוחר יותר
        </button>
      </div>
    </div>
  )
}

export default function ProfileClient({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const [stats, setStats] = useState({ likes: 0, matches: 0, views: 0 })
  const [showPremium, setShowPremium] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    async function loadStats() {
      const [likesRes, matchesRes, viewsRes] = await Promise.all([
        supabase.from('swipes').select('id', { count: 'exact', head: true }).eq('swiped_id', profile.id).in('direction', ['right', 'super']),
        supabase.from('matches').select('id', { count: 'exact', head: true }).or(`user1_id.eq.${profile.id},user2_id.eq.${profile.id}`),
        supabase.from('swipes').select('id', { count: 'exact', head: true }).eq('swiped_id', profile.id),
      ])
      setStats({
        likes: likesRes.count ?? 0,
        matches: matchesRes.count ?? 0,
        views: viewsRes.count ?? 0,
      })
    }
    loadStats()
  }, [profile.id, supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleDelete() {
    await supabase.from('users').delete().eq('id', profile.id)
    await supabase.auth.signOut()
    router.push('/')
  }

  const landDateFormatted = profile.land_date
    ? new Date(profile.land_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-'

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--ink)', overflow: 'hidden' }}>
      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* Hero */}
        <div style={{ background: 'linear-gradient(160deg,var(--ink1),var(--ink3))', padding: '60px 22px 32px', textAlign: 'center', borderBottom: '1px solid var(--b1)', position: 'relative', overflow: 'hidden' }}>
          {/* Background orbs */}
          <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,.35),transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none', animation: 'orb-drift 8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: -20, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,.25),transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, animation: 'slide-up .5s ease both' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
              margin: '0 auto 16px',
              border: '3px solid transparent',
              background: 'linear-gradient(var(--ink2), var(--ink2)) padding-box, linear-gradient(135deg, var(--g1), var(--g3)) border-box',
              boxShadow: '0 0 0 6px rgba(168,85,247,.12), 0 16px 48px rgba(168,85,247,.3)',
              animation: 'float-slow 6s ease-in-out infinite',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.photo}
                alt={profile.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${profile.gender === 'f' ? 'women' : 'men'}/1.jpg` }}
              />
            </div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>{profile.name}</div>
            <div style={{ fontSize: 13, color: 'var(--t3)', marginBottom: 10 }}>
              {profile.dest_flag} {profile.dest} · גיל {profile.age}
            </div>
            {profile.is_gold && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--glow)', border: '1px solid var(--gborder)', borderRadius: 100, padding: '5px 14px', fontSize: 11, fontWeight: 700, color: 'var(--g3)', letterSpacing: '.06em', marginBottom: 8 }}>
                ✦ Gold Member
              </div>
            )}
            <div>
              <Link href="/profile/edit" style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(255,255,255,.06)', border: '1px solid var(--b2)',
                  borderRadius: 12, color: 'var(--t2)', fontFamily: 'var(--sans)',
                  fontSize: 12, fontWeight: 500, padding: '8px 16px', cursor: 'pointer',
                  letterSpacing: '.04em',
                }}>
                  <EditIcon /> ערוך פרופיל
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }}>סטטיסטיקות</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { value: stats.likes, label: 'לייקים', icon: '❤️' },
              { value: stats.matches, label: "מאצ'ים", icon: '✨' },
              { value: stats.views, label: 'צפיות', icon: '👁️' },
            ].map((s, i) => (
              <div key={s.label} style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,.04), rgba(255,255,255,.02))',
                border: '1px solid var(--b1)', borderRadius: 16, padding: '18px 12px', textAlign: 'center',
                boxShadow: '0 2px 12px rgba(0,0,0,.2)',
                animation: `slide-up .4s ease both`,
                animationDelay: `${i * 0.08}s`,
              }}>
                <div style={{ fontSize: 18, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700, color: 'var(--g3)', marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Trip info */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }}>פרטי הטיול</div>
          <div style={{ background: 'rgba(255,255,255,.02)', border: '1px solid var(--b1)', borderRadius: 16, overflow: 'hidden', marginBottom: 20 }}>
            {[
              { label: 'יעד', value: `${profile.dest_flag} ${profile.dest}` },
              { label: 'תאריך נחיתה', value: landDateFormatted },
              { label: 'משך הטיול', value: profile.duration || '-' },
              { label: 'סגנון', value: (profile.styles ?? []).slice(0, 2).join(', ') || '-' },
            ].map((row, i, arr) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 18px', borderBottom: i < arr.length - 1 ? '1px solid var(--b1)' : 'none' }}>
                <span style={{ fontSize: 12, color: 'var(--t3)', letterSpacing: '.04em' }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Package */}
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 12 }}>חבילה</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,.03)', border: '1px solid var(--b1)', borderRadius: 14, padding: 16 }}>
              <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 5, letterSpacing: '.08em', textTransform: 'uppercase' }}>החבילה שלך</div>
              <div style={{ fontWeight: 600, color: 'var(--g3)', fontSize: 15 }}>{profile.is_gold ? '⭐ Gold Member' : 'Free'}</div>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 4 }}>
                {profile.is_gold ? 'לייקים ללא הגבלה ♾️' : `${profile.likes_left ?? 0} לייקים נותרו היום`}
              </div>
            </div>
            {!profile.is_gold && (
              <button onClick={() => setShowPremium(true)} style={{ flex: 1, background: 'var(--glow)', border: '1px solid var(--gborder)', borderRadius: 14, padding: 16, color: 'var(--g3)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: '.04em' }}>
                שדרג ל-Gold ✦
              </button>
            )}
          </div>

          {/* Buttons */}
          <button onClick={handleLogout} style={{ width: '100%', padding: '15px 20px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--b2)', borderRadius: 14, color: 'var(--t2)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 500, cursor: 'pointer', letterSpacing: '.04em', marginBottom: 10 }}>
            יציאה מהחשבון
          </button>

          {!confirmDelete ? (
            <button onClick={() => setConfirmDelete(true)} style={{ width: '100%', padding: '15px 20px', background: 'transparent', border: '1px solid rgba(232,85,128,.15)', borderRadius: 14, color: 'rgba(232,85,128,.5)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer', letterSpacing: '.04em', marginBottom: 36 }}>
              מחיקת חשבון 🗑
            </button>
          ) : (
            <div style={{ background: 'rgba(232,85,128,.06)', border: '1px solid rgba(232,85,128,.2)', borderRadius: 14, padding: 16, marginBottom: 36 }}>
              <div style={{ fontSize: 13, color: 'var(--t2)', marginBottom: 12, textAlign: 'center', lineHeight: 1.5 }}>האם אתה בטוח? פעולה זו לא ניתנת לביטול.</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,.04)', border: '1px solid var(--b2)', borderRadius: 12, color: 'var(--t2)', fontFamily: 'var(--sans)', fontSize: 13, cursor: 'pointer' }}>
                  ביטול
                </button>
                <button onClick={handleDelete} style={{ flex: 1, padding: '12px', background: 'rgba(232,85,128,.15)', border: '1px solid rgba(232,85,128,.3)', borderRadius: 12, color: 'var(--pink)', fontFamily: 'var(--sans)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  מחק חשבון
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav active={3} />
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </div>
  )
}
