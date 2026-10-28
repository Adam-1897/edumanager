// src/pages/TodoList.jsx — v2
import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { PageShell, Btn, ErrorMsg, Loading, Input, Select } from '../components/UI';

const PRIORITIES = [
  { value:'HIGH',   label:'🔴 High',   color:'#A32D2D', bg:'#FCEBEB' },
  { value:'MEDIUM', label:'🟡 Medium', color:'#854F0B', bg:'#FAEEDA' },
  { value:'LOW',    label:'🟢 Low',    color:'#3B6D11', bg:'#EAF3DE' },
];
const CATS = ['General','Teaching','Admin','Finance','Events','Students'].map(v => ({ value:v, label:v }));

// 'YYYY-MM-DD' must be read as a local date; new Date('YYYY-MM-DD') is UTC midnight and can land on the previous day
const parseLocalDate = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(y, m - 1, d); };
const todayLocal = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

function TodoItem({ todo, onToggle, onDelete, onEdit }) {
  const [hovering, setHovering] = useState(false);
  const [editing, setEditing]   = useState(false);
  const [text, setText]         = useState(todo.title);
  const p = PRIORITIES.find(p => p.value === todo.priority) || PRIORITIES[1];

  const saveEdit = async () => {
    if (!text.trim()) return;
    if (await onEdit(todo.id, { ...todo, title: text.trim() })) setEditing(false);
  };

  return (
    <div onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}
      style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px',
        borderRadius:6, transition:'background 0.1s',
        background: hovering ? 'var(--color-background-secondary)' : 'transparent',
        borderBottom:'0.5px solid var(--color-border-tertiary)' }}>

      {/* Checkbox */}
      <div onClick={() => onToggle(todo.id, !todo.completed)}
        style={{ width:20, height:20, borderRadius:4, border: todo.completed ? 'none' : '2px solid #aaa',
          background: todo.completed ? '#185FA5' : 'transparent',
          cursor:'pointer', flexShrink:0, marginTop:1,
          display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}>
        {todo.completed && <span style={{ color:'#fff', fontSize:'12px', fontWeight:700 }}>✓</span>}
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {editing ? (
          <div style={{ display:'flex', gap:6 }}>
            <input value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditing(false); }}
              autoFocus
              style={{ flex:1, padding:'3px 8px', fontSize:'13px', border:'2px solid #185FA5',
                borderRadius:4, background:'#EBF4FF', outline:'none' }} />
            <button onClick={saveEdit} style={{ fontSize:'11px', padding:'3px 8px', cursor:'pointer',
              borderRadius:4, border:'none', background:'#185FA5', color:'#fff' }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ fontSize:'11px', padding:'3px 8px',
              cursor:'pointer', borderRadius:4, border:'0.5px solid #aaa', background:'transparent' }}>✕</button>
          </div>
        ) : (
          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <span style={{ fontSize:'13px', textDecoration: todo.completed ? 'line-through' : 'none',
              color: todo.completed ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
              transition:'all 0.15s' }}>{todo.title}</span>
            <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:10,
              background: p.bg, color: p.color, fontWeight:500 }}>{todo.priority}</span>
            {todo.category && (
              <span style={{ fontSize:'10px', padding:'1px 6px', borderRadius:10,
                background:'var(--color-background-secondary)', color:'var(--color-text-secondary)' }}>
                {todo.category}
              </span>
            )}
          </div>
        )}
        {todo.dueDate && !editing && (() => {
          const due = parseLocalDate(todo.dueDate);
          const overdue = due < todayLocal() && !todo.completed;
          return (
            <div style={{ fontSize:'11px', color: overdue ? '#A32D2D' : 'var(--color-text-secondary)', marginTop:2 }}>
              Due: {due.toLocaleDateString('en-US', { month:'short', day:'numeric' })}
              {overdue && ' ⚠ Overdue'}
            </div>
          );
        })()}
      </div>

      {hovering && !editing && (
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          <button onClick={() => setEditing(true)}
            style={{ fontSize:'11px', padding:'2px 7px', cursor:'pointer', borderRadius:4,
              border:'0.5px solid var(--color-border-secondary)', background:'transparent',
              color:'var(--color-text-secondary)' }}>✏</button>
          <button onClick={() => onDelete(todo.id)}
            style={{ fontSize:'11px', padding:'2px 7px', cursor:'pointer', borderRadius:4,
              border:'0.5px solid #F7C1C1', background:'transparent', color:'#A32D2D' }}>✕</button>
        </div>
      )}
    </div>
  );
}

