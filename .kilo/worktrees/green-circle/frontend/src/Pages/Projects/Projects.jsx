import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import NewProjectModal from './NewProjectModal';
import ProjectPrintModal from './ProjectPrintModal';
import TechWalletModal from './TechWalletModal';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  // Modals
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isTechWalletOpen, setIsTechWalletOpen] = useState(false);
  const [printProject, setPrintProject] = useState(null);
  
  // Tech Prompt Modal State
  const [techPromptProject, setTechPromptProject] = useState(null);
  const [techResponseNote, setTechResponseNote] = useState('');

  // Incharge Confirm Modal State
  const [inchargeConfirmProject, setInchargeConfirmProject] = useState(null);
  const [inchargeNote, setInchargeNote] = useState('');

  // Progress Note Modal State
  const [progressProject, setProgressProject] = useState(null);
  const [newProgressNote, setNewProgressNote] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/projects`);
      if (res.ok) {
        const pData = await res.json();
        setProjects(pData.data || []);
      } else {
        setError('Failed to load projects');
      }
    } catch (err) {
      console.error(err);
      setError('Server error loading projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 1. Technician Respond (Accept / Decline)
  const handleTechRespond = async (action) => {
    if (!techPromptProject) return;
    try {
      const res = await fetch(`${API}/projects/${techPromptProject.id}/technician-respond`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, response_note: techResponseNote })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setTechPromptProject(null);
        setTechResponseNote('');
        loadData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 2. In-charge Confirmation
  const handleInchargeConfirm = async () => {
    if (!inchargeConfirmProject) return;
    try {
      const res = await fetch(`${API}/projects/${inchargeConfirmProject.id}/incharge-confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmed_by: 2, incharge_note: inchargeNote })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        setInchargeConfirmProject(null);
        setInchargeNote('');
        loadData();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 3. Add Progress Note
  const handleAddProgress = async () => {
    if (!progressProject || !newProgressNote.trim()) return;
    try {
      const res = await fetch(`${API}/projects/${progressProject.id}/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_note: newProgressNote, status: 'in_progress' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('কাজের অগ্রগতি আপডেট হয়েছে!');
        setProgressProject(null);
        setNewProgressNote('');
        loadData();
      } else {
        alert(data.message || 'Failed to update progress');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 4. Complete Project & Auto-credit Wallet
  const handleCompleteProject = async (project) => {
    const totalPayout = Number(project.setup_charge || 0) + Number(project.conveyance_cost || 0) + Number(project.meal_allowance || 0) || Number(project.charges || 0);
    const confirmMsg = `আপনি কি নিশ্চিত যে কাজ সম্পন্ন হয়েছে?\n\nটেকনিশিয়ান (${project.technician_name})-এর ওয়ালেটে মোট ৳ ${totalPayout.toLocaleString('en-IN')} (সেটাপ + যাতায়াত + মিল) স্বয়ংক্রিয়ভাবে জমা হবে।`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`${API}/projects/${project.id}/complete`, {
        method: 'PUT'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(data.message);
        loadData();
      } else {
        alert(data.message || 'Failed to complete project');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // 5. Delete Project
  const handleDeleteProject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      const res = await fetch(`${API}/projects/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert('Failed to delete');
      }
    } catch (err) {
      console.error(err);
      alert('Server error');
    }
  };

  // Pipeline Counts
  const counts = useMemo(() => {
    return {
      all: projects.length,
      assigned: projects.filter(p => p.technician_status === 'assigned' || p.status === 'assigned').length,
      accepted: projects.filter(p => p.technician_status === 'accepted' || p.status === 'awaiting_incharge_confirmation').length,
      in_progress: projects.filter(p => p.technician_status === 'in_progress' || p.status === 'in_progress').length,
      completed: projects.filter(p => p.status === 'completed').length
    };
  }, [projects]);

  // Filtered list
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch =
        (p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.project_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.technician_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.invoice_no || '').toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (stageFilter === 'all') return true;
      if (stageFilter === 'assigned') return p.technician_status === 'assigned' || p.status === 'assigned';
      if (stageFilter === 'accepted') return p.technician_status === 'accepted' || p.status === 'awaiting_incharge_confirmation';
      if (stageFilter === 'in_progress') return p.technician_status === 'in_progress' || p.status === 'in_progress';
      if (stageFilter === 'completed') return p.status === 'completed';

      return true;
    });
  }, [projects, searchQuery, stageFilter]);

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1.5px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.3rem' }}>📹</span>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Projects & Services (ক্যামেরা সেটাপ ও সার্ভিসিং)
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsTechWalletOpen(true)}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              padding: '5px 12px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>💼</span>
            <span>টেকনিশিয়ান ওয়ালেট</span>
          </button>

          <button
            onClick={() => setIsNewProjectOpen(true)}
            style={{
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
            }}
          >
            <span>+</span>
            <span>নতুন প্রজেক্ট / সার্ভিস</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '8px 12px', background: '#fee2e2', color: '#b91c1c', borderRadius: '6px', marginBottom: '10px', fontSize: '0.82rem' }}>
          {error}
        </div>
      )}

      {/* PIPELINE STAGE METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', marginBottom: '10px' }}>
        <div
          onClick={() => setStageFilter('all')}
          style={{
            background: stageFilter === 'all' ? '#eff6ff' : '#ffffff',
            border: stageFilter === 'all' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Projects</span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', color: '#0f172a', fontWeight: 800 }}>{counts.all}</h3>
          <small style={{ color: '#64748b', fontSize: '0.7rem' }}>সকল রেকর্ড</small>
        </div>

        <div
          onClick={() => setStageFilter('assigned')}
          style={{
            background: stageFilter === 'assigned' ? '#fefce8' : '#ffffff',
            border: stageFilter === 'assigned' ? '2px solid #eab308' : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#854d0e', textTransform: 'uppercase', fontWeight: 700 }}>1. একসেপ্টের অপেক্ষায়</span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', color: '#ca8a04', fontWeight: 800 }}>{counts.assigned}</h3>
          <small style={{ color: '#854d0e', fontSize: '0.7rem' }}>প্রম্পট পাঠানো</small>
        </div>

        <div
          onClick={() => setStageFilter('accepted')}
          style={{
            background: stageFilter === 'accepted' ? '#eff6ff' : '#ffffff',
            border: stageFilter === 'accepted' ? '2px solid #3b82f6' : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#1e40af', textTransform: 'uppercase', fontWeight: 700 }}>2. অনুমোদন প্রয়োজন</span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', color: '#2563eb', fontWeight: 800 }}>{counts.accepted}</h3>
          <small style={{ color: '#1e40af', fontSize: '0.7rem' }}>একসেপ্টেড</small>
        </div>

        <div
          onClick={() => setStageFilter('in_progress')}
          style={{
            background: stageFilter === 'in_progress' ? '#f0fdf4' : '#ffffff',
            border: stageFilter === 'in_progress' ? '2px solid #16a34a' : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#166534', textTransform: 'uppercase', fontWeight: 700 }}>3. কাজ চলমান</span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', color: '#15803d', fontWeight: 800 }}>{counts.in_progress}</h3>
          <small style={{ color: '#166534', fontSize: '0.7rem' }}>In Progress</small>
        </div>

        <div
          onClick={() => setStageFilter('completed')}
          style={{
            background: stageFilter === 'completed' ? '#faf5ff' : '#ffffff',
            border: stageFilter === 'completed' ? '2px solid #9333ea' : '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '8px 12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <span style={{ fontSize: '0.7rem', color: '#6b21a8', textTransform: 'uppercase', fontWeight: 700 }}>4. সম্পন্ন ও পেইড</span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0 0', color: '#7e22ce', fontWeight: 800 }}>{counts.completed}</h3>
          <small style={{ color: '#6b21a8', fontSize: '0.7rem' }}>ওয়ালেট ক্রেডিটেড</small>
        </div>
      </div>

      {/* SEARCH & FILTER CONTROLS */}
      <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <input
          type="text"
          placeholder="সার্চ করুন: প্রজেক্ট কোড, টাইটেল, কাস্টমার, ইনভয়েস নং, টেকনিশিয়ান..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '100%', maxWidth: '360px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
        />

        <div style={{ display: 'flex', gap: '6px' }}>
          {['all', 'assigned', 'accepted', 'in_progress', 'completed'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStageFilter(st)}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: stageFilter === st ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: stageFilter === st ? '#eff6ff' : '#ffffff',
                color: stageFilter === st ? '#1d4ed8' : '#64748b',
                fontSize: '0.75rem',
                fontWeight: stageFilter === st ? 700 : 500,
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* PROJECTS LIST TABLE */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>প্রজেক্ট ডাটা লোড হচ্ছে...</p>
        ) : filteredProjects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📋</div>
            <p style={{ margin: 0, fontWeight: 600 }}>কোনো প্রজেক্ট বা সার্ভিস পাওয়া যায়নি।</p>
            <small>উপরের "+ নতুন সেটাপ / সার্ভিস এন্ট্রি" বাটনে ক্লিক করে কাজ তৈরি করুন।</small>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                  <th style={{ padding: '12px 14px' }}>প্রজেক্ট ও সোর্স</th>
                  <th style={{ padding: '12px 14px' }}>কাস্টমার ও সাইট</th>
                  <th style={{ padding: '12px 14px' }}>অ্যাসাইনড টেকনিশিয়ান</th>
                  <th style={{ padding: '12px 14px' }}>পারিশ্রমিক ব্রেকডাউন</th>
                  <th style={{ padding: '12px 14px' }}>কাস্টমার বিল</th>
                  <th style={{ padding: '12px 14px' }}>স্ট্যাটাস পাইপলাইন</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>একশন</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map(p => {
                  const setup = parseFloat(p.setup_charge || 0);
                  const conv = parseFloat(p.conveyance_cost || 0);
                  const meal = parseFloat(p.meal_allowance || 0);
                  const totalTechPayout = setup + conv + meal > 0 ? (setup + conv + meal) : parseFloat(p.charges || 0);
                  const customerBill = parseFloat(p.customer_billing_amount || 0);

                  const isAssigned = p.technician_status === 'assigned' || p.status === 'assigned';
                  const isAccepted = p.technician_status === 'accepted' || p.status === 'awaiting_incharge_confirmation';
                  const isInProgress = p.technician_status === 'in_progress' || p.status === 'in_progress';
                  const isCompleted = p.status === 'completed';

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                      {/* Project & Source */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            background: p.invoice_id ? '#eff6ff' : '#fef3c7',
                            color: p.invoice_id ? '#1e40af' : '#92400e'
                          }}>
                            {p.invoice_id ? '📦 নতুন সেটাপ' : '🔧 পুরাতন রিপেয়ার'}
                          </span>
                          <strong style={{ color: '#0f172a' }}>{p.project_code}</strong>
                        </div>
                        <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.86rem' }}>{p.title}</div>
                        {p.invoice_no && (
                          <div style={{ fontSize: '0.74rem', color: '#2563eb', marginTop: '2px' }}>
                            ইনভয়েস: <strong>{p.invoice_no}</strong>
                          </div>
                        )}
                        {p.equipment_details && Array.isArray(p.equipment_details) && p.equipment_details.length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>
                            ডিভাইস: {p.equipment_details.map(it => `${it.product_name} (${it.quantity})`).join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Customer & Site */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <strong style={{ color: '#0f172a' }}>{p.customer_name}</strong>
                        {p.site_phone && (
                          <div>
                            <a
                              href={`tel:${p.site_phone}`}
                              style={{ color: '#16a34a', textDecoration: 'none', fontWeight: 600, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              📞 {p.site_phone}
                            </a>
                          </div>
                        )}
                        {p.site_address && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', maxWidth: '200px' }}>
                            📍 {p.site_address}
                          </div>
                        )}
                      </td>

                      {/* Technician */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>👷</span>
                          <strong style={{ color: '#1e293b' }}>{p.technician_name}</strong>
                        </div>
                        {p.technician_contact && (
                          <small style={{ color: '#64748b', fontSize: '0.72rem' }}>{p.technician_contact}</small>
                        )}
                        {p.admin_confirmed && (
                          <div style={{ fontSize: '0.7rem', color: '#16a34a', marginTop: '3px', fontWeight: 600 }}>
                            ✓ ইনচার্জ অনুমোদিত
                          </div>
                        )}
                      </td>

                      {/* Remuneration Breakdown */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <div style={{ fontWeight: 800, color: '#2563eb', fontSize: '0.95rem' }}>
                          ৳ {totalTechPayout.toLocaleString('en-IN')}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                          <span>সেটাপ ফি: ৳{setup}</span>
                          <span>যাতায়াত: ৳{conv}</span>
                          <span>মিল ভাতা: ৳{meal}</span>
                        </div>
                      </td>

                      {/* Customer Bill */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        <strong style={{ color: '#16a34a', fontSize: '0.92rem' }}>
                          ৳ {customerBill.toLocaleString('en-IN')}
                        </strong>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>ধার্যকৃত সার্ভিস বিল</div>
                      </td>

                      {/* Pipeline Status */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top' }}>
                        {isCompleted ? (
                          <span style={{ background: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✓ সম্পন্ন ও পেইড
                          </span>
                        ) : isInProgress ? (
                          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ⏳ কাজ চলমান
                          </span>
                        ) : isAccepted ? (
                          <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            🔵 টেক একসেপ্ট করেছে
                          </span>
                        ) : (
                          <span style={{ background: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            🟡 একসেপ্টের অপেক্ষায়
                          </span>
                        )}

                        {p.progress_note && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '6px', maxWidth: '200px', whiteSpace: 'pre-line' }}>
                            {p.progress_note.slice(-80)}...
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px', verticalAlign: 'top', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
                          {/* 1. If assigned: Technician Accept Prompt */}
                          {isAssigned && (
                            <button
                              type="button"
                              onClick={() => setTechPromptProject(p)}
                              style={{
                                padding: '5px 10px',
                                background: '#fef08a',
                                color: '#854d0e',
                                border: '1px solid #facc15',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              📲 টেক একসেপ্ট প্রম্পট
                            </button>
                          )}

                          {/* 2. If accepted: In-charge Confirm Handover */}
                          {isAccepted && (
                            <button
                              type="button"
                              onClick={() => setInchargeConfirmProject(p)}
                              style={{
                                padding: '5px 10px',
                                background: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                boxShadow: '0 2px 4px rgba(37,99,235,0.3)'
                              }}
                            >
                              🛡️ ইনচার্জ কনফার্মেশন
                            </button>
                          )}

                          {/* 3. If in progress: Add Note & Complete */}
                          {isInProgress && (
                            <>
                              <button
                                type="button"
                                onClick={() => setProgressProject(p)}
                                style={{
                                  padding: '4px 8px',
                                  background: '#f1f5f9',
                                  color: '#334155',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                📝 নোট যোগ করুন
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCompleteProject(p)}
                                style={{
                                  padding: '5px 10px',
                                  background: '#16a34a',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 2px 4px rgba(22,163,74,0.3)'
                                }}
                              >
                                🏁 সম্পন্ন ও ওয়ালেট পে
                              </button>
                            </>
                          )}

                          {/* Print Job Card */}
                          <button
                            type="button"
                            onClick={() => setPrintProject(p)}
                            style={{
                              padding: '4px 8px',
                              background: '#f8fafc',
                              color: '#0f172a',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              whiteSpace: 'nowrap'
                            }}
                            title="জব কার্ড ও সার্ভিস স্লিপ প্রিন্ট করুন"
                          >
                            🖨️ প্রিন্ট জব কার্ড
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProject(p.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#94a3b8',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              padding: '2px 4px'
                            }}
                            title="মুছে ফেলুন"
                          >
                            🗑️ ডিলিট
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW PROJECT ENTRY MODAL */}
      <NewProjectModal
        isOpen={isNewProjectOpen}
        onClose={() => setIsNewProjectOpen(false)}
        onSuccess={loadData}
      />

      {/* TECHNICIAN ACCEPTANCE PROMPT SIMULATION MODAL */}
      {techPromptProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              📲 টেকনিশিয়ান একসেপ্ট প্রম্পট (Technician Job Notification)
            </h3>
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px', fontSize: '0.84rem' }}>
              <div>কাজ: <strong>{techPromptProject.title}</strong></div>
              <div>সাইট ঠিকানা: <strong>{techPromptProject.site_address || 'Not specified'}</strong></div>
              <div style={{ marginTop: '6px', color: '#2563eb', fontWeight: 700 }}>
                পারিশ্রমিক: সেটাপ ৳{techPromptProject.setup_charge} + যাতায়াত ৳{techPromptProject.conveyance_cost} + মিল ৳{techPromptProject.meal_allowance} = ৳{Number(techPromptProject.setup_charge || 0) + Number(techPromptProject.conveyance_cost || 0) + Number(techPromptProject.meal_allowance || 0)}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                টেকনিশিয়ানের রিপ্লাই নোট (ঐচ্ছিক):
              </label>
              <input
                type="text"
                placeholder="যেমন: কাল সকাল ১০টায় সাইটে আসব..."
                value={techResponseNote}
                onChange={(e) => setTechResponseNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setTechPromptProject(null)}
                style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleTechRespond('decline')}
                style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 600, cursor: 'pointer' }}
              >
                প্রত্যাখ্যান (Decline)
              </button>
              <button
                type="button"
                onClick={() => handleTechRespond('accept')}
                style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                ✓ গ্রহণ করুন (Accept Job)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INCHARGE CONFIRMATION MODAL */}
      {inchargeConfirmProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '480px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
              🛡️ সেটাপ ইনচার্জ চূড়ান্ত অনুমোদন (In-charge Handover Approval)
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#475569', margin: '0 0 12px' }}>
              টেকনিশিয়ান কাজ গ্রহণ করেছেন। ইনচার্জ অনুমোদন দিলে টেকনিশিয়ান সাইটে গিয়ে কাজ শুরু করতে পারবে।
            </p>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                ইনচার্জ অনুমোদন নোট:
              </label>
              <input
                type="text"
                placeholder="যেমন: কাস্টমারকে ইনফর্ম করা হয়েছে, কাজ শুরু অনুমোদন দেওয়া হলো..."
                value={inchargeNote}
                onChange={(e) => setInchargeNote(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.84rem', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setInchargeConfirmProject(null)}
                style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleInchargeConfirm}
                style={{ padding: '7px 18px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                ✓ চূড়ান্ত অনুমোদন দিন (Confirm Handover)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROGRESS NOTE MODAL */}
      {progressProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 10001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '440px', padding: '20px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
              📝 কাজের অগ্রগতি নোট যোগ করুন
            </h3>
            <textarea
              rows="3"
              placeholder="যেমন: সাইটে পৌঁছেছি, ৪টি ক্যামেরা ক্যাবলিং শেষ, DVR কনফিগ চলছে..."
              value={newProgressNote}
              onChange={(e) => setNewProgressNote(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box', marginBottom: '14px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setProgressProject(null)}
                style={{ padding: '7px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleAddProgress}
                style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROJECT PRINT MODAL (JOBCARD / THERMAL) */}
      <ProjectPrintModal
        isOpen={!!printProject}
        onClose={() => setPrintProject(null)}
        project={printProject}
      />

      {/* TECHNICIAN WALLET & CASHOUT MODAL */}
      <TechWalletModal
        isOpen={isTechWalletOpen}
        onClose={() => setIsTechWalletOpen(false)}
        onRefreshProjects={loadData}
      />
    </div>
  );
}
