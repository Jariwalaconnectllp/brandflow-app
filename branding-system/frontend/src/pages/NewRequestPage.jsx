import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useDropzone } from 'react-dropzone';
import { Upload, X, ArrowLeft, Send } from 'lucide-react';
import styles from './NewRequestPage.module.css';

const BRANDING_TYPES = ['Hoarding','Flex Banner','LED Signage','Wall Painting','Glow Sign Board','Standee','Vehicle Wrap','Digital Display','Neon Sign','Other'];
const STATES = ['Gujarat','Maharashtra','Rajasthan','Delhi','Karnataka','Tamil Nadu','Uttar Pradesh','West Bengal','Telangana','Kerala','Other'];

export default function NewRequestPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [form, setForm] = useState({
    title: '', brandingType: '', requirements: '', priority: 'medium', targetDate: '',
    location: { address: '', city: '', state: 'Gujarat', pincode: '', landmark: '' }
  });

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpg','.jpeg','.png','.webp'] },
    maxFiles: 5, maxSize: 10 * 1024 * 1024,
    onDrop: accepted => setFiles(prev => [...prev, ...accepted].slice(0, 5)),
    onDropRejected: () => toast.error('Max 5 files, each up to 10MB, images only')
  });

  const removeFile = (i) => setFiles(files.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.brandingType || !form.requirements || !form.location.address || !form.location.city) {
      toast.error('Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('brandingType', form.brandingType);
      fd.append('requirements', form.requirements);
      fd.append('priority', form.priority);
      if (form.targetDate) fd.append('targetDate', form.targetDate);
      fd.append('location', JSON.stringify(form.location));
      files.forEach(f => fd.append('attachments', f));

      const res = await api.post('/requests', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Request ${res.data.request.requestNumber} created!`);
      navigate(`/requests/${res.data.request._id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create request');
    } finally { setLoading(false); }
  };

  const setLoc = (key, val) => setForm(f => ({ ...f, location: { ...f.location, [key]: val } }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className="btn-secondary btn-sm" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button>
        <div>
          <h1 className={styles.title}>New Branding Request</h1>
          <p className={styles.subtitle}>Fill in the details to initiate a new branding request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Left column */}
        <div className={styles.col}>
          {/* Basic info */}
          <div className="card">
            <h2 className={styles.sectionTitle}>Request Details</h2>
            <div className={styles.fields}>
              <div>
                <label>Request Title <span className={styles.req}>*</span></label>
                <input placeholder="e.g. Hoarding at Ring Road Junction"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="grid-2">
                <div>
                  <label>Branding Type <span className={styles.req}>*</span></label>
                  <select value={form.brandingType} onChange={e => setForm(f => ({ ...f, brandingType: e.target.value }))} required>
                    <option value="">Select type…</option>
                    {BRANDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Target Completion Date</label>
                <input type="date" value={form.targetDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>
              <div>
                <label>Requirements / Description <span className={styles.req}>*</span></label>
                <textarea
                  rows={5} placeholder="Describe dimensions, material preferences, design guidelines, special instructions…"
                  value={form.requirements} onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))} required
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <h2 className={styles.sectionTitle}>Reference Attachments <span className={styles.optional}>(optional)</span></h2>
            <div
              {...getRootProps()}
              className={`${styles.dropzone} ${isDragActive ? styles.dragActive : ''}`}
            >
              <input {...getInputProps()} />
              <Upload size={28} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p className={styles.dropText}>{isDragActive ? 'Drop images here…' : 'Drag & drop or click to upload'}</p>
              <p className={styles.dropHint}>Up to 5 images, max 10MB each</p>
            </div>
            {files.length > 0 && (
              <div className={styles.fileList}>
                {files.map((file, i) => (
                  <div key={i} className={styles.fileItem}>
                    <img src={URL.createObjectURL(file)} alt="" className={styles.fileThumb} />
                    <span className={styles.fileName}>{file.name}</span>
                    <span className={styles.fileSize}>{(file.size / 1024).toFixed(0)}KB</span>
                    <button type="button" className={styles.removeFile} onClick={() => removeFile(i)}><X size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className={styles.col}>
          <div className="card">
            <h2 className={styles.sectionTitle}>Location Details</h2>
            <div className={styles.fields}>
              <div>
                <label>Full Address <span className={styles.req}>*</span></label>
                <textarea rows={2} placeholder="Street address, area…" value={form.location.address}
                  onChange={e => setLoc('address', e.target.value)} required style={{ resize: 'none' }} />
              </div>
              <div className="grid-2">
                <div>
                  <label>City <span className={styles.req}>*</span></label>
                  <input placeholder="e.g. Surat" value={form.location.city} onChange={e => setLoc('city', e.target.value)} required />
                </div>
                <div>
                  <label>State</label>
                  <select value={form.location.state} onChange={e => setLoc('state', e.target.value)}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div>
                  <label>Pincode</label>
                  <input placeholder="395006" maxLength={6} value={form.location.pincode}
                    onChange={e => setLoc('pincode', e.target.value)} />
                </div>
                <div>
                  <label>Landmark</label>
                  <input placeholder="Near…" value={form.location.landmark}
                    onChange={e => setLoc('landmark', e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Summary card */}
          <div className="card" style={{ background: 'var(--accent-dim)', border: '1px solid rgba(232,197,71,0.2)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 12 }}>📋 Workflow Overview</h3>
            {[
              { step: 1, label: 'MIS Team reviews & assigns to Recce' },
              { step: 2, label: 'Recce Team conducts site inspection' },
              { step: 3, label: 'Admin approves with budget' },
              { step: 4, label: 'Vendor executes & uploads completion' },
            ].map(({ step, label }) => (
              <div key={step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{ background: 'var(--accent)', color: '#0d0f1a', width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{step}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{label}</span>
              </div>
            ))}
          </div>

          <button type="submit" className="btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <><Send size={16} /> Submit Request</>}
          </button>
        </div>
      </form>
    </div>
  );
}
