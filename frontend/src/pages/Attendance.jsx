// src/pages/Attendance.jsx
import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/AppStore';
import { attendance as attendanceApi } from '../services/api';
import { PageShell, Card, Badge, NameCell, Btn, Loading, ErrorMsg, AttendanceCell, DateCell } from '../components/UI';

function getDaysInMonth(year, month) {
  const days = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
  return days;
}

function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export default function Attendance() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based for JS Date

  // Read students from the global store (already enriched & filtered)
  const { students: allStudents, refresh } = useStore();
  const activeStudents = allStudents.filter(s => s.status === 'ACTIVE');

  // Attendance records are local — fetched fresh per month, not cached in global store
  // Shape: { studentId: { 'YYYY-MM-DD': 'P'|'A'|'E' } }
  const [records,    setRecords]    = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [savedMsg,   setSavedMsg]   = useState('');
  const [dateColumn, setDateColumn] = useState(todayYMD());

  const days = getDaysInMonth(year, month);
  const monthName = new Date(year, month, 1).toLocaleString('default', { month:'long', year:'numeric' });

  // Show the 5 most recent weekdays of the selected month, up to today (past months: up to month end).
  // The old filter only looked at the last 5 calendar days before today, so any other month rendered no columns.
  const today = new Date(); today.setHours(0,0,0,0);
  const displayDays = days
    .filter(d => d <= today && d.getDay() !== 0 && d.getDay() !== 6)
    .slice(-5);

  // Fetch attendance directly from API — no stale closure issue
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await attendanceApi.getMonth(year, month + 1); // API is 1-based
      setRecords(data || {});
    } catch (e) {
      setError('Failed to load attendance: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const handleChange = (studentId, date, val) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [date]: val }
    }));
  };

  const saveAll = async () => {
    setSaving(true); setError('');
    try {
      await attendanceApi.saveMonth(year, month + 1, records);
      // Refresh students in the global store so attendancePercent
      // on the Students page and Dashboard updates immediately
      await refresh.students();
      setSavedMsg('Saved!');
      setTimeout(() => setSavedMsg(''), 2000);
    } catch (e) {
      setError('Failed to save: ' + (e.message || ''));
    } finally { setSaving(false); }
  };

  const takenDates = new Set(
    Object.values(records).flatMap(dayMap => Object.keys(dayMap))
  );

  const getAttendancePercent = (studentId) => {
    const rec = records[String(studentId)] || records[studentId] || {};
    const recorded = [...takenDates].filter(date => rec[date] !== undefined && rec[date] !== 'E');
    if (recorded.length === 0) return null;
    const present = recorded.filter(date => rec[date] === 'P').length;
    return Math.round((present / recorded.length) * 100);
  };

  // Helper to get record value — backend may key by number or string
  const getRecord = (studentId, dateKey) => {
    const rec = records[String(studentId)] || records[studentId] || {};
    return rec[dateKey] || '';
  };

  const fmtDay   = (d) => `${String(d.getDate()).padStart(2,'0')}`;
  const dayKey   = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;
  const isToday   = (d) => dayKey(d) === todayYMD();

  const prevMonth = () => { if (month === 0) { setYear(y => y-1); setMonth(11); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y+1); setMonth(0); }  else setMonth(m => m+1); };

  return (
    <PageShell title="Attendance"
      action={
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <Btn variant="secondary" size="sm" onClick={prevMonth}>‹ Prev</Btn>
          <span style={{ fontSize:'13px', fontWeight:500 }}>{monthName}</span>
          <Btn variant="secondary" size="sm" onClick={nextMonth}>Next ›</Btn>
          {savedMsg && <span style={{ fontSize:'12px', color:'#3B6D11', fontWeight:500 }}>{savedMsg}</span>}
          <Btn onClick={saveAll} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</Btn>
        </div>
      }>
      {error && <ErrorMsg msg={error} />}
      <div style={{ marginBottom:12, fontSize:'12px', color:'var(--color-text-secondary)', display:'flex', gap:16 }}>
        <span><strong style={{color:'#3B6D11'}}>P</strong> = Present</span>
        <span><strong style={{color:'#A32D2D'}}>A</strong> = Absent</span>
        <span><strong style={{color:'#185FA5'}}>E</strong> = Excused</span>
        <span style={{ marginLeft:8, color:'var(--color-text-tertiary)' }}>Click any cell to set a status. Use Custom Date to mark any other day.</span>
      </div>

      <Card style={{ padding:0, overflow:'hidden' }}>
        {loading ? <Loading /> : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'13px' }}>
              <thead>
                <tr style={{ background:'var(--color-background-secondary)' }}>
                  <th style={{ textAlign:'left', padding:'10px 14px', fontSize:'11px', fontWeight:500,
                    color:'var(--color-text-secondary)', borderBottom:'0.5px solid var(--color-border-tertiary)',
                    minWidth:200 }}>STUDENT</th>
                  {displayDays.map(d => (
                    <th key={dayKey(d)} style={{ padding:'8px 10px', fontSize:'11px', fontWeight:500,
                      color: isToday(d) ? '#185FA5' : 'var(--color-text-secondary)',
                      borderBottom:'0.5px solid var(--color-border-tertiary)',
                      background: isToday(d) ? '#E6F1FB' : isWeekend(d) ? 'var(--color-background-tertiary)' : undefined,
                      textAlign:'center', minWidth:52 }}>
                      <div>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}</div>
                      <div style={{ fontSize:'13px', fontWeight:600 }}>{fmtDay(d)}</div>
                      {isToday(d) && <div style={{ fontSize:'9px', color:'#185FA5' }}>TODAY</div>}
                    </th>
                  ))}
                  <th style={{ padding:'8px 10px', fontSize:'11px', fontWeight:500,
                    color:'#854F0B', borderBottom:'0.5px solid var(--color-border-tertiary)',
                    background:'#FAEEDA33', textAlign:'center', minWidth:80 }}>
                    <div style={{ fontSize:'10px' }}>CUSTOM DATE</div>
                    <DateCell value={dateColumn} onChange={setDateColumn} />
                  </th>
                  <th style={{ padding:'8px 14px', fontSize:'11px', fontWeight:500,
                    color:'var(--color-text-secondary)', borderBottom:'0.5px solid var(--color-border-tertiary)',
                    textAlign:'center', minWidth:90 }}>
                    ATT% <span style={{ fontWeight:400, color:'var(--color-text-tertiary)' }}>({takenDates.size}d)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeStudents.length === 0 ? (
                  <tr><td colSpan={displayDays.length + 3} style={{ padding:'32px', textAlign:'center',
                    color:'var(--color-text-secondary)' }}>No active students found</td></tr>
                ) : activeStudents.map((student) => {
                  const pct = getAttendancePercent(student.id);
                  return (
                    <tr key={student.id}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding:'10px 14px', borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        <NameCell name={student.fullName} sub={student.email} />
                      </td>
                      {displayDays.map(d => {
                        const key = dayKey(d);
                        return (
                          <td key={key} style={{ padding:'6px 8px', textAlign:'center',
                            borderBottom:'0.5px solid var(--color-border-tertiary)',
                            background: isToday(d) ? '#E6F1FB22' : isWeekend(d) ? 'var(--color-background-tertiary)' : undefined }}>
                            {isWeekend(d) ? (
                              <span style={{ color:'var(--color-text-tertiary)', fontSize:'11px' }}>—</span>
                            ) : (
                              <AttendanceCell
                                value={getRecord(student.id, key)}
                                onChange={val => handleChange(String(student.id), key, val)}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td style={{ padding:'6px 8px', textAlign:'center',
                        borderBottom:'0.5px solid var(--color-border-tertiary)', background:'#FAEEDA22' }}>
                        <AttendanceCell
                          value={getRecord(student.id, dateColumn)}
                          onChange={val => handleChange(String(student.id), dateColumn, val)}
                        />
                      </td>
                      <td style={{ padding:'10px 14px', textAlign:'center',
                        borderBottom:'0.5px solid var(--color-border-tertiary)' }}>
                        {pct === null ? (
                          <span style={{ fontSize:'12px', color:'var(--color-text-tertiary)' }}>—</span>
                        ) : (
                          <div style={{ display:'inline-flex', flexDirection:'column', alignItems:'center', gap:3 }}>
                            <span style={{ fontSize:'14px', fontWeight:600,
                              color: pct >= 85 ? '#3B6D11' : pct >= 70 ? '#854F0B' : '#A32D2D' }}>{pct}%</span>
                            <div style={{ height:4, width:60, background:'var(--color-background-secondary)', borderRadius:2, overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${pct}%`, borderRadius:2,
                                background: pct >= 85 ? '#639922' : pct >= 70 ? '#EF9F27' : '#E24B4A', transition:'width 0.3s' }} />
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
