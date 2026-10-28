// src/pages/Students.jsx — uses AppStore
import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { PageShell, Card, DataTable, Badge, NameCell, Btn, Modal, Field,
         Input, Select, Textarea, FormGrid, SearchBox, Loading, ErrorMsg,
         ProgressBar, fmt, useConfirm } from '../components/UI';

const STATUS_OPTS     = ['ACTIVE','INACTIVE','GRADUATED','SUSPENDED'].map(v => ({ value:v, label:v }));
const METHOD_OPTS     = ['CASH','BANK_TRANSFER','CARD','CHEQUE','OTHER'].map(v => ({value:v, label:v.replace('_',' ')}));
const PAY_STATUS_OPTS = ['PAID','UNPAID','PARTIAL','OVERDUE'].map(v => ({value:v, label:v}));
const EMPTY    = { fullName:'', email:'', phone:'', parentName:'', parentPhone:'', address:'', notes:'', status:'ACTIVE', enrollDate:'' };
const PAY_EMPTY = { classId:'', amount:'', monthYear:'', paymentDate:'', method:'CASH', status:'UNPAID', notes:'' };

export default function Students() {
  const { students: allRows, classes, loading, studentActions, paymentActions } = useStore();
  const isLoading = loading['students'];

  const [search, setSearch] = useState('');
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [submitted, setSubmitted] = useState(false);

  const [payModal,     setPayModal]     = useState(false);
  const [payForm,      setPayForm]      = useState(PAY_EMPTY);
  const [payStudent,   setPayStudent]   = useState(null);
  const [paySaving,    setPaySaving]    = useState(false);
  const [paySubmitted, setPaySubmitted] = useState(false);
  const [payError,     setPayError]     = useState('');

  const confirm = useConfirm();

  // Client-side search filter against store data
  const rows = search.trim()
    ? allRows.filter(s =>
        s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
      )
    : allRows;

  const classOpts = classes.map(c => ({ value: String(c.id), label: c.name }));

  const openAdd  = ()  => { setForm(EMPTY); setEditId(null); setSubmitted(false); setError(''); setModal(true); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r, enrollDate: r.enrollDate || '' }); setEditId(r.id); setSubmitted(false); setError(''); setModal(true); };
  const openPay  = (student) => {
    const today = new Date().toISOString().split('T')[0];
    setPayStudent(student);
    setPayForm({ ...PAY_EMPTY, paymentDate: today, monthYear: today.slice(0, 7) });
    setPaySubmitted(false);
    setPayError('');
    setPayModal(true);
  };

  const isValid    = String(form.fullName ?? '').trim() !== '';
  const isPayValid = String(payForm.amount).trim() !== '' && Number(payForm.amount) > 0 && payForm.paymentDate.trim() !== '';

  const save = async () => {
    setSubmitted(true);
    if (!isValid) return;
    setSaving(true); setError('');
    try {
      if (editId) { await studentActions.update(editId, form); }
      else        { await studentActions.create(form); }
      setModal(false); setSubmitted(false);
    } catch (e) { setError('Save failed: ' + (e.message || 'Unknown error')); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm()) return;
    try { await studentActions.remove(id); }
    catch (e) { setError('Delete failed: ' + (e.message || 'Unknown error')); }
  };

  const savePay = async () => {
    setPaySubmitted(true);
    if (!isPayValid) return;
    setPaySaving(true);
    try {
      await paymentActions.create({
        ...payForm,
        studentId: payStudent.id,
        classId:   payForm.classId ? Number(payForm.classId) : null,
        amount:    Number(payForm.amount),
      });
      setPayModal(false); setPaySubmitted(false);
    } catch (e) { setPayError('Failed to save payment: ' + (e.message || 'please try again')); }
    finally { setPaySaving(false); }
  };

  const f    = key => ({ value: form[key],    onChange: v => setForm(p => ({...p, [key]: v})) });
  const req  = key => ({ ...f(key), required: submitted });
  const pf   = key => ({ value: payForm[key], onChange: v => setPayForm(p => ({...p, [key]: v})) });
  const preq = key => ({ ...pf(key), required: paySubmitted });

  const statusColor = { ACTIVE:'green', INACTIVE:'gray', GRADUATED:'blue', SUSPENDED:'red' };

  const columns = [
    { key:'fullName', label:'Name',       render:(v,r) => <NameCell name={v} sub={r.email} /> },
    { key:'phone',    label:'Phone',      render:v => <span style={{color:'var(--color-text-secondary)'}}>{v||'—'}</span> },
    { key:'status',   label:'Status',     render:v => <Badge color={statusColor[v]}>{v}</Badge> },
    { key:'attendancePercent', label:'Attendance', render:v => <ProgressBar value={v ?? null} /> },
    { key:'totalOwed',label:'Balance',    render:v => <Badge color={v>0?'red':'green'}>{v>0?fmt(v)+' owed':'Paid'}</Badge> },
    { key:'id',       label:'Actions',    render:(_,r) => (
      <div style={{display:'flex',gap:6,whiteSpace:'nowrap'}}>
        <Btn size="sm" variant="primary"   onClick={() => openPay(r)}>+ Pay</Btn>
        <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Btn>
        <Btn size="sm" variant="danger"    onClick={() => remove(r.id)}>Delete</Btn>
      </div>) },
  ];

  return (
    <PageShell title="Students"
      action={<div style={{display:'flex',gap:8}}><SearchBox value={search} onChange={setSearch} /><Btn onClick={openAdd}>+ Add Student</Btn></div>}>
      {error && <ErrorMsg msg={error} />}
      <Card style={{marginBottom:0}}>
        {isLoading ? <Loading /> : <DataTable columns={columns} rows={rows} />}
      </Card>

      {modal && (
        <Modal title={editId ? 'Edit Student' : 'Add Student'} onClose={() => setModal(false)}
          onSave={save} saving={saving} canSave={!submitted || isValid}>
          {error && <ErrorMsg msg={error} />}
          <FormGrid>
            <Field label="Full Name" required><Input {...req('fullName')} placeholder="e.g. John Doe" /></Field>
            <Field label="Email"><Input {...f('email')} type="email" /></Field>
            <Field label="Phone"><Input {...f('phone')} /></Field>
            <Field label="Status"><Select {...f('status')} options={STATUS_OPTS} /></Field>
            <Field label="Parent Name"><Input {...f('parentName')} /></Field>
            <Field label="Parent Phone"><Input {...f('parentPhone')} /></Field>
            <Field label="Enroll Date"><Input {...f('enrollDate')} type="date" /></Field>
            <Field label="Address" full><Textarea {...f('address')} rows={2} /></Field>
            <Field label="Notes" full><Textarea {...f('notes')} rows={2} /></Field>
          </FormGrid>
          {submitted && !isValid && (
            <div style={{marginTop:8,padding:'8px 12px',background:'#fff5f5',border:'1px solid #fecaca',
              borderRadius:6,fontSize:'12px',color:'#E24B4A'}}>
              ⚠ Please fill in Full Name
            </div>
          )}
        </Modal>
      )}

      {payModal && payStudent && (
        <Modal title={`Add Payment — ${payStudent.fullName}`} onClose={() => setPayModal(false)}
          onSave={savePay} saving={paySaving} canSave={!paySubmitted || isPayValid}>
          {payError && <ErrorMsg msg={payError} />}
          <FormGrid>
            <Field label="Amount ($)" required><Input {...preq('amount')} type="number" placeholder="0.00" /></Field>
            <Field label="Status"><Select {...pf('status')} options={PAY_STATUS_OPTS} /></Field>
            <Field label="Month (YYYY-MM)"><Input {...pf('monthYear')} placeholder="2026-04" /></Field>
            <Field label="Payment Date" required><Input {...preq('paymentDate')} type="date" /></Field>
            <Field label="Method"><Select {...pf('method')} options={METHOD_OPTS} /></Field>
            <Field label="Class"><Select {...pf('classId')} options={classOpts} /></Field>
            <Field label="Notes" full><Input {...pf('notes')} /></Field>
          </FormGrid>
          {paySubmitted && !isPayValid && (
            <div style={{marginTop:8,padding:'8px 12px',background:'#fff5f5',border:'1px solid #fecaca',
              borderRadius:6,fontSize:'12px',color:'#E24B4A'}}>
              ⚠ Please enter a valid amount and payment date
            </div>
          )}
        </Modal>
      )}
    </PageShell>
  );
}
