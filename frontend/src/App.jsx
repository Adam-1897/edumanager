// src/App.jsx — redesigned
import { useState, useEffect, createContext, useContext } from 'react';
import { auth as authApi, DEMO_MODE } from './services/api';
import { resetDemoData } from './services/demoBackend';
import { AppStoreProvider, useStore } from './store/AppStore';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

import Dashboard  from './pages/Dashboard';
import Students   from './pages/Students';
import Teachers   from './pages/Teachers';
import Classes    from './pages/Classes';
import Payments   from './pages/Payments';
import Expenses   from './pages/Expenses';
import Events     from './pages/Events';
import Attendance from './pages/Attendance';
import Notes      from './pages/Notes';
import TodoList   from './pages/TodoList';

const NAV = [
  { key:'dashboard',  label:'Dashboard',  icon:'⬡', section:'Overview'  },
  { key:'students',   label:'Students',   icon:'◉', section:'People'    },
  { key:'teachers',   label:'Teachers',   icon:'◈', section:'People'    },
  { key:'classes',    label:'Classes',    icon:'▦', section:'Academic'  },
  { key:'attendance', label:'Attendance', icon:'▤', section:'Academic'  },
  { key:'payments',   label:'Payments',   icon:'◎', section:'Finance'   },
  { key:'expenses',   label:'Expenses',   icon:'◍', section:'Finance'   },
  { key:'events',     label:'Events',     icon:'◇', section:'Finance'   },
  { key:'notes',      label:'Notes',      icon:'▭', section:'Workspace' },
  { key:'todos',      label:'To-Do List', icon:'▣', section:'Workspace' },
];

const PAGE_MAP = {
  dashboard: Dashboard, students: Students, teachers: Teachers,
  classes: Classes, payments: Payments, expenses: Expenses,
  events: Events, attendance: Attendance, notes: Notes, todos: TodoList,
};

const SECTION_COLORS = {
  Overview:  '#60A5FA',
  People:    '#34D399',
  Academic:  '#A78BFA',
  Finance:   '#F59E0B',
  Workspace: '#F472B6',
};

