import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, User, ClipboardList, ShieldCheck, CheckCircle2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExamSection from './ExamSection';

const STEPS = [
  { id: 1, title: 'Requisitos',  icon: <ShieldCheck size={20} /> },
  { id: 2, title: 'Roblox',     icon: <User size={20} /> },
  { id: 3, title: 'Examen',     icon: <ClipboardList size={20} /> },
  { id: 4, title: 'Finalizar',  icon: <Check size={20} /> },
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
  { min: 27, label: '⭐ Excelencia',  color: '#2ecc71', result: 'pass' },
  { min: 22, label: 'Entrenamiento', color: '#3498db', result: 'training' },
  { min: 18, label: 'A prueba',      color: '#e67e22', result: 'probation' },
  { min: 0,  label: 'Rechazado',    color: '#E63946', result: 'rejected' },
];

function getScoreLabel(score) {
  return SCORE_LABELS.find(s => score >= s.min) || SCORE_LABELS[SCORE_LABELS.length - 1];
}

export default function ApplicationForm({ user, providerToken }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [examData, setExamData] = useState(null);

  const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const discordId = user.identities?.find(i => i.provider === 'discord')?.id || '0';
  const { days: accountAgeDays, createdAt } = getDiscordAccountAgeDays(discordId);
  const meetsTimeReq = accountAgeDays >= 30;

  // Server join date (auto)
  const GUILD_ID = '1398525215134318713';
  const [serverJoinDays, setServerJoinDays] = useState(null); // null = loading
  const [meetsServerReq, setMeetsServerReq] = useState(false);

  useEffect(() => {
    if (!providerToken) { setServerJoinDays(-1); return; }
    fetch(`https://discord.com/api/v10/users/@me/guilds/${GUILD_ID}/member`, {
      headers: { Authorization: `Bearer ${providerToken}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        const joinedAt = new Date(data.joined_at);
        const days = Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24));
        setServerJoinDays(days);
        const meets = days >= 5;
        setMeetsServerReq(meets);
        setFormData(prev => ({ ...prev, req_server: meets }));
      })
      .catch(() => setServerJoinDays(-1)); // Can't verify = manual fallback
  }, [providerToken]);

  const [formData, setFormData] = useState({
    req_age: false,
    req_time: meetsTimeReq,
    req_server: false,
    req_mic: false,
    roblox_username: '',
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, req_time: meetsTimeReq }));
  }, [meetsTimeReq]);

  const updateForm = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleExamComplete = (data) => {
    setExamData(data);
    setStep(4);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const scoreLabel = getScoreLabel(examData?.autoScore || 0);
      const { error } = await supabase.from('staff_applications').insert([{
        discord_username: discordUsername,
        discord_id: discordId,
        roblox_username: formData.roblox_username.trim(),
        part1_answers: examData?.p1Answers || {},
        part2_answers: examData?.p2Answers || {},
        part3_answers: examData?.p3Answers || {},
        part3_times:   examData?.p3Times   || {},
        score_part1:   examData?.scorePartI || 0,
        auto_score:    examData?.autoScore  || 0,
        score_label:   scoreLabel.label,
        score_result:  scoreLabel.result,
        suspicious_flags: examData?.suspiciousFlags || [],
        status: 'pending',
      }]);
      if (error) { alert('Error al guardar: ' + error.message); return; }
      setCompleted(true);
    } catch { alert('Error de conexión.'); }
    finally { setSubmitting(false); }
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  const canGoNext = () => {
    if (step === 1) return formData.req_age && formData.req_time && formData.req_server && formData.req_mic;
    if (step === 2) return formData.roblox_username.trim().length >= 3;
    return true;
  };

  const variants = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 } };

  // ── Pantalla de éxito ──
  if (completed) {
    const label = getScoreLabel(examData?.autoScore || 0);
    return (
      <motion.div className="glass-panel text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <CheckCircle2 size={80} color={label.color} style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ color: label.color, marginBottom: '0.5rem' }}>¡Postulación Enviada!</h2>
        <p className="mb-4">
          La postulación de <strong>@{discordUsername}</strong> fue enviada al equipo de NaciónMX.
          Recibirás respuesta pronto.
        </p>
        <button className="btn btn-secondary" onClick={signOut}><LogOut size={18} /> Cerrar Sesión</button>
      </motion.div>
    );
  }

  return (
    <div className="glass-panel relative overflow-hidden">

      {/* Botón salir */}
      <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
        <button onClick={signOut} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#adb5bd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LogOut size={14} /> Salir
        </button>
      </div>

      {/* Steps (ocultos durante el examen para dar más espacio) */}
      {step !== 3 && (
        <div className="steps-indicator" style={{ marginTop: '1rem' }}>
          {STEPS.map(s => (
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

              {/* Edad */}
              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                <input type="checkbox" name="req_age" checked={formData.req_age} onChange={updateForm}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)', flexShrink: 0 }} />
                <span className="form-label">Tengo 15 años o más.</span>
              </label>

              {/* Antigüedad cuenta Discord - AUTO 30 días */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem',
                borderRadius: '8px', marginBottom: '1rem',
                background: meetsTimeReq ? 'rgba(46,204,113,0.08)' : 'rgba(230,57,70,0.08)',
                border: `1px solid ${meetsTimeReq ? 'rgba(46,204,113,0.3)' : 'rgba(230,57,70,0.3)'}`
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: meetsTimeReq ? 'var(--nmx-green)' : 'rgba(255,255,255,0.1)' }}>
                  {meetsTimeReq && <Check size={14} color="white" />}
                </div>
                <div>
                  <span className="form-label" style={{ color: meetsTimeReq ? 'var(--nmx-green)' : 'var(--nmx-red)', display: 'block' }}>
                    {meetsTimeReq ? '✓ Cuenta verificada automáticamente' : '✗ Cuenta de Discord muy nueva (requiere 30 días)'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Mi cuenta de Discord tiene al menos 30 días.
                    {createdAt && ` (Creada: ${createdAt.toLocaleDateString('es-MX')} · ${accountAgeDays} días)`}
                  </span>
                </div>
              </div>

              {/* Tiempo en servidor - AUTO si se pudo verificar */}
              {serverJoinDays === null ? (
                <div style={{ padding: '0.9rem', borderRadius: '8px', marginBottom: '1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>⏳ Verificando tiempo en servidor...</span>
                </div>
              ) : serverJoinDays >= 0 ? (
                // Verificación automática exitosa
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem',
                  borderRadius: '8px', marginBottom: '1rem',
                  background: meetsServerReq ? 'rgba(46,204,113,0.08)' : 'rgba(230,57,70,0.08)',
                  border: `1px solid ${meetsServerReq ? 'rgba(46,204,113,0.3)' : 'rgba(230,57,70,0.3)'}`
                }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: meetsServerReq ? 'var(--nmx-green)' : 'rgba(255,255,255,0.1)' }}>
                    {meetsServerReq && <Check size={14} color="white" />}
                  </div>
                  <div>
                    <span className="form-label" style={{ color: meetsServerReq ? 'var(--nmx-green)' : 'var(--nmx-red)', display: 'block' }}>
                      {meetsServerReq ? '✓ Tiempo en servidor verificado' : '✗ Llevas menos de 5 días en el servidor'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Mínimo 5 días en NaciónMX. {serverJoinDays >= 0 && `(${serverJoinDays} día${serverJoinDays !== 1 ? 's' : ''} en el servidor)`}
                    </span>
                  </div>
                </div>
              ) : (
                // No se pudo verificar automáticamente — checkbox manual
                <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                  <input type="checkbox" name="req_server" checked={formData.req_server} onChange={updateForm}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)', flexShrink: 0 }} />
                  <div>
                    <span className="form-label" style={{ display: 'block' }}>Llevo al menos 5 días en el servidor de NaciónMX.</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No pudimos verificarlo automáticamente. El staff lo comprobará.</span>
                  </div>
                </label>
              )}

              {/* Micrófono */}
              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                <input type="checkbox" name="req_mic" checked={formData.req_mic} onChange={updateForm}
                  style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)', flexShrink: 0 }} />
                <span className="form-label">Cuento con un micrófono claro y funcional.</span>
              </label>
            </div>
          )}

          {/* ── PASO 2: ROBLOX ── */}
          {step === 2 && (
            <div>
              <h3>Vinculación de Roblox</h3>
              <p className="mb-4">
                Ingresa tu nombre de usuario de Roblox. El equipo de staff lo verificará manualmente durante la revisión.
              </p>

              <div className="form-group" style={{ marginBottom: '0.5rem' }}>
                <label className="form-label">Roblox Username</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="TuNombreEnRoblox"
                  name="roblox_username"
                  value={formData.roblox_username}
                  onChange={updateForm}
                  autoFocus
                />
              </div>

              {formData.roblox_username.trim().length >= 3 && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  style={{ marginTop: '1rem', padding: '0.85rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    Confirmar perfil en Roblox:
                  </span>
                  <a
                    href={`https://www.roblox.com/search/users?keyword=${encodeURIComponent(formData.roblox_username.trim())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
                  >
                    Ver en Roblox ↗
                  </a>
                </motion.div>
              )}

              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1.25rem' }}>
                🔒 La verificación automática con OAuth de Roblox estará disponible próximamente.
              </p>
            </div>
          )}

          {/* ── PASO 3: EXAMEN ── */}
          {step === 3 && <ExamSection onComplete={handleExamComplete} />}

          {/* ── PASO 4: CONFIRMACIÓN ── */}
          {step === 4 && examData && (
            <div className="text-center">
              <ShieldCheck size={60} style={{ margin: '0 auto 1rem', color: 'var(--nmx-red)' }} />
              <h3>Confirmación Final</h3>

              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                {[
                  ['Discord',          `@${discordUsername}`],
                  ['Roblox',           `@${formData.roblox_username}`],
                  ['Puntaje Parte I',  `${examData.scorePartI}/19`],
                  ['Puntaje total',    `${examData.autoScore}/25`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
                {examData.suspiciousFlags?.length > 0 && (
                  <div style={{ color: '#f39c12', fontSize: '0.82rem', marginTop: '0.5rem' }}>
                    ⚠️ {examData.suspiciousFlags.length} respuesta(s) Anti-IA marcadas como sospechosas.
                  </div>
                )}
              </div>

              <p style={{ marginBottom: 0, fontSize: '0.9rem' }}>
                Al enviar, el equipo revisará tu examen y recibirás respuesta oficial.
              </p>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* Navegación (oculta durante el examen) */}
      {step !== 3 && (
        <div className="mt-4 flex justify-between">
          <button className="btn btn-secondary" onClick={() => setStep(p => p - 1)} disabled={step === 1 || submitting}>
            <ChevronLeft size={18} /> Atrás
          </button>
          {step < STEPS.length ? (
            <button className="btn btn-primary" onClick={() => setStep(p => p + 1)} disabled={!canGoNext()}>
              Siguiente <ChevronRight size={18} />
            </button>
          ) : (
            <button className="btn btn-success" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Enviando...' : 'Enviar Postulación'} <Check size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
