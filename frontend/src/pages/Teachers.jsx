// src/pages/Teachers.jsx — uses AppStore
import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { PageShell, Card, DataTable, Badge, NameCell, Btn, Modal, Field,
         Input, Select, Textarea, FormGrid, SearchBox, Loading, ErrorMsg, fmt, useConfirm } from '../components/UI';

const STATUS_OPTS = ['ACTIVE','INACTIVE','ON_LEAVE'].map(v => ({ value:v, label:v }));
const EMPTY = { fullName:'', email:'', phone:'', subject:'', monthlySalary:'', hireDate:'', status:'ACTIVE', notes:'' };

export default function Teachers() {
  const { teachers: allRows, loading, teacherActions } = useStore();
  const isLoading = loading['teachers'];

  const [search, setSearch] = useState('');
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [submitted, setSubmitted] = useState(false);
  const confirm = useConfirm();

  const rows = search.trim()
    ? allRows.filter(t =>
        t.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        t.subject?.toLowerCase().includes(search.toLowerCase())
      )
    : allRows;

  const openAdd  = ()  => { setForm(EMPTY); setEditId(null); setSubmitted(false); setError(''); setModal(true); };
  const openEdit = (r) => { setForm({ ...EMPTY, ...r, hireDate: r.hireDate || '', monthlySalary: r.monthlySalary ?? '' }); setEditId(r.id); setSubmitted(false); setError(''); setModal(true); };

  const isValid = String(form.fullName ?? '').trim() !== '' && String(form.hireDate ?? '').trim() !== '' && String(form.monthlySalary ?? '').trim() !== '' && Number(form.monthlySalary) > 0;

  const save = async () => {
    setSubmitted(true);
    if (!isValid) return;
    setSaving(true); setError('');
    try {
      if (editId) { await teacherActions.update(editId, form); }
      else        { await teacherActions.create(form); }
      setModal(false); setSubmitted(false);
    } catch (e) { setError('Save failed: ' + (e.message || 'Unknown error')); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm()) return;
    try { await teacherActions.remove(id); }
    catch (e) { setError('Delete failed: ' + (e.message || 'Teacher may still be linked to classes.')); }
  };

  const f   = key => ({ value: form[key], onChange: v => setForm(p => ({...p, [key]:v})) });
  const req = key => ({ ...f(key), required: submitted });

  const columns = [
    { key:'fullName',      label:'Name',    render:(v,r) => <NameCell name={v} sub={r.email} avatarColor="green" /> },
    { key:'subject',       label:'Subject' },
    { key:'classCount',    label:'Classes', render:v => <Badge color="blue">{v} class{v!==1?'es':''}</Badge> },
    { key:'monthlySalary', label:'Salary',  render:v => <strong>{fmt(v)}</strong> },
    { key:'status',        label:'Status',  render:v => <Badge color={v==='ACTIVE'?'green':v==='ON_LEAVE'?'amber':'gray'}>{v}</Badge> },
    { key:'id', label:'Actions', render:(_,r) => (
      <div style={{display:'flex',gap:6}}>
        <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Btn>
        <Btn size="sm" variant="danger"    onClick={() => remove(r.id)}>Delete</Btn>
      </div>) },
  ];

  return (
    <PageShell title="Teachers"
      action={<div style={{display:'flex',gap:8}}><SearchBox value={search} onChange={setSearch}/><Btn onClick={openAdd}>+ Add Teacher</Btn></div>}>
      {error && <ErrorMsg msg={error} />}
      <Card style={{marginBottom:0}}>{isLoading ? <Loading /> : <DataTable columns={columns} rows={rows} />}</Card>
      {modal && (
        <Modal title={editId ? 'Edit Teacher' : 'Add Teacher'} onClose={() => setModal(false)} onSave={save} saving={saving} canSave={!submitted || isValid}>
          {error && <ErrorMsg msg={error} />}
          <FormGrid>
            <Field label="Full Name" required><Input {...req('fullName')} placeholder="e.g. Jane Smith" /></Field>
            <Field label="Email"><Input {...f('email')} type="email" /></Field>
            <Field label="Phone"><Input {...f('phone')} /></Field>
            <Field label="Subject"><Input {...f('subject')} placeholder="e.g. Mathematics" /></Field>
            <Field label="Monthly Salary ($)" required><Input {...req('monthlySalary')} type="number" /></Field>
            <Field label="Hire Date" required><Input {...req('hireDate')} type="date" /></Field>
            <Field label="Status"><Select {...f('status')} options={STATUS_OPTS} /></Field>
            <Field label="Notes" full><Textarea {...f('notes')} rows={2} /></Field>
          </FormGrid>
          {submitted && !isValid && (
            <div style={{marginTop:8,padding:'8px 12px',background:'#fff5f5',border:'1px solid #fecaca',borderRadius:6,fontSize:'12px',color:'#E24B4A'}}>
              ⚠ Full Name, Hire Date, and Monthly Salary are required
            </div>
          )}
        </Modal>
      )}
    </PageShell>
  );
}