function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await authApi.login(form);
      localStorage.setItem('token', res.token);
      onLogin({ username: res.username, role: res.role });
    } catch (err) {
      // fetch() itself throws a TypeError when the server can't be reached at all
      setError(err instanceof TypeError ? 'Cannot reach the server. Is the backend running?' : 'Invalid username or password');
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(135deg, #1E2433 0%, #2D3650 50%, #1a2035 100%)',
      position:'relative', overflow:'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%',
        background:'rgba(37,99,235,0.08)', top:-100, right:-100, pointerEvents:'none' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%',
        background:'rgba(124,58,237,0.06)', bottom:-50, left:-80, pointerEvents:'none' }} />

      <div style={{
        background:'#ffffff', borderRadius:20, boxShadow:'0 32px 80px rgba(0,0,0,0.35)',
        padding:'48px 44px', width:420, position:'relative', zIndex:1,
      }}>
        {/* Logo mark */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:32 }}>
          <div style={{
            width:44, height:44, borderRadius:12, background:'linear-gradient(135deg, #2563EB, #7C3AED)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
            boxShadow:'0 4px 12px rgba(37,99,235,0.35)',
          }}>
            <span style={{ color:'#fff', fontSize:22, fontWeight:700, lineHeight:1 }}>A</span>
          </div>
          <div>
            <div style={{ fontSize:20, fontWeight:700, color:'#111827', letterSpacing:'-0.01em' }}>AcademyOS</div>
            <div style={{ fontSize:12, color:'#6B7280', marginTop:1 }}>School Management System</div>
          </div>
        </div>

        <div style={{ marginBottom:24 }}>
          <div style={{ fontSize:22, fontWeight:600, color:'#111827', letterSpacing:'-0.02em' }}>Welcome back</div>
          <div style={{ fontSize:13, color:'#6B7280', marginTop:4 }}>Sign in to continue to your dashboard</div>
        </div>

        {error && (
          <div style={{
            background:'#FEF2F2', color:'#DC2626', border:'1px solid #FECACA',
            borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:20,
            display:'flex', alignItems:'center', gap:8,
          }}>
            <span>⚠</span> {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6, letterSpacing:'0.02em' }}>
              USERNAME
            </label>
            <input value={form.username} onChange={e => setForm(f => ({...f, username: e.target.value}))}
              style={{
                width:'100%', padding:'11px 14px', border:'1.5px solid #E5E7EB',
                borderRadius:10, fontSize:14, color:'#111827', background:'#F9FAFB',
                outline:'none', transition:'all 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor='#2563EB'; e.target.style.background='#EFF6FF'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; e.target.style.boxShadow='none'; }}
            />
          </div>
          <div style={{ marginBottom:28 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'#374151', marginBottom:6, letterSpacing:'0.02em' }}>
              PASSWORD
            </label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))}
              style={{
                width:'100%', padding:'11px 14px', border:'1.5px solid #E5E7EB',
                borderRadius:10, fontSize:14, color:'#111827', background:'#F9FAFB',
                outline:'none', transition:'all 0.15s',
              }}
              onFocus={e => { e.target.style.borderColor='#2563EB'; e.target.style.background='#EFF6FF'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)'; }}
              onBlur={e => { e.target.style.borderColor='#E5E7EB'; e.target.style.background='#F9FAFB'; e.target.style.boxShadow='none'; }}
            />
          </div>
          <button type="submit" disabled={loading} style={{
            width:'100%', padding:'12px', borderRadius:10, fontSize:14, fontWeight:600,
            cursor: loading ? 'wait' : 'pointer', border:'none', transition:'all 0.15s',
            background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            color:'#fff', boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.35)',
            letterSpacing:'0.01em',
          }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>
        <p style={{ fontSize:11, color:'#9CA3AF', textAlign:'center', marginTop:20 }}>
          Default credentials: admin / admin123
        </p>
        {DEMO_MODE && (
          <p style={{ fontSize:11, color:'#6B7280', textAlign:'center', marginTop:6 }}>
            Offline demo — no server needed; changes are saved in this browser only.{' '}
            <a href="#" onClick={e => { e.preventDefault(); if (window.confirm('Reset all demo data?')) resetDemoData(); }}
              style={{ color:'#2563EB' }}>Reset demo data</a>
          </p>
        )}
      </div>
    </div>
  );
}

