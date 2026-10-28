/**
 * AppStore.jsx — Centralized reactive state for EduManager
 *
 * Architecture:
 *  - ONE global context holds ALL raw data slices (students, teachers, payments, expenses, …)
 *  - ALL derived/computed values (KPIs, totals, balances, net profit …) are calculated here
 *    via useMemo so they automatically stay in sync whenever any slice changes.
 *  - Every page reads from this store via `useStore()`.
 *  - Every mutation calls a store action that POSTs/PUTs/DELETEs via the API, then
 *    invalidates (re-fetches) the relevant slices — so the whole tree re-renders with
 *    fresh computed values instantly.
 *  - No page owns its own copy of data.  No duplicated local state.  No hardcoded numbers.
 */

import {
  createContext, useContext, useState, useEffect, useCallback, useMemo, useRef,
} from 'react';
import {
  students   as studentsApi,
  teachers   as teachersApi,
  classes    as classesApi,
  payments   as paymentsApi,
  expenses   as expensesApi,
  events     as eventsApi,
  attendance as attendanceApi,
  notes      as notesApi,
  todos      as todosApi,
} from '../services/api';

// ─── Context ────────────────────────────────────────────────────────────────
const StoreCtx = createContext(null);
export const useStore = () => {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside <AppStoreProvider>');
  return ctx;
};

// ─── Helpers ────────────────────────────────────────────────────────────────
const now = new Date();
const CUR_YEAR  = now.getFullYear();
const CUR_MONTH = now.getMonth() + 1; // 1-based

function currentMonthStr() {
  return `${CUR_YEAR}-${String(CUR_MONTH).padStart(2, '0')}`;
}

function isCurMonth(dateStr) {
  if (!dateStr) return false;
  return dateStr.startsWith(currentMonthStr());
}

