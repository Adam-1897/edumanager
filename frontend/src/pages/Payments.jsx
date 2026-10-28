// src/pages/Payments.jsx — uses AppStore
import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { PageShell, Card, DataTable, Badge, NameCell, Btn, Modal, Field,
         Input, Select, FormGrid, Loading, ErrorMsg, fmt, useConfirm } from '../components/UI';

const METHOD_OPTS = ['CASH','BANK_TRANSFER','CARD','CHEQUE','OTHER'].map(v => ({value:v,label:v.replace('_',' ')}));
const STATUS_OPTS = ['PAID','UNPAID','PARTIAL','OVERDUE'].map(v => ({value:v,label:v}));
const EMPTY = { studentId:'', classId:'', amount:'', monthYear:'', paymentDate:'', method:'CASH', status:'UNPAID', notes:'' };

export default function Payments() {
  const { payments: rows, students, classes, loading, paymentActions } = useStore();
  const isLoading = loading['payments'];

  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const confirm = useConfirm();

  const studentOpts = students.map(s => ({value:String(s.id), label:s.fullName}));
  const classOpts   = classes.map(c  => ({value:String(c.id), label:c.name}));

  const openAdd  = ()  => { setForm(EMPTY); setEditId(null); setSubmitted(false); setError(''); setModal(true); };
  const openEdit = (r) => {
    setForm({...EMPTY, ...r, studentId:String(r.studentId||''), classId:String(r.classId||''),
      paymentDate: r.paymentDate || '', method: r.method || '', notes: r.notes || ''});
    setEditId(r.id); setSubmitted(false); setError(''); setModal(true);
  };

  // A payment date is only required once the payment is actually PAID
  const isValid = form.studentId !== '' && String(form.amount ?? '').trim() !== '' && Number(form.amount) > 0
    && (form.status !== 'PAID' || String(form.paymentDate ?? '').trim() !== '');

  const save = async () => {
    setSubmitted(true);
    if (!isValid) return;
    setSaving(true); setError('');
    try {
      const d = {
        ...form,
        studentId: Number(form.studentId),
        classId:   form.classId ? Number(form.classId) : null,
        amount:    Number(form.amount),
      };
      if (editId) { await paymentActions.update(editId, d); }
      else        { await paymentActions.create(d); }
      setModal(false); setSubmitted(false);
    } catch (e) {
      setError('Save failed: ' + (e.message || ''));
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm()) return;
    try { await paymentActions.remove(id); }
    catch (e) { setError('Delete failed: ' + (e.message || '')); }
  };

  const f   = key => ({value: form[key], onChange: v => setForm(p => ({...p,[key]:v}))});
  const req = key => ({...f(key), required: submitted});

  // Derived from store — always in sync
  const paid        = rows.filter(r => r.status === 'PAID').reduce((s,r) => s + Number(r.amount), 0);
  const outstanding = rows.filter(r => r.status !== 'PAID').reduce((s,r) => s + Number(r.amount), 0);

  const statusColor = { PAID:'green', UNPAID:'red', PARTIAL:'amber', OVERDUE:'red' };
  const columns = [
    { key:'studentName', label:'Student', render:(v,r) => <NameCell name={v} sub={r.className} /> },
    { key:'amount',      label:'Amount',  render:v => <strong>{fmt(v)}</strong> },
    { key:'monthYear',   label:'Month' },
    { key:'method',      label:'Method',  render:v => v ? v.replace('_',' ') : '—' },
    { key:'paymentDate', label:'Date',    render:v => <span style={{color:'var(--color-text-secondary)'}}>{v||'—'}</span> },
    { key:'status',      label:'Status',  render:v => <Badge color={statusColor[v]}>{v}</Badge> },
    { key:'id', label:'Actions', render:(_,r) => (
      <div style={{display:'flex',gap:6}}>
        <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Btn>
        <Btn size="sm" variant="danger"    onClick={() => remove(r.id)}>Delete</Btn>
      </div>) },
  ];

  return (
    <PageShell title="Payments" action={<Btn onClick={openAdd}>+ Add Payment</Btn>}>
      {error && <ErrorMsg msg={error} />}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginBottom:20}}>
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:10,borderTop:'3px solid #639922',padding:'18px 20px'}}>
          <div style={{fontSize:'11px',fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Collected</div>
          <div style={{fontSize:'26px',fontWeight:600}}>{fmt(paid)}</div>
        </div>
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:10,borderTop:'3px solid #E24B4A',padding:'18px 20px'}}>
          <div style={{fontSize:'11px',fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Outstanding</div>
          <div style={{fontSize:'26px',fontWeight:600,color:'#A32D2D'}}>{fmt(outstanding)}</div>
        </div>
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:10,borderTop:'3px solid #185FA5',padding:'18px 20px'}}>
          <div style={{fontSize:'11px',fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Total Records</div>
          <div style={{fontSize:'26px',fontWeight:600}}>{rows.length}</div>
        </div>
      </div>
      <Card style={{marginBottom:0}}>
        {isLoading ? <Loading /> : <DataTable columns={columns} rows={rows} />}
      </Card>
      {modal && (
        <Modal title={editId ? 'Edit Payment' : 'Add Payment'} onClose={() => setModal(false)}
          onSave={save} saving={saving} canSave={!submitted || isValid}>
          {error && <ErrorMsg msg={error} />}
          <FormGrid>
            <Field label="Student" required><Select {...req('studentId')} options={studentOpts} /></Field>
            <Field label="Class"><Select {...f('classId')} options={classOpts} /></Field>
            <Field label="Amount ($)" required><Input {...req('amount')} type="number" placeholder="0.00" /></Field>
            <Field label="Month (YYYY-MM)"><Input {...f('monthYear')} placeholder="2026-04" /></Field>
            <Field label="Payment Date" required={form.status === 'PAID'}><Input {...f('paymentDate')} required={submitted && form.status === 'PAID'} type="date" /></Field>
            <Field label="Method"><Select {...f('method')} options={METHOD_OPTS} /></Field>
            <Field label="Status"><Select {...f('status')} options={STATUS_OPTS} /></Field>
            <Field label="Notes" full><Input {...f('notes')} placeholder="Optional notes" /></Field>
          </FormGrid>
          {submitted && !isValid && (
            <div style={{marginTop:8,padding:'8px 12px',background:'#fff5f5',border:'1px solid #fecaca',
              borderRadius:6,fontSize:'12px',color:'#E24B4A'}}>
              ⚠ Please select a student and enter a valid amount (paid payments also need a payment date)
            </div>
          )}
        </Modal>
      )}
    </PageShell>
  );
}
