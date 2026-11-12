import { KeyboardEvent, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { SimulatedPerson } from './program'

export default function ForwardMessage({ message, recipient, onCancel, onForward }: {
  message: { author: string; time: string; body: string }
  recipient: SimulatedPerson
  onCancel: () => void
  onForward: (note: string) => void
}) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(false)
  const [note, setNote] = useState('')
  const dialogRef = useRef<HTMLFormElement>(null)
  const matches = `${recipient.name} ${recipient.username}`.toLowerCase().includes(query.trim().replace(/^@/, '').toLowerCase())

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.querySelector('input')?.focus()
    return () => previous?.focus()
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onCancel()
    }
    if (event.key !== 'Tab') return
    const controls = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea')
    if (!controls?.length) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return <div className="modal-backdrop forward-backdrop" onMouseDown={onCancel}>
    <form ref={dialogRef} className="forward-modal" role="dialog" aria-modal="true" aria-label="Forward message" onMouseDown={(event) => event.stopPropagation()} onKeyDown={handleKeyDown} onSubmit={(event) => { event.preventDefault(); if (selected) onForward(note.trim()) }}>
      <header><h2>Forward this message</h2><button type="button" aria-label="Close forward message" onClick={onCancel}><X /></button></header>
      <div className="forward-to">
        {selected ? <button type="button" className="forward-selected" aria-label={`Remove ${recipient.name}`} onClick={() => { setSelected(false); setQuery(''); requestAnimationFrame(() => dialogRef.current?.querySelector('input')?.focus()) }}><strong>{recipient.name}</strong><span className="bot-label">APP</span><X size={16} /></button>
          : <input aria-label="Forward to" placeholder="Search for channel or person" value={query} onChange={(event) => setQuery(event.target.value)} />}
      </div>
      {!selected && query.trim() && matches && <button type="button" className="forward-recipient" onClick={() => { setSelected(true); dialogRef.current?.querySelector('textarea')?.focus() }}><strong>{recipient.name}</strong>{' '}<span className="bot-label">APP</span></button>}
      <textarea aria-label="Add a note" placeholder="Add a message, if you’d like." value={note} onChange={(event) => setNote(event.target.value)} />
      <blockquote className="forwarded-message"><strong>{message.author}</strong><time>{message.time}</time><p>{message.body}</p></blockquote>
      <footer><button type="button" className="forward-cancel" onClick={onCancel}>Cancel</button><button className="block-button primary" disabled={!selected}>Forward</button></footer>
    </form>
  </div>
}
