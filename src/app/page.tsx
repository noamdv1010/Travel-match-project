'use client'
import Link from 'next/link'
import Image from 'next/image'

const STARS = [
  { t:'7%',  l:'11%', s:2.2, o:.55 }, { t:'14%', l:'79%', s:1.6, o:.4  },
  { t:'21%', l:'44%', s:1.2, o:.35 }, { t:'33%', l:'88%', s:2.0, o:.5  },
  { t:'41%', l:'5%',  s:1.4, o:.45 }, { t:'54%', l:'67%', s:1.0, o:.3  },
  { t:'66%', l:'24%', s:2.2, o:.5  }, { t:'74%', l:'91%', s:1.4, o:.4  },
  { t:'84%', l:'49%', s:1.6, o:.35 }, { t:'91%', l:'16%', s:1.2, o:.4  },
  { t:'4%',  l:'56%', s:1.0, o:.3  }, { t:'29%', l:'18%', s:1.6, o:.5  },
  { t:'47%', l:'83%', s:2.0, o:.45 }, { t:'61%', l:'37%', s:1.0, o:.3  },
  { t:'77%', l:'72%', s:1.4, o:.4  }, { t:'17%', l:'93%', s:1.0, o:.35 },
  { t:'38%', l:'58%', s:1.8, o:.4  }, { t:'52%', l:'31%', s:1.2, o:.3  },
  { t:'69%', l:'8%',  s:2.0, o:.5  }, { t:'88%', l:'63%', s:1.6, o:.4  },
]

const DEST_FLAGS = ['🇦🇷','🇵🇪','🇨🇴','🇧🇷','🇧🇴','🇨🇱','🇹🇭','🇻🇳','🇮🇳','🇳🇵','🇮🇩','🇵🇹']

function WordMark({ size = 32 }: { size?: number }) {
  return (
    <span style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: size,
      fontWeight: 800,
      letterSpacing: '-0.025em',
      lineHeight: 1,
      background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 55%, #F472B6 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      display: 'inline-block',
    }}>
      travel<span style={{ fontWeight: 900 }}>match</span>
    </span>
  )
}

