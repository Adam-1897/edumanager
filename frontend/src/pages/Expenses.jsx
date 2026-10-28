// src/pages/Expenses.jsx — uses AppStore (changes propagate to Dashboard instantly)
import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { PageShell, Card, DataTable, Badge, Btn, Modal, Field,
         Input, Select, Textarea, FormGrid, Loading, ErrorMsg, fmt, useConfirm } from '../components/UI';

const CAT_OPTS = ['RENT','UTILITIES','MAINTENANCE','SALARIES','SUPPLIES','MARKETING','MISCELLANEOUS'].map(v => ({value:v,label:v}));
const EMPTY = { description:'', category:'RENT', amount:'', expenseDate:'', vendor:'', receiptRef:'', notes:'' };
const catColor = { RENT:'blue', UTILITIES:'amber', MAINTENANCE:'amber', SALARIES:'red', SUPPLIES:'gray', MARKETING:'green', MISCELLANEOUS:'gray' };

export default function Expenses() {
  const { expenses: rows, loading, expenseActions } = useStore();
  const isLoading = loading['expenses'];

  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [submitted, setSubmitted] = useState(false);
  const confirm = useConfirm();

  const openAdd  = ()  => { setForm(EMPTY); setEditId(null); setSubmitted(false); setError(''); setModal(true); };
  const openEdit = (r) => { setForm(r); setEditId(r.id); setSubmitted(false); setError(''); setModal(true); };

  const isValid = form.description.trim() !== '' && String(form.amount).trim() !== '' && Number(form.amount) > 0 && form.expenseDate.trim() !== '';

  const save = async () => {
    setSubmitted(true);
    if (!isValid) return;
    setSaving(true);
    try {
      const d = { ...form, amount: Number(form.amount) };
      if (editId) {
        await expenseActions.update(editId, d);
      } else {
        await expenseActions.create(d);
      }
      setModal(false); setSubmitted(false);
    } catch (e) {
      setError('Save failed: ' + (e.message || ''));
    } finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm()) return;
    try { await expenseActions.remove(id); }
    catch (e) { setError('Delete failed: ' + (e.message || '')); }
  };

  const f   = key => ({value:form[key],onChange:v=>setForm(p=>({...p,[key]:v}))});
  const req = key => ({...f(key), required: submitted});

  // Total derived from store slice — always accurate
  const total = rows.reduce((s,r) => s + Number(r.amount), 0);

  const columns = [
    { key:'description', label:'Description', render:v => <strong>{v}</strong> },
    { key:'category',    label:'Category',    render:v => <Badge color={catColor[v]||'gray'}>{v}</Badge> },
    { key:'amount',      label:'Amount',      render:v => fmt(v) },
    { key:'expenseDate', label:'Date',        render:v => <span style={{color:'var(--color-text-secondary)'}}>{v}</span> },
    { key:'vendor',      label:'Vendor',      render:v => v||'—' },
    { key:'id', label:'Actions', render:(_,r) => (
      <div style={{display:'flex',gap:6}}>
        <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Btn>
        <Btn size="sm" variant="danger"    onClick={() => remove(r.id)}>Delete</Btn>
      </div>) },
  ];

  return (
    <PageShell title="Expenses"
      action={<div style={{display:'flex',gap:8,alignItems:'center'}}>
        <span style={{fontSize:'13px',color:'var(--color-text-secondary)'}}>Total: <strong style={{color:'var(--color-text-primary)'}}>{fmt(total)}</strong></span>
        <Btn onClick={openAdd}>+ Add Expense</Btn>
      </div>}>
      {error && <ErrorMsg msg={error} />}
      <Card style={{marginBottom:0}}>{isLoading ? <Loading /> : <DataTable columns={columns} rows={rows} />}</Card>
      {modal && (
        <Modal title={editId ? 'Edit Expense' : 'Add Expense'} onClose={() => setModal(false)} onSave={save} saving={saving} canSave={!submitted || isValid}>
          {error && <ErrorMsg msg={error} />}
          <FormGrid>
            <Field label="Description" required full><Input {...req('description')} /></Field>
            <Field label="Amount ($)" required><Input {...req('amount')} type="number" /></Field>
            <Field label="Date" required><Input {...req('expenseDate')} type="date" /></Field>
            <Field label="Category"><Select {...f('category')} options={CAT_OPTS} /></Field>
            <Field label="Vendor"><Input {...f('vendor')} /></Field>
            <Field label="Receipt Ref"><Input {...f('receiptRef')} /></Field>
            <Field label="Notes" full><Textarea {...f('notes')} rows={2} /></Field>
          </FormGrid>
          {submitted && !isValid && (
            <div style={{marginTop:8,padding:'8px 12px',background:'#fff5f5',border:'1px solid #fecaca',
              borderRadius:6,fontSize:'12px',color:'#E24B4A'}}>
              ⚠ Description, Amount, and Date are required
            </div>
          )}
        </Modal>
      )}
    </PageShell>
  );
}
