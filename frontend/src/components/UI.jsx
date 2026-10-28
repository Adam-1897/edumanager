// src/components/UI.jsx — redesigned
import { useState, useRef, useEffect } from 'react';

// ─── PageShell ──────────────────────────────────────────────
export function PageShell({ title, action, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, minHeight:0 }}>
      <div style={{
        padding:'18px 28px', background:'#FFFFFF',
        borderBottom:'1px solid #E5E7EB',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexShrink:0, position:'sticky', top:0, zIndex:10,
        boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
      }}>
        <h1 style={{ fontSize:18, fontWeight:700, color:'#111827', letterSpacing:'-0.02em' }}>{title}</h1>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>{action}</div>
      </div>
      <div style={{ padding:'24px 28px', flex:1 }}>{children}</div>
    </div>
  );
}

// ─── MetricCard ─────────────────────────────────────────────
export function MetricCard({ label, value, sub, subColor }) {
  return (
    <div style={{
      background:'#F9FAFB', borderRadius:10, padding:'16px',
      border:'1px solid #E5E7EB',
    }}>
      <div style={{ fontSize:11, color:'#6B7280', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.07em', fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:700, color:'#111827', letterSpacing:'-0.02em' }}>{value}</div>
      {sub && <div style={{ fontSize:12, color: subColor || '#6B7280', marginTop:4 }}>{sub}</div>}
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────
export function Card({ children, style = {} }) {
  return (
    <div style={{
      background:'#FFFFFF', border:'1px solid #E5E7EB',
      borderRadius:12, padding:'20px',
      boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── DataTable ──────────────────────────────────────────────
export function DataTable({ columns, rows, empty = 'No records found.' }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr style={{ background:'#F9FAFB' }}>
            {columns.map(col => (
              <th key={col.key} style={{
                textAlign:'left', padding:'10px 14px', fontSize:11, fontWeight:600,
                color:'#6B7280', borderBottom:'1px solid #E5E7EB',
                textTransform:'uppercase', letterSpacing:'0.07em', whiteSpace:'nowrap',
              }}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={columns.length} style={{
                padding:'48px 14px', textAlign:'center',
                color:'#9CA3AF', fontSize:13,
              }}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:28, opacity:0.4 }}>◻</span>
                  {empty}
                </div>
              </td></tr>
            : rows.map((row, i) => (
              <tr key={i} style={{ transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#F9FAFB'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {columns.map(col => (
                  <td key={col.key} style={{
                    padding:'11px 14px', borderBottom:'1px solid #F3F4F6',
                    verticalAlign:'middle', color:'#111827',
                  }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ─── Badge ──────────────────────────────────────────────────
export function Badge({ children, color = 'gray' }) {
  const colors = {
    green:  { bg:'#DCFCE7', text:'#15803D', border:'#BBF7D0' },
    red:    { bg:'#FEE2E2', text:'#B91C1C', border:'#FECACA' },
    blue:   { bg:'#DBEAFE', text:'#1D4ED8', border:'#BFDBFE' },
    amber:  { bg:'#FEF3C7', text:'#B45309', border:'#FDE68A' },
    gray:   { bg:'#F3F4F6', text:'#374151', border:'#E5E7EB' },
    violet: { bg:'#EDE9FE', text:'#6D28D9', border:'#DDD6FE' },
  };
  const c = colors[color] || colors.gray;
  return (
    <span style={{
      display:'inline-block', padding:'2px 9px', borderRadius:100,
      fontSize:11, fontWeight:600, background:c.bg, color:c.text,
      border:`1px solid ${c.border}`, letterSpacing:'0.02em',
    }}>{children}</span>
  );
}

// ─── Avatar ─────────────────────────────────────────────────
export function Avatar({ name, color = 'blue' }) {
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '??';
  const palettes = {
    blue:   'linear-gradient(135deg, #3B82F6, #2563EB)',
    green:  'linear-gradient(135deg, #10B981, #059669)',
    amber:  'linear-gradient(135deg, #F59E0B, #D97706)',
    violet: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  };
  return (
    <div style={{
      width:32, height:32, borderRadius:'50%',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontSize:11, fontWeight:700, color:'#fff', flexShrink:0,
      background: palettes[color] || palettes.blue,
      boxShadow:'0 2px 4px rgba(0,0,0,0.12)',
    }}>
      {initials}
    </div>
  );
}

// ─── NameCell ───────────────────────────────────────────────
export function NameCell({ name, sub, avatarColor }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <Avatar name={name} color={avatarColor} />
      <div>
        <div style={{ fontWeight:600, color:'#111827', fontSize:13 }}>{name}</div>
        {sub && <div style={{ fontSize:11, color:'#9CA3AF', marginTop:1 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Btn ────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: {
      base:  { background:'#2563EB', color:'#fff', border:'none', boxShadow:'0 1px 3px rgba(37,99,235,0.3)' },
      hover: { background:'#1D4ED8', boxShadow:'0 3px 8px rgba(37,99,235,0.4)' },
    },
    secondary: {
      base:  { background:'#fff', color:'#374151', border:'1px solid #D1D5DB' },
      hover: { background:'#F9FAFB', border:'1px solid #9CA3AF' },
    },
    danger: {
      base:  { background:'#FEE2E2', color:'#B91C1C', border:'1px solid #FECACA' },
      hover: { background:'#FECACA' },
    },
  };
  const s = styles[variant] || styles.primary;
  const pad = size === 'sm' ? '5px 11px' : '8px 16px';
  const fs = size === 'sm' ? 12 : 13;
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily:'inherit',
        fontSize: fs, borderRadius:8, padding:pad, fontWeight:600,
        transition:'all 0.15s', opacity: disabled ? 0.5 : 1,
        letterSpacing:'0.01em',
        ...(hov && !disabled ? { ...s.base, ...s.hover } : s.base),
      }}>
      {children}
    </button>
  );
}

// ─── Modal ──────────────────────────────────────────────────
export function Modal({ title, onClose, onSave, children, saving, canSave }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position:'fixed', inset:0, zIndex:1000,
        background:'rgba(17,24,39,0.6)',
        backdropFilter:'blur(6px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:24,
      }}>
      <div style={{
        background:'#fff', borderRadius:16,
        boxShadow:'0 32px 80px rgba(0,0,0,0.2)',
        padding:0, width:560, maxWidth:'95vw', maxHeight:'90vh',
        overflowY:'auto', position:'relative',
        border:'1px solid #E5E7EB',
      }}>
        {/* Header */}
        <div style={{
          padding:'20px 24px', borderBottom:'1px solid #F3F4F6',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          position:'sticky', top:0, background:'#fff', zIndex:1, borderRadius:'16px 16px 0 0',
        }}>
          <div style={{ fontSize:16, fontWeight:700, color:'#111827', letterSpacing:'-0.01em' }}>{title}</div>
          <button onClick={onClose} style={{
            background:'#F3F4F6', border:'none', borderRadius:8,
            width:30, height:30, cursor:'pointer', fontSize:18, color:'#6B7280',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.12s', fontWeight:400,
          }}
            onMouseEnter={e => { e.currentTarget.style.background='#E5E7EB'; }}
            onMouseLeave={e => { e.currentTarget.style.background='#F3F4F6'; }}
          >×</button>
        </div>

        {/* Body */}
        <div style={{ padding:'20px 24px' }}>{children}</div>

        {/* Footer */}
        <div style={{
          padding:'16px 24px', borderTop:'1px solid #F3F4F6',
          display:'flex', gap:8, justifyContent:'flex-end',
          position:'sticky', bottom:0, background:'#fff', borderRadius:'0 0 16px 16px',
        }}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn onClick={onSave} disabled={saving || canSave === false}>
            {saving ? 'Saving…' : 'Save changes'}
          </Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Field ──────────────────────────────────────────────────
export function Field({ label, children, full, required }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : undefined, marginBottom:14 }}>
      <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:5, letterSpacing:'0.02em' }}>
        {label.toUpperCase()}
        {required && <span style={{ color:'#DC2626', marginLeft:3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Input styles ───────────────────────────────────────────
const INPUT_BASE = {
  width:'100%', padding:'9px 12px', fontFamily:'inherit', fontSize:13,
  border:'1.5px solid #E5E7EB', borderRadius:8,
  background:'#F9FAFB', color:'#111827', outline:'none',
  transition:'all 0.15s',
};
const INPUT_FOCUS = {
  ...INPUT_BASE, border:'1.5px solid #2563EB',
  background:'#EFF6FF', boxShadow:'0 0 0 3px rgba(37,99,235,0.1)',
};
const INPUT_ERROR = {
  ...INPUT_BASE, border:'1.5px solid #DC2626', background:'#FEF2F2',
};

export function Input({ value, onChange, type = 'text', placeholder, required, error }) {
  const [focused, setFocused] = useState(false);
  const showError = required && !value && !focused;
  return (
    <>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={focused ? INPUT_FOCUS : showError ? INPUT_ERROR : INPUT_BASE} />
      {showError && <div style={{ fontSize:11, color:'#DC2626', marginTop:3 }}>Required</div>}
    </>
  );
}

export function Select({ value, onChange, options, required, error }) {
  const [focused, setFocused] = useState(false);
  const showError = required && !value && !focused;
  return (
    <>
      <select value={value ?? ''} onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={focused ? INPUT_FOCUS : showError ? INPUT_ERROR : INPUT_BASE}>
        <option value="">Select…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {showError && <div style={{ fontSize:11, color:'#DC2626', marginTop:3 }}>Required</div>}
    </>
  );
}

export function Textarea({ value, onChange, rows = 3 }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={rows}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ ...(focused ? INPUT_FOCUS : INPUT_BASE), resize:'vertical' }} />
  );
}

export function FormGrid({ children }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>{children}</div>;
}

// ─── SearchBox ──────────────────────────────────────────────
export function SearchBox({ value, onChange, placeholder = 'Search…' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position:'relative' }}>
      <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:14, color:'#9CA3AF', pointerEvents:'none' }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding:'7px 12px 7px 32px', width:210, fontFamily:'inherit', fontSize:13,
          border: focused ? '1.5px solid #2563EB' : '1.5px solid #E5E7EB',
          borderRadius:8, background: focused ? '#EFF6FF' : '#fff',
          color:'#111827', outline:'none', transition:'all 0.15s',
          boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
        }} />
    </div>
  );
}

// ─── Loading / Error ────────────────────────────────────────
export function Loading() {
  return (
    <div style={{ padding:60, textAlign:'center', color:'#9CA3AF', fontSize:13 }}>
      <div style={{ fontSize:24, marginBottom:8, opacity:0.4 }}>⟳</div>
      Loading…
    </div>
  );
}

export function ErrorMsg({ msg }) {
  return (
    <div style={{
      padding:'12px 16px', background:'#FEF2F2', color:'#B91C1C',
      border:'1px solid #FECACA', borderRadius:10, fontSize:13,
      marginBottom:16, display:'flex', alignItems:'center', gap:8,
    }}>
      <span>⚠</span> {msg}
    </div>
  );
}

export function useConfirm() {
  return (msg) => window.confirm(msg || 'Delete this record?');
}

// ─── ProgressBar ────────────────────────────────────────────
export function ProgressBar({ value, max = 100 }) {
  if (value == null) {
    return <span style={{ fontSize:12, color:'#9CA3AF' }}>—</span>;
  }
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct > 85 ? '#16A34A' : pct > 70 ? '#D97706' : '#DC2626';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ height:6, background:'#E5E7EB', borderRadius:6, flex:1, overflow:'hidden', width:70 }}>
        <div style={{ height:'100%', width:`${pct}%`, borderRadius:6, background:color, transition:'width 0.3s' }} />
      </div>
      <span style={{ fontSize:12, color:'#6B7280', minWidth:32 }}>{pct}%</span>
    </div>
  );
}

export const fmt = (n) => {
  const v = Number(n || 0);
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 });
};

