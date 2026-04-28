'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { DESTINATIONS, DURATIONS, TRAVEL_STYLES } from '@/types'

const TOTAL_STEPS = 5

interface FormData {
  name: string; age: string; email: string; password: string; gender: string
  dest: string; dest_flag: string
  land_date: string; duration: string
  styles: string[]
  bio: string
}

// ── Shared style tokens ──────────────────────────────────────────────────────
const baseInp: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid var(--b2)',
  borderRadius: 14, color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 15,
  padding: '16px 18px', outline: 'none', marginBottom: 18,
}
const lblStyle: React.CSSProperties = {
  fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em',
  textTransform: 'uppercase', marginBottom: 8, display: 'block',
}

function InputField({
  label, type = 'text', value, onChange, placeholder,
}: { label: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <>
      <label style={lblStyle}>{label}</label>
      <input
        style={{
          ...baseInp,
          borderColor: focused ? 'var(--gborder)' : 'var(--b2)',
          background: focused ? 'rgba(255,255,255,.06)' : 'rgba(255,255,255,.04)',
        }}
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </>
  )
}

// ── Step 0: basic info ───────────────────────────────────────────────────────
function Step0({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, marginBottom: 8, lineHeight: 1.15, color: 'var(--t1)' }}>
        קצת <em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>עליך</em>
      </div>
      <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 32, lineHeight: 1.7 }}>ספר לנו מי אתה</div>

      <InputField label="שם" value={data.name} onChange={v => onChange('name', v)} placeholder="השם שלך" />
      <InputField label="גיל" type="number" value={data.age} onChange={v => onChange('age', v)} placeholder="21" />
      <InputField label="אימייל" type="email" value={data.email} onChange={v => onChange('email', v)} placeholder="you@example.com" />
      <InputField label="סיסמא" type="password" value={data.password} onChange={v => onChange('password', v)} placeholder="••••••" />

      <label style={lblStyle}>מגדר</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ v: 'm', l: 'זכר' }, { v: 'f', l: 'נקבה' }, { v: 'nb', l: 'אחר' }].map(g => (
          <button key={g.v} onClick={() => onChange('gender', g.v)} style={{
            flex: 1, padding: 15, border: `1px solid ${data.gender === g.v ? 'var(--gborder)' : 'var(--b2)'}`,
            borderRadius: 14, fontFamily: 'var(--sans)', fontSize: 14, fontWeight: 500,
            color: data.gender === g.v ? 'var(--g3)' : 'var(--t3)',
            background: data.gender === g.v ? 'var(--glow)' : 'rgba(255,255,255,.04)',
            cursor: 'pointer', transition: 'all .2s', textAlign: 'center',
          }}>
            {g.l}
          </button>
        ))}
      </div>
    </>
  )
}

// ── Step 1: destination ──────────────────────────────────────────────────────
function Step1({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, marginBottom: 8, lineHeight: 1.15, color: 'var(--t1)' }}>
        לאן אתה <em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>טס?</em>
      </div>
      <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 32, lineHeight: 1.7 }}>בחר את היעד שלך</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {DESTINATIONS.map(d => (
          <div key={d.name} onClick={() => { onChange('dest', d.name); onChange('dest_flag', d.flag) }}
            style={{
              background: data.dest === d.name ? 'var(--glow)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${data.dest === d.name ? 'var(--gborder)' : 'var(--b2)'}`,
              borderRadius: 16, padding: '16px 8px', textAlign: 'center', cursor: 'pointer',
              boxShadow: data.dest === d.name ? 'inset 0 0 0 1px var(--gborder)' : 'none',
              transition: 'all .2s',
            }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>{d.flag}</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: data.dest === d.name ? 'var(--g3)' : 'var(--t3)', letterSpacing: '.04em' }}>{d.name}</span>
          </div>
        ))}
      </div>
    </>
  )
}

// ── Step 2: dates ────────────────────────────────────────────────────────────
function Step2({ data, onChange }: { data: FormData; onChange: (k: keyof FormData, v: string) => void }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, marginBottom: 8, lineHeight: 1.15, color: 'var(--t1)' }}>
        מתי <em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>יוצאים?</em>
      </div>
      <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 32, lineHeight: 1.7 }}>תאריך ומשך הטיול</div>

      <InputField label="תאריך נחיתה" type="date" value={data.land_date} onChange={v => onChange('land_date', v)} />

      <label style={lblStyle}>משך הטיול</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 20 }}>
        {DURATIONS.map(d => (
          <div key={d} onClick={() => onChange('duration', d)} style={{
            background: data.duration === d ? 'var(--glow)' : 'rgba(255,255,255,.04)',
            border: `1px solid ${data.duration === d ? 'var(--gborder)' : 'var(--b2)'}`,
            borderRadius: 12, padding: '13px 6px', textAlign: 'center', cursor: 'pointer',
            fontSize: 12, fontWeight: 500,
            color: data.duration === d ? 'var(--g3)' : 'var(--t3)',
            transition: 'all .2s', letterSpacing: '.02em',
          }}>
            {d}
          </div>
        ))}
      </div>
    </>
  )
}

