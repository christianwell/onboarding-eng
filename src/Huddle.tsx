import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { Headphones, Mic, MicOff, ShieldCheck, Video, VideoOff, Volume2, X } from 'lucide-react'

export default function Huddle({ conversation, onCancel, onJoin }: { conversation: string; onCancel: () => void; onJoin: () => void }) {
  const [muted, setMuted] = useState(true)
  const [camera, setCamera] = useState(false)
  const dialogRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => previous?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
    if (event.key !== 'Tab') return
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input')
    if (!controls?.length) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return <div className="modal-backdrop huddle-backdrop">
    <section className="huddle-window huddle-preview" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Huddle · ${conversation}`} onKeyDown={handleKeyDown}>
      <header className="huddle-preview-heading">Join huddle in <strong>{conversation}</strong></header>
        <div className="huddle-preview-card">
          <div className={`huddle-preview-self ${camera ? 'huddle-camera-on' : ''}`}>
            <span className="huddle-person-avatar">{camera ? <Video size={48} /> : 'Y'}</span>
            <div className="huddle-preview-toggles">
              <button aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={!muted} onClick={() => setMuted(value => !value)}>{muted ? <MicOff /> : <Mic />}</button>
              <button aria-label={camera ? 'Turn off camera' : 'Turn on camera'} aria-pressed={camera} onClick={() => setCamera(value => !value)}>{camera ? <Video /> : <VideoOff />}</button>
            </div>
          </div>
          <div className="huddle-devices">{[{ label: 'Microphone', icon: <Mic size={16} /> }, { label: 'Speaker', icon: <Volume2 size={16} /> }, { label: 'Camera', icon: <Video size={16} /> }].map(device => <label key={device.label}>{device.icon}<select aria-label={device.label} disabled><option>Default</option></select></label>)}</div>
        </div>
        <div className="huddle-preview-actions">
          <button onClick={onCancel}><span><X /></span>Cancel</button>
          <button className="huddle-join" onClick={onJoin}><span><Headphones /></span>Join Huddle</button>
        </div>
      <footer className="huddle-simulation"><ShieldCheck size={13} />Practice mode · messages stay on this device</footer>
    </section>
  </div>
}
