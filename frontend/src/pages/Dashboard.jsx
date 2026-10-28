// src/pages/Dashboard.jsx — reads from AppStore (no local API calls)
import { useStore } from '../store/AppStore';
import { PageShell, Card, fmt, Badge, NameCell } from '../components/UI';

function KpiCard({ label, value, sub, subColor, accent, icon }) {
  return (
    <div style={{
      background:'#FFFFFF', border:'1px solid #E5E7EB',
      borderRadius:12, padding:'20px 22px',
      boxShadow:'0 1px 3px rgba(0,0,0,0.04)',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:accent, borderRadius:'12px 12px 0 0' }} />
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ fontSize:11, fontWeight:600, color:'#6B7280', textTransform:'uppercase', letterSpacing:'0.07em' }}>{label}</div>
        {icon && (
          <div style={{ width:32, height:32, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
            background: accent + '18', fontSize:15 }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:700, color:'#111827', letterSpacing:'-0.03em', lineHeight:1, marginBottom:6 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color: subColor || '#6B7280', fontWeight:500 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const {
    dashboardSummary: s,
    unpaidList,
    monthlyRevenue,
    monthlyExpenses,
    monthlySalaries,
    netProfit,
    profitMargin,
    nonSalaryExpenses,
    paymentRevenue,
    curMonthEventRevenue,
    curMonthEventCost,
    initialized,
  } = useStore();

  if (!initialized) {
    return (
      <PageShell title="Dashboard">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'#9CA3AF', fontSize:14 }}>
          Loading dashboard…
        </div>
      </PageShell>
    );
  }

  const profitColor  = netProfit >= 0 ? '#15803D' : '#B91C1C';
  const profitAccent = netProfit >= 0 ? '#22C55E' : '#EF4444';

  return (
    <PageShell title="Dashboard"
      action={
        <span style={{ fontSize:13, color:'#6B7280', fontWeight:500, background:'#F3F4F6',
          padding:'6px 12px', borderRadius:8, border:'1px solid #E5E7EB' }}>
          📅 {new Date().toLocaleDateString('en-US', { month:'long', year:'numeric' })}
        </span>
      }>

      {/* Financial KPIs */}
      <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
        letterSpacing:'0.1em', marginBottom:12 }}>Financial Overview</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:14, marginBottom:24 }}>
        <KpiCard label="Monthly Revenue"  value={fmt(monthlyRevenue)}  sub="from payments"   accent="#2563EB" icon="💰" />
        <KpiCard label="Monthly Expenses" value={fmt(monthlyExpenses)} sub="incl. salaries"  accent="#EF4444" icon="📉" />
        <KpiCard label="Monthly Salaries" value={fmt(monthlySalaries)} sub="teacher payroll" accent="#F59E0B" icon="💼" />
        <KpiCard label="Net Profit"       value={fmt(netProfit)}
          sub={`${profitMargin?.toFixed(1)}% margin`}
          subColor={profitColor} accent={profitAccent} icon="📈" />
      </div>

      {/* School Overview */}
      <div style={{ fontSize:11, fontWeight:700, color:'#9CA3AF', textTransform:'uppercase',
        letterSpacing:'0.1em', marginBottom:12 }}>School Overview</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4, minmax(0,1fr))', gap:14, marginBottom:28 }}>
        <KpiCard label="Active Students"  value={s.activeStudents}
          sub={`${s.totalStudents} total enrolled`} accent="#8B5CF6" icon="👥" />
        <KpiCard label="Unpaid Students"  value={s.unpaidStudents}
          sub="outstanding balance"
          subColor={s.unpaidStudents > 0 ? '#B91C1C' : '#15803D'}
          accent={s.unpaidStudents > 0 ? '#EF4444' : '#22C55E'} icon="⚠️" />
        <KpiCard label="Teachers" value={s.totalTeachers} sub="active staff" accent="#F59E0B" icon="🎓" />
        <KpiCard label="Classes / Events"
          value={`${s.totalClasses} / ${s.upcomingEvents}`}
          sub="active classes · upcoming events" accent="#06B6D4" icon="📚" />
      </div>

      {/* Bottom cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18 }}>
        <Card>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:700, color:'#111827' }}>Unpaid Students</div>
            {unpaidList.length > 0 && (
              <Badge color="red">{unpaidList.length} pending</Badge>
            )}
          </div>
          {unpaidList.length === 0
            ? (
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
                background:'#F0FDF4', borderRadius:8, border:'1px solid #BBF7D0' }}>
                <span style={{ fontSize:18 }}>✅</span>
                <span style={{ fontSize:13, color:'#15803D', fontWeight:500 }}>All students are up to date</span>
              </div>
            )
            : unpaidList.slice(0,8).map((p,i) => (
              <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
                padding:'10px 0', borderBottom:'1px solid #F3F4F6' }}>
                <NameCell name={p.studentName} sub={p.monthYear} />
                <Badge color="red">{fmt(p.amount)}</Badge>
              </div>
            ))
          }
        </Card>

        <Card>
          <div style={{ fontSize:14, fontWeight:700, color:'#111827', marginBottom:16 }}>Financial Breakdown</div>
          {[
            ['Tuition Revenue',  fmt(paymentRevenue),        '#1D4ED8', '#DBEAFE'],
            ['Event Revenue',    fmt(curMonthEventRevenue),  '#0369A1', '#E0F2FE'],
            ['Salaries',         fmt(monthlySalaries),       '#B45309', '#FEF3C7'],
            ['Other Expenses',   fmt(nonSalaryExpenses),     '#B91C1C', '#FEE2E2'],
            ['Event Costs',      fmt(curMonthEventCost),     '#9A3412', '#FFEDD5'],
            ['Net Profit',       fmt(netProfit), profitColor, netProfit >= 0 ? '#DCFCE7' : '#FEE2E2'],
          ].map(([label, value, color, bg]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'9px 14px', marginBottom:5, borderRadius:8, background:bg }}>
              <span style={{ fontSize:13, color:'#4B5563', fontWeight:500 }}>{label}</span>
              <span style={{ fontWeight:700, color, fontSize:14, fontVariantNumeric:'tabular-nums' }}>{value}</span>
            </div>
          ))}
        </Card>
      </div>
    </PageShell>
  );
}