export default function WelcomePage() {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      background: 'var(--ink)', overflow: 'hidden',
    }}>

      {/* ── Aurora background ── */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {/* Primary pink orb — top right */}
        <div style={{
          position: 'absolute', width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,.55) 0%, transparent 65%)',
          filter: 'blur(60px)', top: -200, right: -150,
        }} />
        {/* Violet orb — lower left */}
        <div style={{
          position: 'absolute', width: 460, height: 460, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,40,217,.5) 0%, transparent 65%)',
          filter: 'blur(75px)', bottom: '14%', left: -160,
        }} />
        {/* Fuchsia center */}
        <div style={{
          position: 'absolute', width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,38,211,.35) 0%, transparent 65%)',
          filter: 'blur(95px)', top: '22%', left: '50%', transform: 'translateX(-50%)',
        }} />
        {/* Indigo bottom right */}
        <div style={{
          position: 'absolute', width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,70,229,.32) 0%, transparent 65%)',
          filter: 'blur(85px)', bottom: '2%', right: -70,
        }} />
        {/* Cyan accent */}
        <div style={{
          position: 'absolute', width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,.2) 0%, transparent 65%)',
          filter: 'blur(60px)', bottom: '28%', right: '8%',
        }} />

        {/* Stars */}
        {STARS.map((d, i) => (
          <div key={i} style={{
            position: 'absolute', width: d.s, height: d.s, borderRadius: '50%',
            background: `rgba(255,255,255,${d.o})`,
            top: d.t, left: d.l,
            animation: `pulse-glow ${2 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.4) % 2.5}s`,
          }} />
        ))}

        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.022) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
        }} />
      </div>

      {/* ── Hero content ── */}
      <div style={{
        position: 'relative', zIndex: 2, flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 28px 16px', textAlign: 'center',
      }}>

        {/* Logo with glowing halo */}
        <div style={{ marginBottom: 22, position: 'relative', display: 'inline-block' }}>
          {/* Halo ring */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 130, height: 130, borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(236,72,153,.6) 0%,rgba(168,85,247,.4) 55%,transparent 80%)',
            filter: 'blur(18px)',
          }} />
          <div style={{ animation: 'float 4s ease-in-out infinite', display: 'inline-block', position: 'relative', zIndex: 1 }}>
            {/* Container clips white bg to rounded shape — no blend mode needed */}
            <div style={{
              width: 96, height: 96, borderRadius: 22, overflow: 'hidden',
              boxShadow: '0 0 0 1.5px rgba(236,72,153,0.45), 0 8px 32px rgba(164,40,180,0.45)',
            }}>
              <Image
                src="/logo.png"
                alt="TravelMatch"
                width={96}
                height={96}
                priority
                style={{ display: 'block', width: '100%', height: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Brand name */}
        <div style={{ marginBottom: 12 }}>
          <WordMark size={50} />
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 15, color: 'var(--t2)', lineHeight: 1.75, fontWeight: 400,
          maxWidth: 270, marginBottom: 36, letterSpacing: '.01em',
        }}>
          מצא שותף לנחיתה רכה —<br />
          <span style={{ color: 'var(--t1)', fontWeight: 500 }}>לפני שאתה בכלל נוחת</span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 36, width: '100%', maxWidth: 320 }}>
          {[
            { n: '50K+', l: 'תרמילאים' },
            { n: '47',   l: 'מדינות'   },
            { n: '3.2K', l: "מאצ'ים"   },
          ].map((s, i) => (
            <div key={s.l} style={{ flex: 1, padding: '0 8px', position: 'relative' }}>
              {i > 0 && (
                <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', width: 1, height: 28, background: 'var(--b3)' }} />
              )}
              <div style={{
                fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, letterSpacing: .5,
                background: 'linear-gradient(135deg, #A855F7, #EC4899)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                display: 'inline-block', marginBottom: 3,
              }}>{s.n}</div>
              <div style={{ fontSize: 9, color: 'var(--t3)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Destination flags marquee */}
        <div style={{
          width: '100%', overflow: 'hidden',
          maskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)',
          WebkitMaskImage: 'linear-gradient(90deg, transparent, black 15%, black 85%, transparent)',
          marginBottom: 8,
        }}>
          <div style={{
            display: 'flex', gap: 20, animation: 'marquee 14s linear infinite',
            width: 'max-content', paddingInline: 12,
          }}>
            {[...DEST_FLAGS, ...DEST_FLAGS].map((flag, i) => (
              <span key={i} style={{ fontSize: 24, filter: 'drop-shadow(0 0 8px rgba(236,72,153,.4))' }}>
                {flag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '8px 24px 52px',
        display: 'flex', flexDirection: 'column', gap: 12,
        background: 'linear-gradient(to top, var(--ink) 65%, transparent)',
      }}>
        <Link href="/register" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', padding: 19, border: 'none', borderRadius: 20,
            background: 'linear-gradient(135deg, #7C3AED 0%, #C026D3 50%, #F472B6 100%)',
            color: '#fff',
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700,
            letterSpacing: '.07em', textTransform: 'uppercase', cursor: 'pointer',
            animation: 'glow-pulse 3s ease-in-out infinite',
          }}>
            צור פרופיל ✦
          </button>
        </Link>
        <Link href="/login" style={{ textDecoration: 'none' }}>
          <button style={{
            width: '100%', padding: 18,
            border: '1.5px solid rgba(168,85,247,.3)',
            borderRadius: 20,
            background: 'rgba(168,85,247,.07)',
            color: 'var(--t1)',
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 600,
            letterSpacing: '.04em', cursor: 'pointer',
            backdropFilter: 'blur(12px)',
          }}>
            כבר יש לי חשבון
          </button>
        </Link>
      </div>
    </div>
  )
}
