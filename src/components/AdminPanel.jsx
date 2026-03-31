import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  LogOut, RefreshCw, CheckCircle, XCircle, Clock, Eye,
  ChevronDown, ChevronUp, AlertTriangle, Shield, Users, X
} from 'lucide-react';

const OWNER_DISCORD_ID = '826637667718266880';

const STATUS_CONFIG = {
  pending:      { label: 'Pendiente',    color: '#f39c12', bg: 'rgba(243,156,18,0.12)'  },
  under_review: { label: 'En revisión',  color: '#3498db', bg: 'rgba(52,152,219,0.12)'  },
  approved:     { label: 'Aprobado',     color: '#2ecc71', bg: 'rgba(46,204,113,0.12)'  },
  rejected:     { label: 'Rechazado',    color: '#E63946', bg: 'rgba(230,57,70,0.12)'   },
};

const SCORE_COLOR = (score) =>
  score >= 27 ? '#2ecc71' : score >= 22 ? '#3498db' : score >= 18 ? '#e67e22' : '#E63946';

const PART_I_ANSWERS = [1,2,1,2,1,3,0,2,1,0,1,2,1,2,2,1,1,3,2];

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, borderRadius: '20px', padding: '0.2rem 0.65rem', fontSize: '0.73rem', fontWeight: 700, border: `1px solid ${cfg.color}44` }}>
      {cfg.label}
    </span>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem 1.25rem', border: `1px solid ${color}33`, flex: 1, minWidth: '120px' }}>
      <div style={{ color, marginBottom: '0.4rem' }}>{icon}</div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{label}</div>
    </div>
  );
}

