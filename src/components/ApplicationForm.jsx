import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, User, ClipboardList, ShieldCheck, CheckCircle2, LogOut, Search, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExamSection from './ExamSection';

const STEPS = [
  { id: 1, title: 'Requisitos', icon: <ShieldCheck size={20} /> },
  { id: 2, title: 'Roblox', icon: <User size={20} /> },
  { id: 3, title: 'Examen', icon: <ClipboardList size={20} /> },
  { id: 4, title: 'Finalizar', icon: <Check size={20} /> }
];

function getDiscordAccountAgeDays(discordId) {
  try {
    const snowflake = BigInt(discordId);
    const createdAt = new Date(Number(snowflake >> 22n) + 1420070400000);
    const days = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return { days, createdAt };
  } catch {
    return { days: 0, createdAt: null };
  }
}

const SCORE_LABELS = [
  { min: 27, label: '⭐ Excelencia', color: '#2ecc71', result: 'pass' },
  { min: 22, label: 'Entrenamiento', color: '#3498db', result: 'training' },
  { min: 18, label: 'A prueba', color: '#e67e22', result: 'probation' },
  { min: 0,  label: 'Rechazado', color: '#E63946', result: 'rejected' },
];

function getScoreLabel(score) {
  return SCORE_LABELS.find(s => score >= s.min) || SCORE_LABELS[SCORE_LABELS.length - 1];
}