// ─── Provider ───────────────────────────────────────────────────────────────
export function AppStoreProvider({ children }) {
  // ── Raw data slices ──────────────────────────────────────────────────────
  const [students,  setStudents]  = useState([]);
  const [teachers,  setTeachers]  = useState([]);
  const [classes,   setClasses]   = useState([]);
  const [payments,  setPayments]  = useState([]);
  const [expenses,  setExpenses]  = useState([]);
  const [events,    setEvents]    = useState([]);
  const [notes,     setNotes]     = useState([]);
  const [todos,     setTodos]     = useState([]);

  // Attendance is keyed by "year-month" -> records object; kept separately
  const [attendanceCache, setAttendanceCache] = useState({});

  // Loading/error per slice
  const [loading,  setLoading]  = useState({});
  const [errors,   setErrors]   = useState({});

  // Global loading flag (true while ANY slice is in-flight on first load)
  const [initialized, setInitialized] = useState(false);

  // ── Fetch helpers ────────────────────────────────────────────────────────
  const setSliceLoading = (slice, val) =>
    setLoading(p => ({ ...p, [slice]: val }));
  const setSliceError = (slice, msg) =>
    setErrors(p => ({ ...p, [slice]: msg }));

  const fetchSlice = useCallback(async (slice, apiFn, setter) => {
    setSliceLoading(slice, true);
    setSliceError(slice, null);
    try {
      const data = await apiFn();
      setter(data);
    } catch (e) {
      setSliceError(slice, e.message || `Failed to load ${slice}`);
    } finally {
      setSliceLoading(slice, false);
    }
  }, []);

  // ── Individual refresh functions (called after mutations) ─────────────────
  const refreshStudents  = useCallback(() => fetchSlice('students',  () => studentsApi.getAll(),   setStudents),  [fetchSlice]);
  const refreshTeachers  = useCallback(() => fetchSlice('teachers',  () => teachersApi.getAll(),   setTeachers),  [fetchSlice]);
  const refreshClasses   = useCallback(() => fetchSlice('classes',   () => classesApi.getAll(),    setClasses),   [fetchSlice]);
  const refreshPayments  = useCallback(() => fetchSlice('payments',  () => paymentsApi.getAll(),   setPayments),  [fetchSlice]);
  const refreshExpenses  = useCallback(() => fetchSlice('expenses',  () => expensesApi.getAll(),   setExpenses),  [fetchSlice]);
  const refreshEvents    = useCallback(() => fetchSlice('events',    () => eventsApi.getAll(),     setEvents),    [fetchSlice]);
  const refreshNotes     = useCallback(() => fetchSlice('notes',     () => notesApi.getAll(),      setNotes),     [fetchSlice]);
  const refreshTodos     = useCallback(() => fetchSlice('todos',     () => todosApi.getAll(),      setTodos),     [fetchSlice]);

  const refreshAttendance = useCallback(async (year, month) => {
    const key = `${year}-${month}`;
    setSliceLoading(`attendance-${key}`, true);
    try {
      const data = await attendanceApi.getMonth(year, month);
      setAttendanceCache(p => ({ ...p, [key]: data }));
    } catch (e) {
      setSliceError(`attendance-${key}`, e.message);
    } finally {
      setSliceLoading(`attendance-${key}`, false);
    }
  }, []);

  // ── Initial load — fetch everything in parallel ───────────────────────────
  // fetchSlice records a per-slice error, so a backend outage shows up instead of silently rendering zeros
  useEffect(() => {
    Promise.all([
      refreshStudents(), refreshTeachers(), refreshClasses(), refreshPayments(),
      refreshExpenses(), refreshEvents(), refreshNotes(), refreshTodos(),
    ]).finally(() => setInitialized(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived / computed values (auto-update when any slice changes) ─────────
  const derived = useMemo(() => {

    // ── Students ──────────────────────────────────────────────────────────
    const activeStudents   = students.filter(s => s.status === 'ACTIVE').length;
    const totalStudents    = students.length;

    // Build per-student balance map from payments
    const studentBalanceMap = {};
    payments.forEach(p => {
      const sid = p.studentId;
      if (!studentBalanceMap[sid]) studentBalanceMap[sid] = 0;
      if (p.status !== 'PAID') {
        studentBalanceMap[sid] += Number(p.amount) || 0;
      }
    });
    const unpaidStudents = Object.values(studentBalanceMap).filter(v => v > 0).length;

    // Enrich students with live balance
    const enrichedStudents = students.map(s => ({
      ...s,
      totalOwed: studentBalanceMap[s.id] || 0,
    }));

    // ── Teachers ─────────────────────────────────────────────────────────
    const totalTeachers    = teachers.filter(t => t.status === 'ACTIVE').length;
    const monthlySalaries  = teachers
      .filter(t => t.status === 'ACTIVE')
      .reduce((sum, t) => sum + (Number(t.monthlySalary) || 0), 0);

    // ── Classes ───────────────────────────────────────────────────────────
    const totalClasses     = classes.filter(c => c.status === 'ACTIVE').length;

    // ── Events ────────────────────────────────────────────────────────────
    const upcomingEvents   = events.filter(e =>
      e.status === 'PLANNED' || e.status === 'ONGOING'
    ).length;
    // All-time event totals (for the Events page summary strip)
    const eventsCostTotal  = events.reduce((s, e) => s + (Number(e.totalCost)    || 0), 0);
    const eventsRevTotal   = events.reduce((s, e) => s + (Number(e.totalRevenue) || 0), 0);
    const eventsNetProfit  = eventsRevTotal - eventsCostTotal;

    // Current-month event totals (folded into dashboard financials)
    const curMonthEvents        = events.filter(e => isCurMonth(e.eventDate));
    const curMonthEventRevenue  = curMonthEvents.reduce((s, e) => s + (Number(e.totalRevenue) || 0), 0);
    const curMonthEventCost     = curMonthEvents.reduce((s, e) => s + (Number(e.totalCost)    || 0), 0);

    // ── Payments (current month) ──────────────────────────────────────────
    // A payment counts toward this month if EITHER the date it was actually paid
    // OR its billing month (monthYear) falls in the current month. Previously this
    // only checked paymentDate and fell back to monthYear when paymentDate was
    // missing — so a PAID payment with a paymentDate outside the current month
    // (e.g. paid late, or paid in advance for next month) silently dropped off
    // the dashboard even though monthYear correctly identified it as this month's.
    const curMonthPayments = payments.filter(p => isCurMonth(p.paymentDate) || isCurMonth(p.monthYear));
    const paymentRevenue   = curMonthPayments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Monthly revenue = student payments + event revenue this month
    const monthlyRevenue   = paymentRevenue + curMonthEventRevenue;

    const totalRevenue     = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const totalOutstanding = payments
      .filter(p => p.status !== 'PAID')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const unpaidList       = payments.filter(p => p.status !== 'PAID');

    // ── Expenses (current month) ──────────────────────────────────────────
    const curMonthExpenses = expenses.filter(e => isCurMonth(e.expenseDate));
    const nonSalaryExpenses = curMonthExpenses
      .filter(e => e.category !== 'SALARIES')
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Total monthly expenses = salaries + operational expenses + event costs this month
    const monthlyExpenses  = monthlySalaries + nonSalaryExpenses + curMonthEventCost;

    const totalExpensesAll = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Expenses grouped by category (all time)
    const expensesByCategory = expenses.reduce((acc, e) => {
      const cat = e.category || 'OTHER';
      acc[cat] = (acc[cat] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});

    // Expenses by month (last 6 months) for charts
    const expensesByMonth = {};
    expenses.forEach(e => {
      if (!e.expenseDate) return;
      const key = e.expenseDate.slice(0, 7);
      expensesByMonth[key] = (expensesByMonth[key] || 0) + (Number(e.amount) || 0);
    });

    // Revenue by month (last 6 months) for charts
    const revenueByMonth = {};
    payments.filter(p => p.status === 'PAID').forEach(p => {
      const key = (p.paymentDate || p.monthYear || '').slice(0, 7);
      if (key) revenueByMonth[key] = (revenueByMonth[key] || 0) + (Number(p.amount) || 0);
    });

    // ── Profit & margin ───────────────────────────────────────────────────
    const netProfit    = monthlyRevenue - monthlyExpenses;
    const profitMargin = monthlyRevenue > 0
      ? (netProfit / monthlyRevenue) * 100
      : 0;

    // ── Dashboard summary (matches backend shape so Dashboard needs no change) ──
    const dashboardSummary = {
      monthlyRevenue,
      monthlyExpenses,
      monthlySalaries,
      netProfit,
      profitMargin,
      activeStudents,
      totalStudents,
      unpaidStudents,
      totalTeachers,
      totalClasses,
      upcomingEvents,
    };

    return {
      // Students
      enrichedStudents,
      activeStudents,
      totalStudents,
      unpaidStudents,
      studentBalanceMap,
      // Teachers
      totalTeachers,
      monthlySalaries,
      // Classes
      totalClasses,
      // Payments
      monthlyRevenue,
      totalRevenue,
      totalOutstanding,
      unpaidList,
      curMonthPayments,
      revenueByMonth,
      // Expenses
      monthlyExpenses,
      nonSalaryExpenses,
      totalExpensesAll,
      expensesByCategory,
      expensesByMonth,
      curMonthExpenses,
      // Events
      upcomingEvents,
      eventsCostTotal,
      eventsRevTotal,
      eventsNetProfit,
      curMonthEventRevenue,
      curMonthEventCost,
      // Payments breakdown
      paymentRevenue,
      // Financials
      netProfit,
      profitMargin,
      // Dashboard convenience
      dashboardSummary,
    };
  }, [students, teachers, classes, payments, expenses, events]);

  // ── CRUD Actions — mutate then invalidate affected slices ──────────────────

  // Students
  const studentActions = useMemo(() => ({
    create: async (data) => { await studentsApi.create(data);       await refreshStudents(); },
    update: async (id, data) => { await studentsApi.update(id, data); await refreshStudents(); },
    remove: async (id) => { await studentsApi.remove(id);           await Promise.all([refreshStudents(), refreshPayments(), refreshClasses()]); },
  }), [refreshStudents, refreshPayments, refreshClasses]);

  // Teachers — salary changes affect monthly expenses → dashboard
  const teacherActions = useMemo(() => ({
    create: async (data) => { await teachersApi.create(data);       await refreshTeachers(); },
    update: async (id, data) => { await teachersApi.update(id, data); await Promise.all([refreshTeachers(), refreshClasses()]); },
    remove: async (id) => { await teachersApi.remove(id);           await Promise.all([refreshTeachers(), refreshClasses()]); },
  }), [refreshTeachers, refreshClasses]);

  // Classes
  const classActions = useMemo(() => ({
    create: async (data) => { await classesApi.create(data);        await Promise.all([refreshClasses(), refreshTeachers()]); },
    update: async (id, data) => { await classesApi.update(id, data); await Promise.all([refreshClasses(), refreshTeachers()]); },
    remove: async (id) => { await classesApi.remove(id);            await Promise.all([refreshClasses(), refreshPayments(), refreshTeachers()]); },
  }), [refreshClasses, refreshPayments, refreshTeachers]);

  // Payments — affect revenue, balances, unpaid list, dashboard
  const paymentActions = useMemo(() => ({
    create: async (data) => { await paymentsApi.create(data); await Promise.all([refreshPayments(), refreshStudents(), refreshClasses()]); },
    update: async (id, data) => { await paymentsApi.update(id, data); await Promise.all([refreshPayments(), refreshStudents(), refreshClasses()]); },
    remove: async (id) => { await paymentsApi.remove(id); await Promise.all([refreshPayments(), refreshStudents(), refreshClasses()]); },
  }), [refreshPayments, refreshStudents, refreshClasses]);

  // Expenses — affect monthly expenses, net profit, dashboard
  const expenseActions = useMemo(() => ({
    create: async (data) => { await expensesApi.create(data); await refreshExpenses(); },
    update: async (id, data) => { await expensesApi.update(id, data); await refreshExpenses(); },
    remove: async (id) => { await expensesApi.remove(id);     await refreshExpenses(); },
  }), [refreshExpenses]);

  // Events
  const eventActions = useMemo(() => ({
    create: async (data) => { await eventsApi.create(data);        await refreshEvents(); },
    update: async (id, data) => { await eventsApi.update(id, data); await refreshEvents(); },
    remove: async (id) => { await eventsApi.remove(id);            await refreshEvents(); },
  }), [refreshEvents]);

  // Notes
  const noteActions = useMemo(() => ({
    create: async (data) => { await notesApi.create(data);         await refreshNotes(); },
    update: async (id, data) => { await notesApi.update(id, data); await refreshNotes(); },
    remove: async (id) => { await notesApi.remove(id);             await refreshNotes(); },
  }), [refreshNotes]);

  // Todos
  const todoActions = useMemo(() => ({
    create: async (data) => { await todosApi.create(data);         await refreshTodos(); },
    update: async (id, data) => { await todosApi.update(id, data); await refreshTodos(); },
    remove: async (id) => { await todosApi.remove(id);             await refreshTodos(); },
  }), [refreshTodos]);

  // Attendance
  const attendanceActions = useMemo(() => ({
    getMonth:  (year, month) => attendanceCache[`${year}-${month}`] || {},
    saveMonth: async (year, month, records) => {
      await attendanceApi.saveMonth(year, month, records);
      await refreshAttendance(year, month);
      await refreshStudents(); // attendance % may update
    },
    refresh: refreshAttendance,
  }), [attendanceCache, refreshAttendance, refreshStudents]);

  // ── Expose everything ────────────────────────────────────────────────────
  const value = useMemo(() => ({
    // Raw slices (pages that need full lists)
    students:   derived.enrichedStudents,  // always enriched with live balance
    teachers,
    classes,
    payments,
    expenses,
    events,
    notes,
    todos,

    // Derived / computed
    ...derived,

    // State metadata
    loading,
    errors,
    initialized,

    // Actions
    studentActions,
    teacherActions,
    classActions,
    paymentActions,
    expenseActions,
    eventActions,
    noteActions,
    todoActions,
    attendanceActions,

    // Manual refresh (for pages that want to force-reload)
    refresh: {
      students:   refreshStudents,
      teachers:   refreshTeachers,
      classes:    refreshClasses,
      payments:   refreshPayments,
      expenses:   refreshExpenses,
      events:     refreshEvents,
      notes:      refreshNotes,
      todos:      refreshTodos,
      attendance: refreshAttendance,
      all: () => Promise.all([
        refreshStudents(), refreshTeachers(), refreshClasses(),
        refreshPayments(), refreshExpenses(), refreshEvents(),
        refreshNotes(), refreshTodos(),
      ]),
    },
  }), [
    derived, teachers, classes, payments, expenses, events, notes, todos,
    loading, errors, initialized,
    studentActions, teacherActions, classActions, paymentActions,
    expenseActions, eventActions, noteActions, todoActions, attendanceActions,
    refreshStudents, refreshTeachers, refreshClasses, refreshPayments,
    refreshExpenses, refreshEvents, refreshNotes, refreshTodos, refreshAttendance,
  ]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}
