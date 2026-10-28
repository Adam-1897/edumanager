// src/pages/Notes.jsx — v2
import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { PageShell, Btn, ErrorMsg, Loading } from '../components/UI';

const NOTE_COLORS = [
  { bg:'#FFF9C4', border:'#F9E84B', shadow:'#f0d900' },
  { bg:'#C8F7C5', border:'#6DC86A', shadow:'#5cba59' },
  { bg:'#C5E1FF', border:'#6AABF7', shadow:'#5a9be8' },
  { bg:'#FFCDD2', border:'#E97070', shadow:'#d95f5f' },
  { bg:'#E8D5FF', border:'#B07BF5', shadow:'#9b6ae6' },
];

function NoteCard({ note, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const color = NOTE_COLORS[(note.colorIndex ?? 0) % NOTE_COLORS.length] || NOTE_COLORS[0];

  const save = async () => {
    if (await onUpdate(note.id, { ...note, title, content: text })) setEditing(false);
  };

  const markRead = async () => {
    await onUpdate(note.id, { ...note, isRead: !note.isRead });
  };

  return (
    <div style={{
      background: note.isRead ? '#f5f5f5' : color.bg,
      border: `1px solid ${note.isRead ? '#ddd' : color.border}`,
      borderRadius: 3,
      padding: '14px 16px 16px',
      boxShadow: note.isRead ? '2px 2px 4px rgba(0,0,0,0.05)' : `3px 3px 8px ${color.shadow}40`,
      position:'relative',
      transform: note.isRead ? 'none' : `rotate(${(note.id % 3 - 1) * 0.8}deg)`,
      transition:'all 0.2s',
      opacity: note.isRead ? 0.65 : 1,
      minHeight: 140,
      display:'flex', flexDirection:'column',
    }}>
      {/* Pin */}
      {!note.isRead && (
        <div style={{ position:'absolute', top:-8, left:'50%', transform:'translateX(-50%)',
          width:14, height:14, borderRadius:'50%', background:'#888',
          boxShadow:'0 1px 3px rgba(0,0,0,0.4)' }} />
      )}

      {/* Read badge */}
      {note.isRead && (
        <div style={{ position:'absolute', top:8, right:8, fontSize:'10px', padding:'2px 6px',
          background:'#ccc', color:'#666', borderRadius:10, fontWeight:500 }}>READ</div>
      )}

      {editing ? (
        <>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Note title..."
            style={{ fontFamily:"'Caveat', 'Patrick Hand', cursive, sans-serif", fontSize:'16px',
              fontWeight:700, background:'transparent', border:'none', outline:'none',
              borderBottom:'1px dashed #aaa', marginBottom:8, width:'100%', paddingBottom:4 }} />
          <textarea value={text} onChange={e => setText(e.target.value)} rows={4}
            style={{ fontFamily:"'Caveat', 'Patrick Hand', cursive, sans-serif", fontSize:'14px',
              background:'transparent', border:'none', outline:'none', resize:'none',
              flex:1, lineHeight:1.6, width:'100%' }} />
          <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={() => setEditing(false)}
              style={{ fontSize:'11px', padding:'3px 8px', cursor:'pointer', borderRadius:4,
                border:'1px solid #aaa', background:'rgba(255,255,255,0.6)' }}>Cancel</button>
            <button onClick={save}
              style={{ fontSize:'11px', padding:'3px 8px', cursor:'pointer', borderRadius:4,
                border:'1px solid #555', background:'rgba(0,0,0,0.08)', fontWeight:500 }}>Save</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontFamily:"'Caveat', 'Patrick Hand', cursive, sans-serif",
            fontSize:'16px', fontWeight:700, marginBottom:6, color:'#333',
            textDecoration: note.isRead ? 'line-through' : 'none' }}>
            {note.title || 'Untitled'}
          </div>
          <div style={{ fontFamily:"'Caveat', 'Patrick Hand', cursive, sans-serif",
            fontSize:'14px', color:'#444', lineHeight:1.7, flex:1, whiteSpace:'pre-wrap',
            textDecoration: note.isRead ? 'line-through' : 'none' }}>
            {note.content}
          </div>
          <div style={{ fontSize:'10px', color:'#888', marginTop:8 }}>
            {note.createdAt && new Date(note.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
          </div>
          <div style={{ display:'flex', gap:4, justifyContent:'flex-end', marginTop:8 }}>
            <button onClick={markRead}
              style={{ fontSize:'11px', padding:'3px 8px', cursor:'pointer', borderRadius:4,
                border:'1px solid #aaa', background:'rgba(255,255,255,0.5)' }}>
              {note.isRead ? '↩ Unread' : '✓ Mark Read'}
            </button>
            <button onClick={() => setEditing(true)}
              style={{ fontSize:'11px', padding:'3px 8px', cursor:'pointer', borderRadius:4,
                border:'1px solid #aaa', background:'rgba(255,255,255,0.5)' }}>✏ Edit</button>
            <button onClick={() => onDelete(note.id)}
              style={{ fontSize:'11px', padding:'3px 8px', cursor:'pointer', borderRadius:4,
                border:'1px solid #e77', background:'rgba(255,200,200,0.4)', color:'#a33' }}>✕</button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Notes() {
  const { notes: notesList, loading: storeLoading, noteActions } = useStore();
  const loading = storeLoading['notes'];
  const [error, setError]         = useState('');
  const [showRead, setShowRead]   = useState(false);
  const [colorIdx, setColorIdx]   = useState(0);
  const [adding, setAdding]       = useState(false);
  const [newTitle, setNewTitle]   = useState('');
  const [newText, setNewText]     = useState('');

  // Runs a store action and surfaces failures in the page; returns success
  const run = async (fn) => {
    try { setError(''); await fn(); return true; }
    catch (e) { setError(e.message || 'Something went wrong'); return false; }
  };

  const addNote = async () => {
    if (!newText.trim() && !newTitle.trim()) return;
    const ok = await run(() => noteActions.create({ title: newTitle, content: newText, colorIndex: colorIdx, isRead: false }));
    if (!ok) return;
    setNewTitle(''); setNewText(''); setAdding(false);
    setColorIdx(i => (i + 1) % NOTE_COLORS.length);
  };

  const updateNote = (id, data) => run(() => noteActions.update(id, data));

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    await run(() => noteActions.remove(id));
  };

  const visible = showRead ? notesList : notesList.filter(n => !n.isRead);

  return (
    <PageShell title="Notes"
      action={
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={() => setShowRead(s => !s)}
            style={{ fontSize:'12px', padding:'5px 10px', cursor:'pointer', borderRadius:4,
              border:'0.5px solid var(--color-border-secondary)', background:'transparent',
              color:'var(--color-text-secondary)' }}>
            {showRead ? 'Hide Read' : `Show Read (${notesList.filter(n => n.isRead).length})`}
          </button>
          <Btn onClick={() => setAdding(true)}>+ New Note</Btn>
        </div>
      }>
      {error && <ErrorMsg msg={error} />}

      {/* Add new note inline */}
      {adding && (
        <div style={{ marginBottom:24 }}>
          <div style={{ background: NOTE_COLORS[colorIdx].bg, border:`1px solid ${NOTE_COLORS[colorIdx].border}`,
            borderRadius:3, padding:'16px', boxShadow:`3px 3px 8px ${NOTE_COLORS[colorIdx].shadow}40`,
            maxWidth:340, transform:'rotate(-0.5deg)' }}>
            <div style={{ position:'relative', top:-24, left:'50%', transform:'translateX(-50%)',
              width:14, height:14, borderRadius:'50%', background:'#888',
              boxShadow:'0 1px 3px rgba(0,0,0,0.4)', marginBottom:-8 }} />
            <div style={{ display:'flex', gap:6, marginBottom:8, flexWrap:'wrap' }}>
              {NOTE_COLORS.map((c, i) => (
                <button key={i} onClick={() => setColorIdx(i)}
                  style={{ width:20, height:20, borderRadius:'50%', background:c.bg,
                    border: i === colorIdx ? `2px solid ${c.shadow}` : '1px solid #ccc',
                    cursor:'pointer', padding:0, outline:'none' }} />
              ))}
            </div>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
              placeholder="Title..."
              style={{ fontFamily:"'Caveat', cursive, sans-serif", fontSize:'16px',
                fontWeight:700, background:'transparent', border:'none', outline:'none',
                borderBottom:'1px dashed #aaa', width:'100%', paddingBottom:4, marginBottom:8 }} />
            <textarea value={newText} onChange={e => setNewText(e.target.value)}
              rows={4} placeholder="Write your note here..."
              style={{ fontFamily:"'Caveat', cursive, sans-serif", fontSize:'14px',
                background:'transparent', border:'none', outline:'none', resize:'none',
                width:'100%', lineHeight:1.6 }} />
            <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:8 }}>
              <button onClick={() => { setAdding(false); setNewTitle(''); setNewText(''); }}
                style={{ fontSize:'11px', padding:'3px 8px', cursor:'pointer', borderRadius:4,
                  border:'1px solid #aaa', background:'rgba(255,255,255,0.5)' }}>Cancel</button>
              <button onClick={addNote}
                style={{ fontSize:'11px', padding:'3px 8px', cursor:'pointer', borderRadius:4,
                  border:'1px solid #555', background:'rgba(0,0,0,0.08)', fontWeight:500 }}>📌 Pin</button>
            </div>
          </div>
        </div>
      )}

      {loading ? <Loading /> : visible.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--color-text-secondary)', fontSize:'14px' }}>
          {showRead ? 'No notes yet.' : 'No unread notes. Click "+ New Note" to add one.'}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:24, alignItems:'start' }}>
          {visible.map(note => (
            <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={deleteNote} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