// ── Modal detalle de postulación ────────────────────────────
function AppModal({ app, onClose, onUpdateStatus }) {
  const [note, setNote]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [expanded, setExpanded] = useState({ p1: false, p2: true, p3: true });

  const toggle = (k) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  const updateStatus = async (newStatus) => {
    setLoading(true);
    const { error } = await supabase.from('staff_applications').update({
      status: newStatus,
      reviewed_by: OWNER_DISCORD_ID,
      reviewed_by_username: 'vonssyb',
      reviewed_at: new Date().toISOString(),
      review_notes: note || null,
    }).eq('id', app.id);
    setLoading(false);
    if (!error) { onUpdateStatus(app.id, newStatus); onClose(); }
    else alert('Error: ' + error.message);
  };

  const p1Answers = app.part1_answers || {};
  const p2Answers = app.part2_answers || {};
  const p3Answers = app.part3_answers || {};
  const p3Times   = app.part3_times  || {};
  const suspicious = app.suspicious_flags || [];

  const PART_I_Q = ["¿Qué significa IRL-X?","Usar información vista en Discord dentro del rol es:","¿Cuál de estas acciones es SCN?","Arrestar a un jugador sin rol previo se considera:","¿Cuándo es válido un MD IC?","¿Cuál es una falta grave automática?","Cuando un jugador salta (BH) constantemente es:","¿Qué ocurre si alguien usa un bug para atravesar paredes?","Tomar un rango sin proceso previo es:","Matar sin rol ni motivo corresponde a:","¿Qué recuerda un jugador tras un PK (MVP)?","¿Qué implica un CK?","Un EMS en servicio puede recibir CK:","¿Quién puede realizar crímenes de alto riesgo?","Un secuestro es válido cuando:","Un golpe de estado IC requiere:","Arrestar legalmente requiere:","¿Se puede detener una escena para reportar?","¿Qué pasa cuando un mod entra con :view?"];
  const PART_II_Q = ["¿Cuándo aplicarías un CK forzado como staff?","¿Qué diferencia hay entre IRL-X y EXR?","¿Cuándo se justifica una Blacklist total (BL-T)?","¿Por qué no se deben imponer acciones en el rol?","¿Qué valores debe tener un buen staff de Nación MX RP?"];
  const PART_III_Q = ["10 peces, 5 se ahogan. ¿Cuántos quedan?","Un avión cae en la frontera. ¿Dónde entierran a los sobrevivientes?","¿Cuántas letras 'R' tiene 'PIRATA'?","Sandía de 10kg sobre papel bond flotando. ¿Qué pasa al soltarla?","2 madres y 2 hijas, 3 cafés, todas reciben uno. ¿Cómo?","Hombre calvo bajo la lluvia. ¿Se moja el pelo?"];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0f0f14', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', width: '100%', maxWidth: '680px', maxHeight: '88vh', overflowY: 'auto', padding: '1.5rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.25rem' }}>@{app.discord_username}</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Badge status={app.status} />
              {app.roblox_username && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Roblox: @{app.roblox_username}</span>}
              <span style={{ fontSize: '0.75rem', color: SCORE_COLOR(app.auto_score || 0) }}>
                {app.score_label} ({app.auto_score || 0}/25)
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#adb5bd' }}><X size={22}/></button>
        </div>

        {/* Puntajes */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[['Parte I', `${app.score_part1 || 0}/19`, '#5865F2'], ['Auto-Total', `${app.auto_score || 0}/25`, SCORE_COLOR(app.auto_score||0)], ['Sospechosas', suspicious.length, suspicious.length ? '#f39c12' : 'var(--text-muted)']].map(([lbl, val, col]) => (
            <div key={lbl} style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.65rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontWeight: 700, color: col, fontSize: '1.1rem' }}>{val}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lbl}</div>
            </div>
          ))}
        </div>

        {/* Parte I */}
        <div style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
          <button onClick={() => toggle('p1')} style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(88,101,242,0.08)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Parte I — Opción Múltiple ({app.score_part1 || 0}/19)</span>
            {expanded.p1 ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
          {expanded.p1 && (
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {PART_I_Q.map((q, i) => {
                const qId = i + 1;
                const ans = p1Answers[qId];
                const correct = ans === PART_I_ANSWERS[i];
                return (
                  <div key={qId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ color: correct ? '#2ecc71' : '#E63946', flexShrink: 0 }}>{correct ? '✓' : '✗'}</span>
                    <span style={{ color: 'var(--text-muted)', flex: 1 }}>P{qId}: {q.substring(0, 45)}{q.length > 45 ? '...' : ''}</span>
                    <span style={{ color: correct ? '#2ecc71' : '#E63946', fontWeight: 600 }}>
                      {ans !== undefined ? ['A','B','C','D'][ans] : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Parte II */}
        <div style={{ marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
          <button onClick={() => toggle('p2')} style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(230,57,70,0.07)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Parte II — Respuestas Abiertas</span>
            {expanded.p2 ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
          {expanded.p2 && (
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {PART_II_Q.map((q, i) => {
                const qId = i + 20;
                return (
                  <div key={qId}>
                    <div style={{ fontSize: '0.73rem', color: 'var(--nmx-red)', fontWeight: 600, marginBottom: '0.2rem' }}>P{qId}: {q}</div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '6px', padding: '0.55rem 0.75rem', fontSize: '0.84rem', lineHeight: 1.5, color: p2Answers[qId] ? '#fff' : 'var(--text-muted)', fontStyle: p2Answers[qId] ? 'normal' : 'italic' }}>
                      {p2Answers[qId] || 'Sin respuesta'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Parte III */}
        <div style={{ marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
          <button onClick={() => toggle('p3')} style={{ width: '100%', padding: '0.75rem 1rem', background: 'rgba(243,156,18,0.07)', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Parte III — Anti-IA ⚡</span>
            {expanded.p3 ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
          {expanded.p3 && (
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {PART_III_Q.map((q, i) => {
                const qId = i + 25;
                const time = p3Times[qId];
                const isSusp = suspicious.includes(qId);
                return (
                  <div key={qId} style={{ display: 'flex', gap: '0.75rem', padding: '0.45rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0 }}>
                      {isSusp ? <AlertTriangle size={14} color="#f39c12"/> : <CheckCircle size={14} color="#2ecc71"/>}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.15rem' }}>P{qId}: {q}</div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{p3Answers[qId] || <em style={{ color: 'var(--text-muted)' }}>Sin respuesta</em>}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: isSusp ? '#f39c12' : '#2ecc71', fontWeight: 600, flexShrink: 0 }}>
                      {time ? `${time}s` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Acciones */}
        {app.status === 'pending' || app.status === 'under_review' ? (
          <div>
            <textarea value={note} onChange={e => setNote(e.target.value)} className="form-textarea" placeholder="Notas internas (opcional)..." style={{ minHeight: '70px', marginBottom: '0.75rem' }}/>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={() => updateStatus('approved')} disabled={loading}>
                <CheckCircle size={16}/> {loading ? 'Guardando...' : 'Aprobar'}
              </button>
              <button className="btn" style={{ flex: 1, background: 'rgba(230,57,70,0.15)', color: '#E63946', border: '1px solid rgba(230,57,70,0.4)' }} onClick={() => updateStatus('rejected')} disabled={loading}>
                <XCircle size={16}/> {loading ? 'Guardando...' : 'Rechazar'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            Revisado · {app.review_notes && <em>"{app.review_notes}"</em>}
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ── Panel principal ─────────────────────────────────────────
export default function AdminPanel({ user, onSignOut }) {
  const discordId    = user.identities?.find(i => i.provider === 'discord')?.id;
  const isOwner      = discordId === OWNER_DISCORD_ID;

  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [selected, setSelected] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('staff_applications')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setApps(data || []);
    setLoading(false);
  };

  useEffect(() => { if (isOwner) fetchApplications(); }, [isOwner]);

  const onUpdateStatus = (id, newStatus) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  if (!isOwner) return (
    <div className="glass-panel text-center" style={{ maxWidth: '440px', margin: '2rem auto' }}>
      <Shield size={56} color="var(--nmx-red)" style={{ margin: '0 auto 1rem' }} />
      <h2>Acceso Denegado</h2>
      <p>No tienes permisos para ver esta página.</p>
      <button className="btn btn-secondary" onClick={onSignOut}><LogOut size={16}/> Salir</button>
    </div>
  );

  const stats = {
    total:    apps.length,
    pending:  apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? apps : apps.filter(a => a.status === filter);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.2rem' }}>🛡️ Panel de Administrador</h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Postulaciones Staff · NaciónMX RP</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }} onClick={fetchApplications} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spinning' : ''}/> Actualizar
          </button>
          <button className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.85rem' }} onClick={onSignOut}>
            <LogOut size={14}/> Salir
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard icon={<Users size={20}/>} label="Total" value={stats.total} color="#5865F2" />
        <StatCard icon={<Clock size={20}/>} label="Pendientes" value={stats.pending} color="#f39c12" />
        <StatCard icon={<CheckCircle size={20}/>} label="Aprobados" value={stats.approved} color="#2ecc71" />
        <StatCard icon={<XCircle size={20}/>} label="Rechazados" value={stats.rejected} color="#E63946" />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {[['all','Todos'],['pending','Pendientes'],['approved','Aprobados'],['rejected','Rechazados']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: '0.4rem 0.9rem', borderRadius: '20px', border: '1px solid', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', borderColor: filter === val ? 'var(--nmx-red)' : 'rgba(255,255,255,0.12)', background: filter === val ? 'rgba(230,57,70,0.15)' : 'transparent', color: filter === val ? 'var(--nmx-red)' : 'var(--text-muted)' }}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>⏳ Cargando postulaciones...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No hay postulaciones {filter !== 'all' ? `con estado "${filter}"` : ''}.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filtered.map(app => (
            <motion.div key={app.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1rem 1.25rem', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'border-color 0.2s' }}
              onClick={() => setSelected(app)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(230,57,70,0.35)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
            >
              {/* Avatar placeholder */}
              <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(88,101,242,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem', fontWeight: 700, color: '#5865F2' }}>
                {(app.discord_username?.[0] || '?').toUpperCase()}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  @{app.discord_username}
                  {app.roblox_username && <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.82rem', marginLeft: '0.5rem' }}>· Roblox: {app.roblox_username}</span>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <Badge status={app.status} />
                  {app.suspicious_flags?.length > 0 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', color: '#f39c12' }}>
                      <AlertTriangle size={11}/> {app.suspicious_flags.length} sospechosa(s)
                    </span>
                  )}
                </div>
              </div>

              {/* Score */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: SCORE_COLOR(app.auto_score || 0) }}>
                  {app.auto_score || 0}/25
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{app.score_label || '—'}</div>
              </div>

              {/* Date */}
              <div style={{ textAlign: 'right', flexShrink: 0, minWidth: '80px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(app.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--nmx-red)', marginTop: '0.2rem' }}>
                  <Eye size={12}/> Ver
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <AppModal app={selected} onClose={() => setSelected(null)} onUpdateStatus={onUpdateStatus} />
        )}
      </AnimatePresence>

      <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