function Sidebar({ current, onNavigate, user, onLogout }) {
  const sections = [...new Set(NAV.map(n => n.section))];
  const [hoveredKey, setHoveredKey] = useState(null);

  return (
    <div style={{
      width: 228, background:'#1E2433',
      display:'flex', flexDirection:'column', flexShrink:0,
      borderRight:'1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Logo */}
      <div style={{ padding:'22px 20px 18px', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:34, height:34, borderRadius:9, flexShrink:0,
            background:'linear-gradient(135deg, #2563EB, #7C3AED)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 3px 8px rgba(37,99,235,0.4)',
          }}>
            <span style={{ color:'#fff', fontSize:17, fontWeight:700 }}>A</span>
          </div>
          <div>
            <div style={{ fontSize:14, fontWeight:700, color:'#F9FAFB', letterSpacing:'-0.01em' }}>AcademyOS</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.35)', marginTop:1, letterSpacing:'0.04em' }}>SCHOOL MANAGER</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex:1, overflowY:'auto', padding:'10px 10px' }}>
        {sections.map(section => (
          <div key={section} style={{ marginBottom:6 }}>
            <div style={{
              padding:'10px 10px 5px', fontSize:10, fontWeight:600,
              color: SECTION_COLORS[section] || 'rgba(255,255,255,0.4)',
              letterSpacing:'0.1em', textTransform:'uppercase',
            }}>{section}</div>
            {NAV.filter(n => n.section === section).map(item => {
              const active = current === item.key;
              const hovered = hoveredKey === item.key && !active;
              return (
                <div key={item.key}
                  onClick={() => onNavigate(item.key)}
                  onMouseEnter={() => setHoveredKey(item.key)}
                  onMouseLeave={() => setHoveredKey(null)}
                  style={{
                    display:'flex', alignItems:'center', gap:10, padding:'9px 10px',
                    cursor:'pointer', borderRadius:8, marginBottom:1,
                    background: active ? 'rgba(37,99,235,0.25)' : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
                    transition:'all 0.12s',
                    position:'relative',
                  }}>
                  {active && (
                    <div style={{
                      position:'absolute', left:0, top:'50%', transform:'translateY(-50%)',
                      width:3, height:20, borderRadius:'0 3px 3px 0',
                      background: SECTION_COLORS[item.section] || '#2563EB',
                    }} />
                  )}
                  <span style={{
                    fontSize:14, color: active ? '#fff' : 'rgba(255,255,255,0.4)',
                    transition:'all 0.12s', width:18, textAlign:'center',
                  }}>{item.icon}</span>
                  <span style={{
                    fontSize:13, fontWeight: active ? 600 : 400,
                    color: active ? '#F9FAFB' : hovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)',
                    transition:'all 0.12s',
                  }}>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div style={{ padding:'14px 16px', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
          <div style={{
            width:32, height:32, borderRadius:'50%', flexShrink:0,
            background:'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:12, fontWeight:700, color:'#fff',
          }}>
            {user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:'#F9FAFB', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.username}</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', marginTop:1 }}>{user?.role}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          width:'100%', padding:'7px', background:'rgba(255,255,255,0.07)',
          color:'rgba(255,255,255,0.5)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:7, fontSize:12, cursor:'pointer', transition:'all 0.12s', fontWeight:500,
        }}
          onMouseEnter={e => { e.target.style.background='rgba(220,38,38,0.2)'; e.target.style.color='#FCA5A5'; }}
          onMouseLeave={e => { e.target.style.background='rgba(255,255,255,0.07)'; e.target.style.color='rgba(255,255,255,0.5)'; }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function ConnectionBanner() {
  const { errors, refresh } = useStore();
  const failed = Object.entries(errors).filter(([, msg]) => msg).map(([slice]) => slice);
  if (failed.length === 0) return null;
  return (
    <div style={{ background:'#FEF2F2', color:'#B91C1C', borderBottom:'1px solid #FECACA',
      padding:'10px 28px', fontSize:13, display:'flex', alignItems:'center', gap:12 }}>
      <span>⚠ Could not load {failed.join(', ')} from the server. Is the backend running on port 8080?</span>
      <button onClick={() => refresh.all()} style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:6,
        border:'1px solid #FCA5A5', background:'#fff', color:'#B91C1C', cursor:'pointer', fontSize:12, fontWeight:600 }}>
        Retry
      </button>
    </div>
  );
}

export default function App() {
  const [user, setUser]       = useState(null);
  const [page, setPage]       = useState('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // JWT segments are base64url, which atob() can't decode directly
        const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(b64.padEnd(b64.length + (4 - b64.length % 4) % 4, '=')));
        if (payload.exp * 1000 > Date.now()) {
          setUser({ username: payload.sub, role: payload.role });
        } else { localStorage.removeItem('token'); }
      } catch { localStorage.removeItem('token'); }
    }
    setLoading(false);
  }, []);

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh',
      background:'#F4F5F7', color:'#6B7280', fontSize:13 }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,#2563EB,#7C3AED)',
          margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:18, fontWeight:700, color:'#fff' }}>A</div>
        Loading…
      </div>
    </div>
  );

  if (!user) return <LoginPage onLogin={setUser} />;

  const PageComponent = PAGE_MAP[page] || Dashboard;

  return (
    <AuthContext.Provider value={{ user, logout }}>
      <AppStoreProvider>
        <div style={{ display:'flex', height:'100vh', fontFamily:"'DM Sans', system-ui, sans-serif",
          background:'#F4F5F7', color:'#111827' }}>
          <Sidebar current={page} onNavigate={(k) => setPage(k)} user={user} onLogout={logout} />
          <div key={page} className="page-fade" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column' }}>
            <ConnectionBanner />
            <PageComponent />
          </div>
        </div>
      </AppStoreProvider>
    </AuthContext.Provider>
  );
}
