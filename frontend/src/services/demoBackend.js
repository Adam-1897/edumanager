// src/services/demoBackend.js — in-browser stand-in for the Spring Boot API.
// Only used by the standalone demo build (VITE_DEMO=1): data lives in localStorage,
// and responses have the same shape as the real controllers' toMap() output.

const KEY = 'edumanager-demo-db';

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return ymd(d); };
const thisMonth = () => ymd(new Date()).slice(0, 7);

// Same demo records as backend DataSeeder, but dated relative to today so the dashboard has live numbers
function seed() {
  const m = thisMonth();
  return {
    seq: 100,
    teachers: [
      { id:1, fullName:'Dr. Hana Makhoul', email:'hana@school.com', phone:null, subject:'Mathematics', monthlySalary:2500, hireDate:'2023-09-01', status:'ACTIVE', notes:null },
      { id:2, fullName:'Prof. Ziad Saad',  email:'ziad@school.com', phone:null, subject:'Physics',     monthlySalary:2200, hireDate:'2023-09-01', status:'ACTIVE', notes:null },
      { id:3, fullName:'Ms. Nour Abi',     email:'nour@school.com', phone:null, subject:'English',     monthlySalary:1800, hireDate:'2024-01-15', status:'ACTIVE', notes:null },
    ],
    classes: [
      { id:1, name:'Math A',    description:null, teacherId:1, schedule:'Mon/Wed 9AM',  room:'101', monthlyFee:150, maxStudents:30, status:'ACTIVE' },
      { id:2, name:'Physics B', description:null, teacherId:2, schedule:'Tue/Thu 11AM', room:'102', monthlyFee:180, maxStudents:30, status:'ACTIVE' },
      { id:3, name:'English C', description:null, teacherId:3, schedule:'Mon/Fri 2PM',  room:'103', monthlyFee:120, maxStudents:30, status:'ACTIVE' },
    ],
    students: [
      { id:1, fullName:'Layla Hassan', email:'layla@mail.com', phone:'+961-70-111111', parentName:'Ahmad Hassan', parentPhone:'+961-70-000001', address:null, enrollDate:'2025-09-01', status:'ACTIVE', notes:null },
      { id:2, fullName:'Omar Khalil',  email:'omar@mail.com',  phone:'+961-70-222222', parentName:'Samir Khalil', parentPhone:'+961-70-000002', address:null, enrollDate:'2025-09-01', status:'ACTIVE', notes:null },
      { id:3, fullName:'Sara Ahmed',   email:'sara@mail.com',  phone:'+961-70-333333', parentName:'Maha Ahmed',   parentPhone:'+961-70-000003', address:null, enrollDate:'2025-09-01', status:'ACTIVE', notes:null },
      { id:4, fullName:'Rami Nasser',  email:'rami@mail.com',  phone:'+961-70-444444', parentName:'Karim Nasser', parentPhone:'+961-70-000004', address:null, enrollDate:'2026-01-15', status:'ACTIVE', notes:null },
    ],
    payments: [
      { id:1, studentId:1, classId:1, amount:150, monthYear:m, paymentDate:`${m}-01`, method:'CASH',          status:'PAID',   notes:null },
      { id:2, studentId:3, classId:1, amount:150, monthYear:m, paymentDate:`${m}-02`, method:'BANK_TRANSFER', status:'PAID',   notes:null },
      { id:3, studentId:2, classId:2, amount:180, monthYear:m, paymentDate:null,      method:null,            status:'UNPAID', notes:null },
      { id:4, studentId:4, classId:3, amount:120, monthYear:m, paymentDate:null,      method:null,            status:'UNPAID', notes:null },
    ],
    expenses: [
      { id:1, description:'Monthly Rent', category:'RENT',        amount:1200, expenseDate:`${m}-01`, vendor:'Property Co.', receiptRef:null, notes:null },
      { id:2, description:'Electricity',  category:'UTILITIES',   amount:180,  expenseDate:`${m}-03`, vendor:'EDL',          receiptRef:null, notes:null },
      { id:3, description:'Cleaning',     category:'MAINTENANCE', amount:150,  expenseDate:`${m}-05`, vendor:'CleanPro',     receiptRef:null, notes:null },
      { id:4, description:'Supplies',     category:'SUPPLIES',    amount:45,   expenseDate:`${m}-04`, vendor:'Office Plus',  receiptRef:null, notes:null },
    ],
    events: [
      { id:1, name:'Science Fair',     description:null, eventDate:daysFromNow(10), location:'Main Hall',  totalCost:300, totalRevenue:500,  participantCount:45,  status:'PLANNED' },
      { id:2, name:'Parent Meeting',   description:null, eventDate:daysFromNow(20), location:'Auditorium', totalCost:50,  totalRevenue:0,    participantCount:30,  status:'PLANNED' },
      { id:3, name:'Year-End Concert', description:null, eventDate:daysFromNow(60), location:'Main Hall',  totalCost:800, totalRevenue:1200, participantCount:120, status:'PLANNED' },
    ],
    notes: [
      { id:1, title:'Welcome!', content:'This is the offline demo.\nEverything you change is saved in this browser only.', colorIndex:0, isRead:false, createdAt:new Date().toISOString() },
    ],
    todos: [
      { id:1, title:'Collect unpaid fees', priority:'HIGH',   category:'Finance', completed:false, dueDate:daysFromNow(3), createdAt:new Date().toISOString() },
      { id:2, title:'Book hall for concert', priority:'MEDIUM', category:'Events', completed:false, dueDate:null,          createdAt:new Date().toISOString() },
    ],
    attendance: {},   // { studentId: { 'YYYY-MM-DD': 'P'|'A'|'E' } }
  };
}