export default function TodoList() {
  const { todos, loading: storeLoading, todoActions } = useStore();
  const loading = storeLoading['todos'];
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('active'); // 'all' | 'active' | 'done'
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newCat, setNewCat]   = useState('General');
  const [newDue, setNewDue]   = useState('');
  const [adding, setAdding]   = useState(false);



  // Runs a store action and surfaces failures in the page instead of an unhandled rejection; returns success
  const run = async (fn) => {
    try { setError(''); await fn(); return true; }
    catch (e) { setError(e.message || 'Something went wrong'); return false; }
  };

  const addTodo = async () => {
    if (!newText.trim()) return;
    const ok = await run(() => todoActions.create({ title: newText.trim(), priority: newPriority, category: newCat,
      dueDate: newDue || null, completed: false }));
    if (ok) { setNewText(''); setNewDue(''); setAdding(false); }
  };

  const toggleTodo = (id, completed) => {
    const t = todos.find(x => x.id === id);
    return run(() => todoActions.update(id, { ...t, completed }));
  };

  const editTodo = (id, data) => run(() => todoActions.update(id, data));

  const deleteTodo = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await run(() => todoActions.remove(id));
  };

  const clearDone = async () => {
    const done = todos.filter(t => t.completed);
    if (!window.confirm(`Delete ${done.length} completed task${done.length !== 1 ? 's' : ''}?`)) return;
    await run(() => Promise.all(done.map(t => todoActions.remove(t.id))));
  };

  const filtered = todos.filter(t =>
    filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed
  );

  // Sort: incomplete first, then by priority
  const priorityOrder = { HIGH:0, MEDIUM:1, LOW:2 };
  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1);  // ?? not ||: HIGH is 0
  });

  const doneCount   = todos.filter(t => t.completed).length;
  const activeCount = todos.filter(t => !t.completed).length;

  return (
    <PageShell title="To-Do List"
      action={
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {doneCount > 0 && (
            <button onClick={clearDone}
              style={{ fontSize:'12px', padding:'5px 10px', cursor:'pointer', borderRadius:4,
                border:'0.5px solid #F7C1C1', background:'transparent', color:'#A32D2D' }}>
              Clear Done ({doneCount})
            </button>
          )}
          <Btn onClick={() => setAdding(a => !a)}>+ Add Task</Btn>
        </div>
      }>
      {error && <ErrorMsg msg={error} />}

      {/* Progress bar */}
      {todos.length > 0 && (
        <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ flex:1, height:6, background:'var(--color-background-secondary)', borderRadius:3, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.round(doneCount/todos.length*100)}%`,
              background:'#639922', borderRadius:3, transition:'width 0.3s' }} />
          </div>
          <span style={{ fontSize:'12px', color:'var(--color-text-secondary)', whiteSpace:'nowrap' }}>
            {doneCount}/{todos.length} done
          </span>
        </div>
      )}

      {/* Add task form */}
      {adding && (
        <div style={{ background:'var(--color-background-primary)', border:'2px solid #185FA5',
          borderRadius:8, padding:16, marginBottom:16, boxShadow:'0 0 0 3px rgba(24,95,165,0.10)' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:8, alignItems:'flex-end', marginBottom:0 }}>
            <div>
              <label style={{ fontSize:'11px', color:'var(--color-text-secondary)', display:'block', marginBottom:4 }}>Task</label>
              <input value={newText} onChange={e => setNewText(e.target.value)}
                placeholder="What needs to be done?" autoFocus
                onKeyDown={e => e.key === 'Enter' && addTodo()}
                style={{ width:'100%', padding:'7px 10px', fontSize:'13px', border:'0.5px solid var(--color-border-secondary)',
                  borderRadius:4, background:'var(--color-background-primary)', color:'var(--color-text-primary)', outline:'none' }} />
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'var(--color-text-secondary)', display:'block', marginBottom:4 }}>Priority</label>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value)}
                style={{ padding:'7px 10px', fontSize:'13px', border:'0.5px solid var(--color-border-secondary)',
                  borderRadius:4, background:'var(--color-background-primary)', color:'var(--color-text-primary)', outline:'none' }}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'var(--color-text-secondary)', display:'block', marginBottom:4 }}>Category</label>
              <select value={newCat} onChange={e => setNewCat(e.target.value)}
                style={{ padding:'7px 10px', fontSize:'13px', border:'0.5px solid var(--color-border-secondary)',
                  borderRadius:4, background:'var(--color-background-primary)', color:'var(--color-text-primary)', outline:'none' }}>
                {CATS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'11px', color:'var(--color-text-secondary)', display:'block', marginBottom:4 }}>Due date</label>
              <input type="date" value={newDue} onChange={e => setNewDue(e.target.value)}
                style={{ padding:'7px 10px', fontSize:'13px', border:'0.5px solid var(--color-border-secondary)',
                  borderRadius:4, background:'var(--color-background-primary)', color:'var(--color-text-primary)', outline:'none' }} />
            </div>
          </div>
          <div style={{ display:'flex', gap:6, justifyContent:'flex-end', marginTop:12 }}>
            <button onClick={() => setAdding(false)}
              style={{ fontSize:'12px', padding:'5px 12px', cursor:'pointer', borderRadius:4,
                border:'0.5px solid var(--color-border-secondary)', background:'transparent' }}>Cancel</button>
            <button onClick={addTodo}
              style={{ fontSize:'12px', padding:'5px 12px', cursor:'pointer', borderRadius:4,
                border:'none', background:'#185FA5', color:'#fff', fontWeight:500 }}>Add Task</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:0, marginBottom:12, background:'var(--color-background-secondary)',
        borderRadius:6, padding:3, alignSelf:'flex-start', width:'fit-content' }}>
        {[['active', `Active (${activeCount})`], ['done', `Done (${doneCount})`], ['all', 'All']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ fontSize:'12px', padding:'5px 14px', cursor:'pointer', borderRadius:4,
              border:'none', fontWeight: filter === val ? 500 : 400,
              background: filter === val ? 'var(--color-background-primary)' : 'transparent',
              color: filter === val ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              boxShadow: filter === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Todo list */}
      <div style={{ background:'var(--color-background-primary)', border:'0.5px solid var(--color-border-tertiary)',
        borderRadius:'var(--border-radius-lg)', overflow:'hidden' }}>
        {loading ? <Loading /> : sorted.length === 0 ? (
          <div style={{ padding:'40px', textAlign:'center', color:'var(--color-text-secondary)', fontSize:'13px' }}>
            {filter === 'active' ? '🎉 All tasks done!' : filter === 'done' ? 'No completed tasks.' : 'No tasks yet. Add one!'}
          </div>
        ) : sorted.map(todo => (
          <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={editTodo} />
        ))}
      </div>
    </PageShell>
  );
}
