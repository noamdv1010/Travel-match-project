'use client'
import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { UserProfile, DESTINATIONS, DURATIONS, TRAVEL_STYLES } from '@/types'

const AVATARS = Array.from({ length: 12 }, (_, i) =>
  `https://randomuser.me/api/portraits/${i < 6 ? 'women' : 'men'}/${i + 1}.jpg`
)

const s = {
  screen: { position: 'absolute' as const, inset: 0, display: 'flex', flexDirection: 'column' as const, background: 'var(--ink)', overflowY: 'auto' as const },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '56px 20px 16px', borderBottom: '1px solid var(--b1)',
    background: 'linear-gradient(160deg, var(--ink1), var(--ink2))',
    position: 'sticky' as const, top: 0, zIndex: 10, backdropFilter: 'blur(20px)',
  },
  back: {
    background: 'none', border: 'none', color: 'var(--t3)', fontFamily: 'var(--sans)',
    fontSize: 13, cursor: 'pointer', padding: '8px 12px', borderRadius: 10,
    display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '.04em',
    transition: 'color .2s',
  },
  saveBtn: {
    background: 'linear-gradient(135deg, var(--g1), var(--g2))',
    border: 'none', borderRadius: 12, color: '#fff', fontFamily: 'var(--sans)',
    fontSize: 13, fontWeight: 700, letterSpacing: '.06em', padding: '10px 20px',
    cursor: 'pointer', boxShadow: '0 4px 16px rgba(168,85,247,.30)',
    transition: 'opacity .2s',
  },
  body: { flex: 1, padding: '24px 20px 80px' },
  section: { marginBottom: 28 },
  sectionLabel: {
    fontSize: 10, fontWeight: 700, color: 'var(--t3)', letterSpacing: '.14em',
    textTransform: 'uppercase' as const, marginBottom: 14, display: 'block',
  },
  card: {
    background: 'rgba(255,255,255,.03)', border: '1px solid var(--b1)',
    borderRadius: 16, overflow: 'hidden' as const,
  },
  row: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderBottom: '1px solid var(--b1)',
  },
  rowLabel: { fontSize: 12, color: 'var(--t3)', letterSpacing: '.04em' },
  inp: {
    background: 'none', border: 'none', color: 'var(--t1)', fontFamily: 'var(--sans)',
    fontSize: 14, fontWeight: 500, textAlign: 'right' as const,
    outline: 'none', width: '60%', padding: 0,
  },
  inpFull: {
    width: '100%', background: 'rgba(255,255,255,.04)', border: '1px solid var(--b2)',
    borderRadius: 14, color: 'var(--t1)', fontFamily: 'var(--sans)', fontSize: 14,
    padding: '14px 16px', outline: 'none', resize: 'none' as const,
    transition: 'border-color .2s, background .2s',
  },
  select: {
    background: 'none', border: 'none', color: 'var(--t1)', fontFamily: 'var(--sans)',
    fontSize: 14, fontWeight: 500, outline: 'none', cursor: 'pointer',
    textAlign: 'right' as const, direction: 'rtl' as const,
  },
  destGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
  },
  destCard: (active: boolean) => ({
    padding: '12px 10px', borderRadius: 14, border: `1px solid ${active ? 'var(--gborder)' : 'var(--b1)'}`,
    background: active ? 'var(--glow)' : 'rgba(255,255,255,.02)',
    textAlign: 'center' as const, cursor: 'pointer', transition: 'all .2s',
  }),
  styleChip: (active: boolean) => ({
    padding: '8px 14px', borderRadius: 100,
    border: `1px solid ${active ? 'var(--gborder)' : 'var(--b2)'}`,
    background: active ? 'var(--glow)' : 'rgba(255,255,255,.02)',
    color: active ? 'var(--g3)' : 'var(--t2)',
    fontFamily: 'var(--sans)', fontSize: 12, fontWeight: active ? 600 : 400,
    cursor: 'pointer', transition: 'all .18s', whiteSpace: 'nowrap' as const,
  }),
  photoRing: (active: boolean) => ({
    width: 64, height: 64, borderRadius: '50%', overflow: 'hidden' as const,
    border: `2px solid ${active ? 'var(--g2)' : 'transparent'}`,
    cursor: 'pointer', flexShrink: 0,
    boxShadow: active ? '0 0 0 2px var(--glow)' : 'none',
    transition: 'border-color .2s, box-shadow .2s',
  }),
  err: { fontSize: 12, color: 'var(--pink)', marginTop: 8, display: 'block' },
  success: { fontSize: 12, color: 'var(--mint)', marginTop: 8, display: 'block' },
}