function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch { /* fall through to seed */ }
  return seed();
}
let db = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage unavailable: keep in memory */ } };

const num = (v, fallback = 0) => (v === '' || v == null || isNaN(Number(v)) ? fallback : Number(v));
const blankToNull = (v) => (v === '' || v === undefined ? null : v);
const nextId = () => ++db.seq;

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }

// ── Response shapes (mirror the Java toMap methods) ───────────────────────
const studentOut = (s) => {
  const owed = db.payments.filter(p => p.studentId === s.id && p.status !== 'PAID').reduce((t, p) => t + p.amount, 0);
  const recs = Object.values(db.attendance[s.id] || {});
  const countable = recs.filter(r => r !== 'E').length;
  const present = recs.filter(r => r === 'P').length;
  return { ...s, totalOwed: owed, attendancePercent: countable ? Math.round(present * 100 / countable) : null };
};
const teacherOut = (t) => ({ ...t, classCount: db.classes.filter(c => c.teacherId === t.id).length });
const classOut = (c) => ({
  ...c,
  teacherName: db.teachers.find(t => t.id === c.teacherId)?.fullName ?? null,
  enrolledCount: new Set(db.payments.filter(p => p.classId === c.id).map(p => p.studentId)).size,
});
const paymentOut = (p) => ({
  ...p,
  studentName: db.students.find(s => s.id === p.studentId)?.fullName ?? null,
  className: db.classes.find(c => c.id === p.classId)?.name ?? null,
});
const eventOut = (e) => ({ ...e, profit: (e.totalRevenue || 0) - (e.totalCost || 0) });

// ── Field normalisers for create/update ───────────────────────────────────
const fields = {
  students: (b) => ({ fullName:b.fullName, email:blankToNull(b.email), phone:b.phone, parentName:b.parentName, parentPhone:b.parentPhone,
                      address:b.address, notes:b.notes, status:b.status || undefined, enrollDate:blankToNull(b.enrollDate) ?? undefined }),
  teachers: (b) => ({ fullName:b.fullName, email:blankToNull(b.email), phone:b.phone, subject:b.subject, notes:b.notes,
                      monthlySalary: b.monthlySalary === '' ? undefined : num(b.monthlySalary, undefined),
                      hireDate: blankToNull(b.hireDate) ?? undefined, status:b.status || undefined }),
  classes:  (b) => ({ name:b.name, description:b.description, schedule:b.schedule, room:b.room, status:b.status || undefined,
                      monthlyFee: b.monthlyFee === '' ? undefined : num(b.monthlyFee, undefined),
                      maxStudents: b.maxStudents === '' ? undefined : num(b.maxStudents, undefined),
                      teacherId: 'teacherId' in b ? (b.teacherId === '' || b.teacherId == null ? null : Number(b.teacherId)) : undefined }),
  payments: (b) => ({ studentId: b.studentId != null && b.studentId !== '' ? Number(b.studentId) : undefined,
                      classId: 'classId' in b ? (b.classId === '' || b.classId == null ? null : Number(b.classId)) : undefined,
                      amount: b.amount === '' ? undefined : num(b.amount, undefined), monthYear: b.monthYear || undefined,
                      paymentDate: blankToNull(b.paymentDate) ?? undefined, method: blankToNull(b.method) ?? undefined,
                      status: b.status || undefined, notes: b.notes }),
  expenses: (b) => ({ description:b.description, category:b.category, amount: b.amount === '' ? undefined : num(b.amount, undefined),
                      expenseDate:b.expenseDate, vendor:b.vendor, receiptRef:b.receiptRef, notes:b.notes }),
  events:   (b) => ({ name:b.name, description:b.description, eventDate:b.eventDate, location:b.location, status:b.status || undefined,
                      totalCost: 'totalCost' in b ? num(b.totalCost) : undefined, totalRevenue: 'totalRevenue' in b ? num(b.totalRevenue) : undefined,
                      participantCount: b.participantCount != null ? num(b.participantCount) : undefined }),
  notes:    (b) => ({ title:b.title, content:b.content, colorIndex: b.colorIndex != null ? num(b.colorIndex) : undefined,
                      isRead: b.isRead != null ? Boolean(b.isRead) : undefined }),
  todos:    (b) => ({ title:b.title, priority:b.priority, category:b.category, completed: b.completed != null ? Boolean(b.completed) : undefined,
                      dueDate: 'dueDate' in b ? blankToNull(b.dueDate) : undefined }),
};
const defaults = {
  students: () => ({ status:'ACTIVE', enrollDate: ymd(new Date()) }),
  teachers: () => ({ status:'ACTIVE', monthlySalary:0 }),
  classes:  () => ({ status:'ACTIVE', monthlyFee:0, maxStudents:30, teacherId:null }),
  payments: () => ({ status:'UNPAID', monthYear: thisMonth(), paymentDate:null, method:null, classId:null }),
  expenses: () => ({}),
  events:   () => ({ status:'PLANNED', totalCost:0, totalRevenue:0, participantCount:0 }),
  notes:    () => ({ colorIndex:0, isRead:false, createdAt: new Date().toISOString() }),
  todos:    () => ({ priority:'MEDIUM', category:'General', completed:false, dueDate:null, createdAt: new Date().toISOString() }),
};
const required = {
  students: ['fullName'], teachers: ['fullName', 'hireDate', 'monthlySalary'], classes: ['name'],
  payments: ['studentId', 'amount'], expenses: ['description', 'category', 'amount', 'expenseDate'], events: ['name', 'eventDate'],
};
const outFor = { students: studentOut, teachers: teacherOut, classes: classOut, payments: paymentOut, events: eventOut };
const out = (coll, row) => (outFor[coll] ? outFor[coll](row) : { ...row });
const strip = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));