// ─── AttendanceCell ─────────────────────────────────────────
export function AttendanceCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const options = ['P','A','E'];
  const colors = { P:'#15803D', A:'#B91C1C', E:'#1D4ED8' };
  const bgs    = { P:'#DCFCE7', A:'#FEE2E2', E:'#DBEAFE' };

  if (editing) return (
    <div style={{ display:'flex', gap:3 }}>
      {options.map(opt => (
        <button key={opt} onClick={() => { onChange(opt); setEditing(false); }}
          style={{ padding:'3px 8px', fontSize:11, fontWeight:700, cursor:'pointer',
            borderRadius:6, border:'1.5px solid', outline:'none',
            borderColor:colors[opt], background:bgs[opt], color:colors[opt], transition:'all 0.1s' }}>
          {opt}
        </button>
      ))}
      <button onClick={() => setEditing(false)}
        style={{ padding:'3px 6px', fontSize:11, cursor:'pointer', borderRadius:6,
          border:'1px solid #E5E7EB', background:'transparent', color:'#6B7280', outline:'none' }}>✕</button>
    </div>
  );

  return (
    <div onClick={() => setEditing(true)}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ display:'inline-flex', alignItems:'center', gap:4, cursor:'pointer',
        padding:'3px 9px', borderRadius:6, userSelect:'none',
        background: hovered ? '#EFF6FF' : (value ? bgs[value] : '#F3F4F6'),
        border: hovered ? '1.5px dashed #2563EB' : '1.5px solid transparent',
        transition:'all 0.12s', minWidth:32 }}>
      <span style={{ fontSize:12, fontWeight:700, color: value ? colors[value] : '#9CA3AF' }}>
        {value || '—'}
      </span>
      {hovered && <span style={{ fontSize:9, color:'#2563EB' }}>✏</span>}
    </div>
  );
}