export default function EditProfileClient({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const supabase = useRef(createClient()).current
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile.name ?? '')
  const [age, setAge] = useState(String(profile.age ?? ''))
  const [bio, setBio] = useState(profile.bio ?? '')
  const [dest, setDest] = useState(profile.dest ?? '')
  const [destFlag, setDestFlag] = useState(profile.dest_flag ?? '')
  const [landDate, setLandDate] = useState(profile.land_date?.split('T')[0] ?? '')
  const [duration, setDuration] = useState(profile.duration ?? '')
  const [styles, setStyles] = useState<string[]>(profile.styles ?? [])
  const [photo, setPhoto] = useState(profile.photo ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const toggleStyle = useCallback((s: string) => {
    setStyles(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }, [])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `profiles/${profile.id}-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('photos').upload(path, file, { upsert: true })
      if (upErr) throw new Error(upErr.message)
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      setPhoto(publicUrl)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאת העלאה')
    }
    setUploading(false)
  }

  async function handleSave() {
    setError('')
    setSaved(false)
    if (!name.trim()) { setError('שם הוא שדה חובה'); return }
    const ageNum = parseInt(age)
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 60) { setError('גיל לא תקין (18–60)'); return }
    if (!dest) { setError('יש לבחור יעד'); return }
    setSaving(true)
    try {
      const { error: upErr } = await supabase.from('users').update({
        name: name.trim(),
        age: ageNum,
        bio: bio.trim(),
        dest,
        dest_flag: destFlag,
        land_date: landDate || null,
        duration: duration || null,
        styles,
        photo: photo || null,
      }).eq('id', profile.id)
      if (upErr) throw new Error(upErr.message)
      setSaved(true)
      setTimeout(() => router.push('/profile'), 800)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאת שמירה')
    }
    setSaving(false)
  }

  return (
    <div style={s.screen}>
      {/* Sticky header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => router.push('/profile')}>← חזור</button>
        <span style={{ fontFamily: 'var(--serif)', fontSize: 18, fontWeight: 700, color: 'var(--t1)' }}>
          עריכת פרופיל
        </span>
        <button style={{ ...s.saveBtn, opacity: saving ? .6 : 1 }} onClick={handleSave} disabled={saving}>
          {saving ? 'שומר...' : 'שמור ✓'}
        </button>
      </div>

      <div style={s.body}>
        {/* Photo */}
        <div style={s.section}>
          <span style={s.sectionLabel}>תמונת פרופיל</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
              border: '3px solid var(--g2)', background: 'var(--ink3)', position: 'relative',
              boxShadow: '0 0 32px rgba(168,85,247,.3)',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { (e.target as HTMLImageElement).src = `https://randomuser.me/api/portraits/${profile.gender === 'f' ? 'women' : 'men'}/1.jpg` }}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{ ...s.saveBtn, fontSize: 12, padding: '9px 16px', opacity: uploading ? .6 : 1 }}
                disabled={uploading}
              >
                {uploading ? 'מעלה...' : '📷 העלה תמונה'}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />

            {/* Avatar grid */}
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 10, textAlign: 'center', letterSpacing: '.06em' }}>
                — או בחר אווטאר —
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'center' }}>
                {AVATARS.map(url => (
                  <div key={url} style={s.photoRing(photo === url)} onClick={() => setPhoto(url)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div style={s.section}>
          <span style={s.sectionLabel}>פרטים אישיים</span>
          <div style={s.card}>
            <div style={s.row}>
              <span style={s.rowLabel}>שם</span>
              <input style={s.inp} value={name} onChange={e => setName(e.target.value)} placeholder="השם שלך" />
            </div>
            <div style={s.row}>
              <span style={s.rowLabel}>גיל</span>
              <input style={s.inp} type="number" min={18} max={60} value={age} onChange={e => setAge(e.target.value)} placeholder="25" />
            </div>
            <div style={{ ...s.row, borderBottom: 'none' }}>
              <span style={s.rowLabel}>מגדר</span>
              <span style={{ fontSize: 13, color: 'var(--t3)' }}>
                {profile.gender === 'm' ? 'זכר' : profile.gender === 'f' ? 'נקבה' : 'אחר'}
              </span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={s.section}>
          <span style={s.sectionLabel}>ביוגרפיה</span>
          <textarea
            style={s.inpFull}
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="ספר לנו קצת על עצמך ועל הטיול המתוכנן..."
            rows={4}
            maxLength={300}
            onFocus={e => { e.target.style.borderColor = 'var(--gborder)'; e.target.style.background = 'rgba(255,255,255,.06)' }}
            onBlur={e => { e.target.style.borderColor = 'var(--b2)'; e.target.style.background = 'rgba(255,255,255,.04)' }}
          />
          <span style={{ fontSize: 10, color: 'var(--t4)', display: 'block', textAlign: 'left', marginTop: 4 }}>
            {bio.length}/300
          </span>
        </div>

        {/* Destination */}
        <div style={s.section}>
          <span style={s.sectionLabel}>יעד</span>
          <div style={s.destGrid}>
            {DESTINATIONS.map(d => (
              <div
                key={d.name}
                style={s.destCard(dest === d.name)}
                onClick={() => { setDest(d.name); setDestFlag(d.flag) }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{d.flag}</div>
                <div style={{ fontSize: 11, color: dest === d.name ? 'var(--g3)' : 'var(--t2)', fontWeight: dest === d.name ? 600 : 400 }}>
                  {d.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trip details */}
        <div style={s.section}>
          <span style={s.sectionLabel}>פרטי הטיול</span>
          <div style={s.card}>
            <div style={s.row}>
              <span style={s.rowLabel}>תאריך נחיתה</span>
              <input
                style={{ ...s.inp, fontSize: 13 }}
                type="date"
                value={landDate}
                onChange={e => setLandDate(e.target.value)}
              />
            </div>
            <div style={{ ...s.row, borderBottom: 'none' }}>
              <span style={s.rowLabel}>משך הטיול</span>
              <select
                style={s.select}
                value={duration}
                onChange={e => setDuration(e.target.value)}
              >
                <option value="">בחר...</option>
                {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Travel styles */}
        <div style={s.section}>
          <span style={s.sectionLabel}>סגנון טיול</span>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
            {TRAVEL_STYLES.map(st => (
              <button
                key={st}
                style={s.styleChip(styles.includes(st))}
                onClick={() => toggleStyle(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Status messages */}
        {error && <span style={s.err}>{error}</span>}
        {saved && <span style={s.success}>✓ הפרופיל עודכן בהצלחה!</span>}

        {/* Save button at bottom */}
        <button
          style={{
            width: '100%', padding: 18,
            background: 'linear-gradient(135deg, var(--g1), var(--g2))',
            border: 'none', borderRadius: 16, color: '#fff',
            fontFamily: 'var(--sans)', fontSize: 15, fontWeight: 700,
            letterSpacing: '.08em', textTransform: 'uppercase' as const,
            cursor: 'pointer', boxShadow: '0 8px 32px rgba(168,85,247,.30)',
            opacity: saving ? .6 : 1, marginTop: 8,
          }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'שומר...' : 'שמור שינויים ✦'}
        </button>
      </div>
    </div>
  )
}