function list(coll) {
  const rows = db[coll].map(r => out(coll, r));
  if (coll === 'events') rows.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
  if (coll === 'notes' || coll === 'todos') rows.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return rows;
}

function create(coll, body) {
  for (const k of required[coll] || []) {
    if (body[k] == null || String(body[k]).trim() === '') throw new HttpError(400, `${k} is required`);
  }
  const row = { id: nextId(), ...defaults[coll](), ...strip(fields[coll](body)) };
  db[coll].push(row); save();
  return out(coll, row);
}

function update(coll, id, body) {
  const row = db[coll].find(r => r.id === id);
  if (!row) throw new HttpError(404, 'Not found');
  Object.assign(row, strip(fields[coll](body)));
  save();
  return out(coll, row);
}

function remove(coll, id) {
  if (!db[coll].some(r => r.id === id)) throw new HttpError(404, 'Not found');
  db[coll] = db[coll].filter(r => r.id !== id);
  // Same cascade rules as the fixed backend controllers
  if (coll === 'students') { db.payments = db.payments.filter(p => p.studentId !== id); delete db.attendance[id]; }
  if (coll === 'classes')  db.payments.forEach(p => { if (p.classId === id) p.classId = null; });
  if (coll === 'teachers') db.classes.forEach(c => { if (c.teacherId === id) c.teacherId = null; });
  save();
  return null;
}

function fakeToken(username) {
  const b64url = (o) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url({ alg:'none' })}.${b64url({ sub: username, role:'ADMIN', exp: Math.floor(Date.now() / 1000) + 86400 })}.demo`;
}

function route(method, path, body) {
  const url = new URL(path, 'http://demo');
  const parts = url.pathname.split('/').filter(Boolean);   // e.g. ['students', '3', 'payments']
  const [coll, idStr, sub] = parts;
  const id = idStr != null ? Number(idStr) : null;

  if (coll === 'auth' && idStr === 'login') {
    if (body?.username === 'admin' && body?.password === 'admin123') {
      return { token: fakeToken('admin'), username: 'admin', role: 'ADMIN' };
    }
    throw new HttpError(401, 'Invalid credentials');
  }
  if (coll === 'attendance') {
    const year = Number(url.searchParams.get('year')), month = Number(url.searchParams.get('month'));
    const prefix = `${year}-${pad(month)}`;
    if (method === 'GET') {
      const res = {};
      for (const [sid, days] of Object.entries(db.attendance)) {
        for (const [date, st] of Object.entries(days)) if (date.startsWith(prefix)) (res[sid] ||= {})[date] = st;
      }
      return res;
    }
    for (const [sid, days] of Object.entries(body || {})) {
      for (const [date, st] of Object.entries(days)) {
        const m = (db.attendance[sid] ||= {});
        if (st) m[date] = st; else delete m[date];
      }
    }
    save();
    return null;
  }
  if (coll === 'students' && sub === 'payments') return db.payments.filter(p => p.studentId === id).map(paymentOut);
  if (coll === 'dashboard') return {};
  if (!db[coll]) throw new HttpError(404, `Unknown endpoint /${coll}`);

  if (method === 'GET')    return id != null ? out(coll, db[coll].find(r => r.id === id) ?? (() => { throw new HttpError(404, 'Not found'); })()) : list(coll);
  if (method === 'POST')   return create(coll, body || {});
  if (method === 'PUT')    return update(coll, id, body || {});
  if (method === 'DELETE') return remove(coll, id);
  throw new HttpError(405, 'Method not allowed');
}

// Same contract as request() in api.js: resolves with JSON, rejects with Error(message)
export async function demoRequest(method, path, body) {
  await new Promise(r => setTimeout(r, 60));   // let React render loading states like a real round trip
  const result = route(method, path, body ? JSON.parse(JSON.stringify(body)) : null);
  return result == null ? null : JSON.parse(JSON.stringify(result));
}

export function resetDemoData() { db = seed(); save(); }