// ─── DateCell ───────────────────────────────────────────────
export function DateCell({ value, onChange }) {
  const [editing, setEditing] = useState(false);
  const ref = useRef();
  useEffect(() => { if (editing && ref.current) ref.current.focus(); }, [editing]);

  if (editing) return (
    <input ref={ref} type="date" defaultValue={value}
      onBlur={e => { onChange(e.target.value); setEditing(false); }}
      onKeyDown={e => {
        if (e.key === 'Enter') { onChange(e.target.value); setEditing(false); }
        if (e.key === 'Escape') setEditing(false);
      }}
      style={{ padding:'4px 8px', fontSize:12, border:'1.5px solid #2563EB',
        borderRadius:6, background:'#EFF6FF', outline:'none' }} />
  );

  return (
    <span onClick={() => setEditing(true)}
      onMouseEnter={e => { e.currentTarget.style.borderColor='#2563EB'; e.currentTarget.style.background='#EFF6FF'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.background='transparent'; }}
      style={{ fontSize:12, cursor:'pointer', padding:'3px 7px', borderRadius:6,
        border:'1.5px dashed transparent', transition:'all 0.12s', display:'inline-block' }}>
      {value || <span style={{ color:'#9CA3AF' }}>Set date ✏</span>}
    </span>
  );
}
