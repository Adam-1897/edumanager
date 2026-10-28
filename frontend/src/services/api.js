// src/services/api.js — v2
import { demoRequest } from './demoBackend';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
// Standalone demo build (npm run build:demo): no server, data kept in the browser
export const DEMO_MODE = import.meta.env.VITE_DEMO === '1';

async function request(method, path, body = null) {
  if (DEMO_MODE) return demoRequest(method, path, body);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method, headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Expired/invalid session -> back to login. A 401 from the login call itself just means bad credentials.
  if (res.status === 401 && !path.startsWith('/auth/')) {
    localStorage.removeItem('token');
    window.location.reload();
    throw new Error('Session expired — please sign in again');
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

const get  = (path)       => request('GET',    path);
const post = (path, body) => request('POST',   path, body);
const put  = (path, body) => request('PUT',    path, body);
const del  = (path)       => request('DELETE', path);

export const auth = {
  login:    (data) => post('/auth/login', data),
  register: (data) => post('/auth/register', data),
};

export const dashboard = { summary: () => get('/dashboard/summary') };

export const students = {
  getAll:   (params = {}) => get(`/students?${new URLSearchParams(params)}`),
  getOne:   (id)          => get(`/students/${id}`),
  create:   (data)        => post('/students', data),
  update:   (id, data)    => put(`/students/${id}`, data),
  remove:   (id)          => del(`/students/${id}`),
  payments: (id)          => get(`/students/${id}/payments`),
};

export const teachers = {
  getAll:      (params = {}) => get(`/teachers?${new URLSearchParams(params)}`),
  getOne:      (id)          => get(`/teachers/${id}`),
  create:      (data)        => post('/teachers', data),
  update:      (id, data)    => put(`/teachers/${id}`, data),
  remove:      (id)          => del(`/teachers/${id}`),
  salaryTotal: ()            => get('/teachers/salary-total'),
};

export const classes = {
  getAll:  ()           => get('/classes'),
  getOne:  (id)         => get(`/classes/${id}`),
  create:  (data)       => post('/classes', data),
  update:  (id, data)   => put(`/classes/${id}`, data),
  remove:  (id)         => del(`/classes/${id}`),
};

export const payments = {
  getAll:   (params = {}) => get(`/payments?${new URLSearchParams(params)}`),
  getUnpaid: ()           => get('/payments/unpaid'),
  total:    (month)       => get(`/payments/total/${month}`),
  create:   (data)        => post('/payments', data),
  update:   (id, data)    => put(`/payments/${id}`, data),
  remove:   (id)          => del(`/payments/${id}`),
};

export const expenses = {
  getAll:  (params = {}) => get(`/expenses?${new URLSearchParams(params)}`),
  total:   (year, month) => get(`/expenses/total?year=${year}&month=${month}`),
  create:  (data)        => post('/expenses', data),
  update:  (id, data)    => put(`/expenses/${id}`, data),
  remove:  (id)          => del(`/expenses/${id}`),
};

export const events = {
  getAll:  () => get('/events'),
  getOne:  (id) => get(`/events/${id}`),
  create:  (data) => post('/events', data),
  update:  (id, data) => put(`/events/${id}`, data),
  remove:  (id) => del(`/events/${id}`),
};

// ─── Attendance ───────────────────────────────────────────
export const attendance = {
  getMonth:  (year, month) => get(`/attendance?year=${year}&month=${month}`),
  saveMonth: (year, month, records) => post(`/attendance?year=${year}&month=${month}`, records),
};

// ─── Notes ────────────────────────────────────────────────
export const notes = {
  getAll: ()             => get('/notes'),
  create: (data)         => post('/notes', data),
  update: (id, data)     => put(`/notes/${id}`, data),
  remove: (id)           => del(`/notes/${id}`),
};

// ─── To-Do List ───────────────────────────────────────────
export const todos = {
  getAll: ()             => get('/todos'),
  create: (data)         => post('/todos', data),
  update: (id, data)     => put(`/todos/${id}`, data),
  remove: (id)           => del(`/todos/${id}`),
};