// ── Step 3: travel styles ────────────────────────────────────────────────────
function Step3({ data, toggleStyle }: { data: FormData; toggleStyle: (s: string) => void }) {
  return (
    <>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, marginBottom: 8, lineHeight: 1.15, color: 'var(--t1)' }}>
        איך אתה <em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>מטייל?</em>
      </div>
      <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 32, lineHeight: 1.7 }}>בחר את סגנונות הטיול שלך (מספר אפשרי)</div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {TRAVEL_STYLES.map(style => {
          const sel = data.styles.includes(style)
          return (
            <button key={style} onClick={() => toggleStyle(style)} style={{
              padding: '10px 16px',
              background: sel ? 'rgba(77,189,232,.12)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${sel ? 'rgba(77,189,232,.4)' : 'var(--b2)'}`,
              borderRadius: 100, fontSize: 12, fontWeight: 500,
              color: sel ? 'var(--cyan)' : 'var(--t3)',
              cursor: 'pointer', transition: 'all .2s', letterSpacing: '.02em',
              fontFamily: 'var(--sans)',
            }}>
              {style}
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Step 4: photo + bio ──────────────────────────────────────────────────────
function Step4({
  data, onChange, onPhotoFile, photoPreview, selectedAvatar, onSelectAvatar,
}: {
  data: FormData; onChange: (k: keyof FormData, v: string) => void
  onPhotoFile: (f: File) => void; photoPreview: string | null
  selectedAvatar: number | null; onSelectAvatar: (i: number) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const avatars = Array.from({ length: 8 }, (_, i) =>
    `https://randomuser.me/api/portraits/${i % 2 === 0 ? 'men' : 'women'}/${i + 1}.jpg`
  )

  return (
    <>
      <div style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, marginBottom: 8, lineHeight: 1.15, color: 'var(--t1)' }}>
        הפרופיל <em style={{ color: 'var(--g3)', fontStyle: 'italic', fontWeight: 400 }}>שלך</em>
      </div>
      <div style={{ fontSize: 14, color: 'var(--t3)', marginBottom: 32, lineHeight: 1.7 }}>תמונה ובio יעזרו לך לקבל יותר מאצ׳ים</div>

      {/* Upload */}
      <div onClick={() => fileRef.current?.click()} style={{
        background: 'rgba(255,255,255,.03)', border: '1px dashed var(--b3)',
        borderRadius: 16, padding: 18, marginBottom: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        {photoPreview
          /* eslint-disable-next-line @next/next/no-img-element */
          ? <img src={photoPreview} alt="preview" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--g2)', flexShrink: 0 }} />
          : <span style={{ fontSize: 28, flexShrink: 0 }}>📷</span>
        }
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--t1)' }}>העלה תמונה</div>
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>JPG, PNG עד 5MB</div>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && onPhotoFile(e.target.files[0])} />

      {/* Avatar grid */}
      <label style={lblStyle}>או בחר אווטאר</label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 20 }}>
        {avatars.map((url, i) => (
          <div key={i} onClick={() => onSelectAvatar(i)} style={{
            aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer',
            border: `2px solid ${selectedAvatar === i ? 'var(--g2)' : 'transparent'}`,
            boxShadow: selectedAvatar === i ? '0 0 0 3px var(--glow)' : 'none',
            transition: 'all .2s', position: 'relative',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`avatar-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', background: 'var(--ink3)' }} />
            {selectedAvatar === i && (
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(168,85,247,.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>✓</div>
            )}
          </div>
        ))}
      </div>

      <label style={lblStyle}>ביו (אופציונלי)</label>
      <textarea
        value={data.bio} onChange={e => onChange('bio', e.target.value)}
        placeholder="ספר קצת על עצמך ועל הטיול שלך..."
        rows={3}
        style={{
          ...baseInp, resize: 'none', lineHeight: 1.6,
          fontFamily: 'var(--sans)', marginBottom: 18,
        }}
      />
    </>
  )
}

// ── Main register page ───────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState<number | null>(null)

  const [data, setData] = useState<FormData>({
    name: '', age: '', email: '', password: '', gender: '',
    dest: '', dest_flag: '',
    land_date: '', duration: '',
    styles: [],
    bio: '',
  })

  function set(k: keyof FormData, v: string) {
    setData(prev => ({ ...prev, [k]: v }))
  }

  function toggleStyle(s: string) {
    setData(prev => ({
      ...prev,
      styles: prev.styles.includes(s) ? prev.styles.filter(x => x !== s) : [...prev.styles, s],
    }))
  }

  function handlePhotoFile(f: File) {
    setPhotoFile(f)
    setSelectedAvatar(null)
    const reader = new FileReader()
    reader.onload = e => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  function handleSelectAvatar(i: number) {
    setSelectedAvatar(i)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  function validate(): string {
    if (step === 0) {
      if (!data.name.trim()) return 'נא להזין שם'
      if (!data.age || parseInt(data.age) < 18 || parseInt(data.age) > 60) return 'נא להזין גיל תקין'
      if (!data.email.includes('@')) return 'נא להזין אימייל תקין'
      if (data.password.length < 6) return 'סיסמא חייבת להיות לפחות 6 תווים'
      if (!data.gender) return 'נא לבחור מגדר'
    }
    if (step === 1 && !data.dest) return 'נא לבחור יעד'
    if (step === 2) {
      if (!data.land_date) return 'נא לבחור תאריך נחיתה'
      if (!data.duration) return 'נא לבחור משך טיול'
    }
    return ''
  }

  async function nextStep() {
    const err = validate()
    if (err) { setError(err); return }
    setError('')

    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1)
      return
    }

    // Final step — create account
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })
      if (authError) throw authError
      const authUser = authData.user
      if (!authUser) throw new Error('לא נוצר משתמש')

      let photoUrl = ''
      if (photoFile) {
        const ext = photoFile.name.split('.').pop()
        const path = `${authUser.id}/avatar.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(path, photoFile, { upsert: true })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('photos').getPublicUrl(path)
          photoUrl = urlData.publicUrl
        }
      } else if (selectedAvatar !== null) {
        photoUrl = `https://randomuser.me/api/portraits/${selectedAvatar % 2 === 0 ? 'men' : 'women'}/${selectedAvatar + 1}.jpg`
      }

      const { error: insertError } = await supabase.from('users').insert({
        auth_id: authUser.id,
        email: data.email,
        name: data.name.trim(),
        age: parseInt(data.age),
        gender: data.gender,
        dest: data.dest,
        dest_flag: data.dest_flag,
        land_date: data.land_date,
        duration: data.duration,
        styles: data.styles,
        bio: data.bio.trim(),
        photo: photoUrl,
      })
      if (insertError) throw insertError

      router.push('/swipe')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה בהרשמה')
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: 'var(--ink)' }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 4, padding: '58px 24px 0', flexShrink: 0 }}>
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2, borderRadius: 2,
            background: i < step ? 'var(--g2)' : i === step ? 'var(--g3)' : 'var(--b2)',
            transition: 'background .4s',
          }} />
        ))}
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 140px' }}>
        {step === 0
          ? <Link href="/" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'none', border: 'none', color: 'var(--t3)', fontFamily: 'var(--sans)',
              fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28,
              display: 'flex', alignItems: 'center', gap: 6,
              letterSpacing: '.04em', textTransform: 'uppercase',
            }}>← חזור</button>
          </Link>
          : <button onClick={() => { setStep(step - 1); setError('') }} style={{
            background: 'none', border: 'none', color: 'var(--t3)', fontFamily: 'var(--sans)',
            fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 6,
            letterSpacing: '.04em', textTransform: 'uppercase',
          }}>← חזור</button>
        }

        {step === 0 && <Step0 data={data} onChange={set} />}
        {step === 1 && <Step1 data={data} onChange={set} />}
        {step === 2 && <Step2 data={data} onChange={set} />}
        {step === 3 && <Step3 data={data} toggleStyle={toggleStyle} />}
        {step === 4 && (
          <Step4
            data={data} onChange={set}
            onPhotoFile={handlePhotoFile} photoPreview={photoPreview}
            selectedAvatar={selectedAvatar} onSelectAvatar={handleSelectAvatar}
          />
        )}

        {error && <span style={{ color: 'var(--pink)', fontSize: 12, display: 'block', letterSpacing: '.02em', marginTop: 8 }}>{error}</span>}
      </div>

      {/* CTA */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 430, padding: '16px 24px 44px',
        background: 'linear-gradient(to top,var(--ink) 65%,transparent)',
      }}>
        <button
          onClick={nextStep}
          disabled={loading}
          style={{
            width: '100%', padding: 18,
            background: 'linear-gradient(145deg,var(--g3),var(--g1),var(--g2))',
            border: 'none', borderRadius: 16, color: '#fff',
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700,
            letterSpacing: '.08em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? .4 : 1,
            boxShadow: '0 8px 32px rgba(168,85,247,.30)',
          }}
        >
          {loading ? 'יוצר חשבון...' : step === TOTAL_STEPS - 1 ? 'בואו נתחיל ✦' : 'המשך'}
        </button>
      </div>
    </div>
  )
}