export default function ApplicationForm({ user }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [examData, setExamData] = useState(null);

  // Roblox
  const [robloxVerifying, setRobloxVerifying] = useState(false);
  const [robloxUser, setRobloxUser] = useState(null);
  const [robloxError, setRobloxError] = useState('');

  const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const discordId = user.identities?.find(i => i.provider === 'discord')?.id || '0';
  const { days: accountAgeDays, createdAt } = getDiscordAccountAgeDays(discordId);
  const meetsTimeReq = accountAgeDays >= 5;

  const [formData, setFormData] = useState({
    req_age: false,
    req_time: meetsTimeReq,
    req_mic: false,
    roblox_username: '',
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, req_time: meetsTimeReq }));
  }, [meetsTimeReq]);

  const updateForm = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'roblox_username') { setRobloxUser(null); setRobloxError(''); }
  };

  const verifyRoblox = async () => {
    if (!formData.roblox_username.trim()) return;
    setRobloxVerifying(true);
    setRobloxUser(null);
    setRobloxError('');
    try {
      // Endpoint de búsqueda GET que soporta CORS desde browsers
      const encoded = encodeURIComponent(formData.roblox_username.trim());
      const res = await fetch(
        `https://users.roblox.com/v1/users/search?keyword=${encoded}&limit=10`,
        { method: 'GET', headers: { 'Accept': 'application/json' } }
      );
      if (!res.ok) throw new Error('api_error');
      const data = await res.json();

      // Buscar coincidencia exacta (case-insensitive)
      const exact = data.data?.find(
        u => u.name.toLowerCase() === formData.roblox_username.trim().toLowerCase()
      );

      if (!exact) {
        setRobloxError('Usuario no encontrado en Roblox. El nombre debe ser exacto, incluyendo mayúsculas.');
        return;
      }

      // Intentar avatar (puede fallar por CORS, es opcional)
      let avatarUrl = null;
      try {
        const avRes = await fetch(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${exact.id}&size=150x150&format=Png`,
          { method: 'GET' }
        );
        if (avRes.ok) {
          const avData = await avRes.json();
          avatarUrl = avData.data?.[0]?.imageUrl || null;
        }
      } catch { /* avatar es decorativo, no crítico */ }

      setRobloxUser({ id: exact.id, name: exact.name, displayName: exact.displayName, avatarUrl });
    } catch { setRobloxError('Error al contactar Roblox. Intenta de nuevo en un momento.'); }
    finally { setRobloxVerifying(false); }
  };

  const handleExamComplete = (data) => {
    setExamData(data);
    setStep(4);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const scoreLabel = getScoreLabel(examData?.autoScore || 0);
      const { error } = await supabase
        .from('staff_applications')
        .insert([{
          discord_username: discordUsername,
          discord_id: discordId,
          roblox_username: robloxUser?.name || formData.roblox_username,
          roblox_id: robloxUser?.id || null,
          part1_answers: examData?.p1Answers || {},
          part2_answers: examData?.p2Answers || {},
          part3_answers: examData?.p3Answers || {},
          part3_times: examData?.p3Times || {},
          score_part1: examData?.scorePartI || 0,
          auto_score: examData?.autoScore || 0,
          score_label: scoreLabel.label,
          score_result: scoreLabel.result,
          suspicious_flags: examData?.suspiciousFlags || [],
          status: 'pending'
        }]);

      if (error) { alert('Error al guardar: ' + error.message); return; }
      setCompleted(true);
    } catch (err) { alert('Error de conexión.'); }
    finally { setSubmitting(false); }
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const canGoNext = () => {
    if (step === 1) return formData.req_age && formData.req_time && formData.req_mic;
    if (step === 2) return robloxUser !== null;
    return true;
  };

  const variants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  if (completed) {
    const label = getScoreLabel(examData?.autoScore || 0);
    return (
      <motion.div className="glass-panel text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <CheckCircle2 size={80} color={label.color} style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: label.color, marginBottom: '0.5rem' }}>¡Examen Enviado!</h2>
        <p className="mb-4">La postulación oficial de <strong>@{discordUsername}</strong> (Roblox: <strong>{robloxUser?.name}</strong>) fue enviada al equipo de NaciónMX. Recibirás respuesta pronto.</p>
        <button className="btn btn-secondary" onClick={signOut}><LogOut size={18} /> Cerrar Sesión</button>
      </motion.div>
    );
  }

  return (
    <div className="glass-panel relative overflow-hidden">
      <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
        <button onClick={signOut} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#adb5bd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LogOut size={14} /> Salir
        </button>
      </div>

      {/* Steps - ocultar en paso 3 para dar más espacio al examen */}
      {step !== 3 && (
        <div className="steps-indicator" style={{ marginTop: '1rem' }}>
          {STEPS.map((s) => (
            <div key={s.id} className={`step-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
              <div className="step-circle">{step > s.id ? <Check size={18} /> : s.id}</div>
              <span className="step-label">{s.title}</span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} variants={variants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>

          {/* ── PASO 1: REQUISITOS ── */}
          {step === 1 && (
            <div>
              <h3>Requisitos Mínimos</h3>
              <p className="mb-4">Hola <strong>{discordUsername}</strong>. Confirma los siguientes requisitos para avanzar.</p>

              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                <input type="checkbox" name="req_age" checked={formData.req_age} onChange={updateForm} style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)', flexShrink: 0 }} />
                <span className="form-label">Tengo 15 años o más.</span>
              </label>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem', background: meetsTimeReq ? 'rgba(46,204,113,0.08)' : 'rgba(230,57,70,0.08)', border: `1px solid ${meetsTimeReq ? 'rgba(46,204,113,0.3)' : 'rgba(230,57,70,0.3)'}` }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, background: meetsTimeReq ? 'var(--nmx-green)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {meetsTimeReq && <Check size={14} color="white" />}
                </div>
                <div>
                  <span className="form-label" style={{ color: meetsTimeReq ? 'var(--nmx-green)' : 'var(--nmx-red)', display: 'block' }}>
                    {meetsTimeReq ? '✓ Antigüedad verificada automáticamente' : '✗ Cuenta muy nueva'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Mi cuenta de Discord tiene al menos 5 días.
                    {createdAt && ` (Creada: ${createdAt.toLocaleDateString('es-MX')} · ${accountAgeDays} días)`}
                  </span>
                </div>
              </div>

              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                <input type="checkbox" name="req_mic" checked={formData.req_mic} onChange={updateForm} style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)', flexShrink: 0 }} />
                <span className="form-label">Cuento con un micrófono claro y funcional.</span>
              </label>
            </div>
          )}

          {/* ── PASO 2: ROBLOX ── */}
          {step === 2 && (
            <div>
              <h3>Verificación de Roblox</h3>
              <p className="mb-4">Ingresa tu nombre de usuario exacto de Roblox para confirmar tu identidad en la plataforma ERLC.</p>

              <div className="form-group">
                <label className="form-label">Roblox Username</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-input" placeholder="TuNombreEnRoblox" name="roblox_username" value={formData.roblox_username} onChange={updateForm} style={{ flex: 1 }} onKeyDown={(e) => e.key === 'Enter' && verifyRoblox()} />
                  <button className="btn btn-primary" onClick={verifyRoblox} disabled={robloxVerifying || !formData.roblox_username.trim()} style={{ flexShrink: 0 }}>
                    {robloxVerifying ? <Loader size={18} className="spinning" /> : <Search size={18} />}
                    {robloxVerifying ? 'Buscando...' : 'Verificar'}
                  </button>
                </div>
              </div>

              {robloxError && <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)' }}><p style={{ color: 'var(--nmx-red)', fontSize: '0.9rem', margin: 0 }}>✗ {robloxError}</p></div>}

              {robloxUser && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', marginTop: '1rem', background: 'rgba(46,204,113,0.08)', border: '1px solid rgba(46,204,113,0.3)' }}>
                  {robloxUser.avatarUrl && <img src={robloxUser.avatarUrl} alt={robloxUser.name} style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--nmx-green)', objectFit: 'cover' }} />}
                  <div>
                    <div style={{ color: 'var(--nmx-green)', fontWeight: 700 }}>✓ Usuario Verificado</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{robloxUser.displayName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{robloxUser.name} · ID: {robloxUser.id}</div>
                    <a href={`https://www.roblox.com/users/${robloxUser.id}/profile`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--nmx-green)', fontSize: '0.8rem', textDecoration: 'none' }}>Ver perfil en Roblox ↗</a>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* ── PASO 3: EXAMEN ── */}
          {step === 3 && (
            <ExamSection onComplete={handleExamComplete} />
          )}

          {/* ── PASO 4: CONFIRMACIÓN ── */}
          {step === 4 && examData && (
            <div className="text-center">
              <ShieldCheck size={60} style={{ margin: '0 auto 1rem', color: 'var(--nmx-red)' }} />
              <h3>Confirmación Final</h3>

              {/* Resumen */}
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                {[
                  ['Discord', `@${discordUsername}`],
                  ['Roblox', `@${robloxUser?.name}`],
                  [`Puntaje Parte I`, `${examData.scorePartI}/19 correctas`],
                  [`Puntaje Automático`, `${examData.autoScore}/25`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                {examData.suspiciousFlags?.length > 0 && (
                  <div style={{ color: '#f39c12', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                    ⚠️ {examData.suspiciousFlags.length} respuesta(s) tardaron más de 15s en la Parte III — el staff será notificado.
                  </div>
                )}
              </div>

              <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>Al enviar, el equipo revisará tu examen completo y recibirás una respuesta oficial.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step !== 3 && (
        <div className="mt-4 flex justify-between">
          <button className="btn btn-secondary" onClick={() => setStep(prev => prev - 1)} disabled={step === 1 || submitting}>
            <ChevronLeft size={18} /> Atrás
          </button>
          {step < STEPS.length ? (
            <button className="btn btn-primary" onClick={() => setStep(prev => prev + 1)} disabled={!canGoNext()}>
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar Postulación'} <Check size={18} />
            </button>
          )}
        </div>
      )}

      <style>{`.spinning { animation: spin 1s linear infinite; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
