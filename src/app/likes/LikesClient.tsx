'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types'

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
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
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
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700 }}>79₪</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 3 }}>לחודש</div>
          </div>
          <div style={{ background: 'var(--glow2)', border: '1px solid var(--gborder)', borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,var(--g3),var(--g1))', color: '#fff', fontSize: 9, fontWeight: 700, padding: '3px 12px', borderRadius: 100, whiteSpace: 'nowrap', letterSpacing: '.06em' }}>הכי פופולרי</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 26, fontWeight: 700 }}>199₪</div>
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

export default function LikesClient({ profile }: { profile: UserProfile }) {
  const [likers, setLikers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showPremium, setShowPremium] = useState(false)
  const supabase = useRef(createClient()).current

  useEffect(() => {
    async function load() {
      const { data: swipeRows } = await supabase.from('swipes').select('swiper_id')
        .eq('swiped_id', profile.id).in('direction', ['right', 'super'])
      const swiperIds = swipeRows?.map((s: { swiper_id: string }) => s.swiper_id) ?? []

      if (swiperIds.length > 0) {
        const { data: users } = await supabase.from('users').select('*').in('id', swiperIds)
        setLikers(users ?? [])
      }
      setLoading(false)
    }
    load()
  }, [profile.id, supabase])

  const displayPool = likers.slice(0, 12)

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--ink)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '58px 22px 14px', flexShrink: 0, borderBottom: '1px solid var(--b1)' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 28, fontWeight: 700, marginBottom: 2 }}>מי עשה לך לייק</div>
        <div style={{ fontSize: 12, color: 'var(--t3)' }}>
          {loading ? 'טוען...' : profile.is_gold ? `${displayPool.length} אנשים לייקדו אותך` : `${displayPool.length} אנשים — שדרג ל-Gold לחשיפה`}
        </div>
      </div>

      {/* Gold locked banner */}
      {!profile.is_gold && (
        <div style={{ margin: '14px 20px 0', background: 'var(--glow2)', border: '1px solid var(--gborder)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <span style={{ fontSize: 26, flexShrink: 0 }}>🔒</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--g3)', marginBottom: 2 }}>ראה מי עשה לך לייק</div>
            <div style={{ fontSize: 11, color: 'var(--t3)' }}>שדרג ל-Gold כדי לגלות</div>
          </div>
          <button onClick={() => setShowPremium(true)} style={{ background: 'linear-gradient(135deg,var(--g3),var(--g1))', border: 'none', borderRadius: 10, padding: '8px 14px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
            שדרג ✦
          </button>
        </div>
      )}

      {/* Grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{ width: 32, height: 32, border: '2px solid var(--b2)', borderTopColor: 'var(--g2)', borderRadius: '50%', animation: 'spin .9s linear infinite' }} />
          </div>
        ) : displayPool.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>👀</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 20, fontWeight: 700 }}>עוד אין לייקים</div>
            <div style={{ fontSize: 13, color: 'var(--t3)' }}>כשמישהו ילייק אותך — תראה אותם כאן</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {displayPool.map(u => (
              <div key={u.id} onClick={() => !profile.is_gold && setShowPremium(true)}
                style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', aspectRatio: '3/4', cursor: profile.is_gold ? 'default' : 'pointer', background: 'var(--ink3)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={u.photo} alt={u.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: profile.is_gold ? 'none' : 'blur(14px)', transform: 'scale(1.1)' }}
                  onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${u.gender === 'f' ? 'women' : 'men'}/1.jpg` }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top,rgba(2,3,6,.9),transparent)', padding: '24px 8px 8px', filter: profile.is_gold ? 'none' : 'blur(4px)' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#fff', letterSpacing: '.02em' }}>{u.name?.split(' ')[0]}, {u.age}</div>
                </div>
                {!profile.is_gold && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'rgba(2,3,6,.35)' }}>
                    <span style={{ fontSize: 22 }}>🔒</span>
                    <button onClick={e => { e.stopPropagation(); setShowPremium(true) }} style={{ background: 'linear-gradient(135deg,var(--g3),var(--g1))', border: 'none', borderRadius: 20, padding: '5px 10px', color: '#fff', fontSize: 9, fontWeight: 700, cursor: 'pointer', letterSpacing: '.04em' }}>
                      Gold לחשיפה
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active={2} />
      {showPremium && <PremiumModal onClose={() => setShowPremium(false)} />}
    </div>
  )
}
