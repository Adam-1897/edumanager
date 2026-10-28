// src/pages/Events.jsx — uses AppStore
import { useState } from 'react';
import { useStore } from '../store/AppStore';
import { PageShell, Card, DataTable, Badge, Btn, Modal, Field,
         Input, Select, Textarea, FormGrid, Loading, ErrorMsg, fmt, useConfirm } from '../components/UI';

const STATUS_OPTS = ['PLANNED','ONGOING','COMPLETED','CANCELLED'].map(v => ({value:v,label:v}));
const EMPTY = { name:'', description:'', eventDate:'', location:'', totalCost:'0', totalRevenue:'0', status:'PLANNED' };
const statusColor = { PLANNED:'blue', ONGOING:'green', COMPLETED:'gray', CANCELLED:'red' };

export default function Events() {
  const { events: rows, loading, eventActions } = useStore();
  const isLoading = loading['events'];

  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [submitted, setSubmitted] = useState(false);
  const confirm = useConfirm();

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setSubmitted(false); setError(''); setModal(true); };
  // Null-safe: backend sends doubles, convert to string for controlled inputs
  const openEdit = (r) => {
    setForm({
      ...r,
      totalCost:    String(r.totalCost    != null ? r.totalCost    : 0),
      totalRevenue: String(r.totalRevenue != null ? r.totalRevenue : 0),
    });
    setEditId(r.id); setSubmitted(false); setError(''); setModal(true);
  };

  const isValid = form.name.trim() !== '' && form.eventDate.trim() !== '';

  const save = async () => {
    setSubmitted(true);
    if (!isValid) return;
    setSaving(true);
    try {
      const cost    = parseFloat(form.totalCost)    || 0;
      const revenue = parseFloat(form.totalRevenue) || 0;
      const d = { ...form, totalCost: cost, totalRevenue: revenue };
      if (editId) { await eventActions.update(editId, d); }
      else        { await eventActions.create(d); }
      setModal(false); setSubmitted(false);
    } catch (e) { setError('Save failed: ' + (e.message || 'Unknown error')); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm()) return;
    try { await eventActions.remove(id); }
    catch (e) { setError('Delete failed: ' + (e.message || '')); }
  };

  const f   = key => ({value: form[key], onChange: v => setForm(p => ({...p,[key]:v}))});
  const req = key => ({...f(key), required: submitted});

  // Derive totals directly from the store rows — always accurate
  const totalCost    = rows.reduce((s, r) => s + (Number(r.totalCost)    || 0), 0);
  const totalRevenue = rows.reduce((s, r) => s + (Number(r.totalRevenue) || 0), 0);
  const totalProfit  = totalRevenue - totalCost;

  const columns = [
    { key:'name',         label:'Event',        render:v => <strong>{v}</strong> },
    { key:'eventDate',    label:'Date',         render:v => <span style={{color:'var(--color-text-secondary)'}}>{v}</span> },
    { key:'location',     label:'Location',     render:v => v||'—' },
    { key:'totalCost',    label:'Cost',         render:v => fmt(Number(v) || 0) },
    { key:'totalRevenue', label:'Revenue',      render:v => fmt(Number(v) || 0) },
    // profit arrives as a plain JS number from the fixed backend toMap
    { key:'profit', label:'Profit', render:v => {
        const n = Number(v) || 0;
        return <strong style={{color: n >= 0 ? '#3B6D11' : '#A32D2D'}}>{fmt(n)}</strong>;
    }},
    { key:'participantCount', label:'Participants', render:v => <Badge color="blue">{v ?? 0}</Badge> },
    { key:'status',       label:'Status',       render:v => <Badge color={statusColor[v]}>{v}</Badge> },
    { key:'id', label:'Actions', render:(_,r) => (
      <div style={{display:'flex',gap:6}}>
        <Btn size="sm" variant="secondary" onClick={() => openEdit(r)}>Edit</Btn>
        <Btn size="sm" variant="danger"    onClick={() => remove(r.id)}>Delete</Btn>
      </div>) },
  ];

  return (
    <PageShell title="Events" action={<Btn onClick={openAdd}>+ Add Event</Btn>}>
      {error && <ErrorMsg msg={error} />}
      {/* Financial summary strip */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:12,marginBottom:20}}>
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:10,borderTop:'3px solid #E24B4A',padding:'18px 20px'}}>
          <div style={{fontSize:'11px',fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Total Costs</div>
          <div style={{fontSize:'26px',fontWeight:600,color:'#A32D2D'}}>{fmt(totalCost)}</div>
        </div>
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:10,borderTop:'3px solid #639922',padding:'18px 20px'}}>
          <div style={{fontSize:'11px',fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Total Revenue</div>
          <div style={{fontSize:'26px',fontWeight:600,color:'#3B6D11'}}>{fmt(totalRevenue)}</div>
        </div>
        <div style={{background:'var(--color-background-primary)',border:'0.5px solid var(--color-border-tertiary)',borderRadius:10,borderTop: totalProfit >= 0 ? '3px solid #185FA5' : '3px solid #E24B4A',padding:'18px 20px'}}>
          <div style={{fontSize:'11px',fontWeight:500,color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:8}}>Net Profit</div>
          <div style={{fontSize:'26px',fontWeight:600,color: totalProfit >= 0 ? '#1D4ED8' : '#A32D2D'}}>{fmt(totalProfit)}</div>
        </div>
      </div>
      <Card style={{marginBottom:0}}>{isLoading ? <Loading /> : <DataTable columns={columns} rows={rows} />}</Card>      {modal && (
        <Modal title={editId ? 'Edit Event' : 'Add Event'} onClose={() => setModal(false)} onSave={save} saving={saving} canSave={!submitted || isValid}>
          {error && <ErrorMsg msg={error} />}
          <FormGrid>
            <Field label="Event Name" required full><Input {...req('name')} /></Field>
            <Field label="Date" required><Input {...req('eventDate')} type="date" /></Field>
            <Field label="Location"><Input {...f('location')} /></Field>
            <Field label="Total Cost ($)"><Input {...f('totalCost')} type="number" /></Field>
            <Field label="Total Revenue ($)"><Input {...f('totalRevenue')} type="number" /></Field>
            <Field label="Status"><Select {...f('status')} options={STATUS_OPTS} /></Field>
            <Field label="Description" full><Textarea {...f('description')} rows={2} /></Field>
          </FormGrid>
          {submitted && !isValid && (
            <div style={{marginTop:8,padding:'8px 12px',background:'#fff5f5',border:'1px solid #fecaca',
              borderRadius:6,fontSize:'12px',color:'#E24B4A'}}>
              ⚠ Event Name and Date are required
            </div>
          )}
        </Modal>
      )}
    </PageShell>
  );
}
