// src/pages/Classes.jsx — uses AppStore
import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { PageShell, Card, DataTable, Badge, Btn, Modal, Field,
         Input, Select, FormGrid, Loading, ErrorMsg, fmt, useConfirm } from '../components/UI';

const STATUS_OPTS = ['ACTIVE','INACTIVE','FULL'].map(v => ({value:v,label:v}));
const EMPTY = { name:'', description:'', teacherId:'', schedule:'', room:'', monthlyFee:'', maxStudents:30, status:'ACTIVE' };

export default function Classes() {
  const { classes: rows, teachers, loading, classActions } = useStore();
  const isLoading = loading['classes'];

  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const confirm = useConfirm();

  const teacherOpts = teachers.map(t => ({ value: String(t.id), label: t.fullName }));
  const openAdd  = ()  => { setForm(EMPTY); setEditId(null); setError(''); setModal(true); };
  const openEdit = (r) => { setForm({...EMPTY, ...r, teacherId: String(r.teacherId||'')}); setEditId(r.id); setError(''); setModal(true); };

  const save = async () => {
    if (!String(form.name ?? '').trim()) { setError('Class name is required.'); return; }
    setSaving(true); setError('');
    try {
      const d = {...form, teacherId: form.teacherId || ''};  // '' unassigns the teacher
      if (editId) { await classActions.update(editId, d); }
      else        { await classActions.create(d); }
      setModal(false);
    } catch (e) { setError('Save failed: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm()) return;
    try { await classActions.remove(id); }
    catch (e) { setError('Delete failed: ' + (e.message || '')); }
  };

  const f = key => ({ value: form[key], onChange: v => setForm(p => ({...p, [key]:v})) });

  const columns = [
    { key:'name',         label:'Class',    render:v => <strong>{v}</strong> },
    { key:'teacherName',  label:'Teacher',  render:v => v || <span style={{color:'var(--color-text-secondary)'}}>Unassigned</span> },
    { key:'schedule',     label:'Schedule', render:v => <span style={{color:'var(--color-text-secondary)'}}>{v}</span> },
    { key:'enrolledCount',label:'Enrolled', render:v => <Badge color="blue">{v} student{v!==1?'s':''}</Badge> },
    { key:'monthlyFee',   label:'Fee/Month',render:v => fmt(v) },
    { key:'room',         label:'Room',     render:v => v ? <Badge color="gray">Room {v}</Badge> : '—' },
    { key:'status',       label:'Status',   render:v => <Badge color={v==='ACTIVE'?'green':v==='FULL'?'amber':'gray'}>{v}</Badge> },
    { key:'id', label:'Actions', render:(_,r) => (
      <div style={{display:'flex',gap:6}}>
        <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Btn>
        <Btn size="sm" variant="danger"    onClick={() => remove(r.id)}>Delete</Btn>
      </div>) },
  ];

  return (
    <PageShell title="Classes" action={<Btn onClick={openAdd}>+ Add Class</Btn>}>
      {error && <ErrorMsg msg={error} />}
      <Card style={{marginBottom:0}}>{isLoading ? <Loading /> : <DataTable columns={columns} rows={rows} />}</Card>
      {modal && (
        <Modal title={editId ? 'Edit Class' : 'Add Class'} onClose={() => setModal(false)} onSave={save} saving={saving}>
          {error && <ErrorMsg msg={error} />}
          <FormGrid>
            <Field label="Class Name" required><Input {...f('name')} /></Field>
            <Field label="Teacher"><Select {...f('teacherId')} options={teacherOpts} /></Field>
            <Field label="Schedule"><Input {...f('schedule')} placeholder="Mon/Wed 9AM" /></Field>
            <Field label="Room"><Input {...f('room')} /></Field>
            <Field label="Monthly Fee ($)"><Input {...f('monthlyFee')} type="number" /></Field>
            <Field label="Max Students"><Input {...f('maxStudents')} type="number" /></Field>
            <Field label="Status"><Select {...f('status')} options={STATUS_OPTS} /></Field>
            <Field label="Description" full><Input {...f('description')} /></Field>
          </FormGrid>
        </Modal>
      )}
    </PageShell>
  );
}
