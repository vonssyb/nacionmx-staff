import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, User, MessageSquare, ShieldCheck, CheckCircle2, LogOut, Search, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STEPS = [
  { id: 1, title: 'Requisitos', icon: <ShieldCheck size={20} /> },
  { id: 2, title: 'Roblox', icon: <User size={20} /> },
  { id: 3, title: 'Preguntas', icon: <MessageSquare size={20} /> },
  { id: 4, title: 'Finalizar', icon: <Check size={20} /> }
];

// Obtener antigüedad de cuenta Discord desde el Snowflake ID
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

export default function ApplicationForm({ user }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

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
    req_time: meetsTimeReq, // auto-seleccionar
    req_mic: false,
    roblox_username: '',
    reason_join: '',
    experience: ''
  });

  // Auto-seleccionar el tiempo si cumple desde el principio
  useEffect(() => {
    setFormData(prev => ({ ...prev, req_time: meetsTimeReq }));
  }, [meetsTimeReq]);

  const updateForm = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Resetear verificación de Roblox si cambia el username
    if (name === 'roblox_username') {
      setRobloxUser(null);
      setRobloxError('');
    }
  };

  const verifyRoblox = async () => {
    if (!formData.roblox_username.trim()) return;
    setRobloxVerifying(true);
    setRobloxUser(null);
    setRobloxError('');
    try {
      const res = await fetch('https://users.roblox.com/v1/usernames/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usernames: [formData.roblox_username.trim()],
          excludeBannedUsers: true
        })
      });
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const rUser = data.data[0];
        // Obtener avatar del usuario
        const avatarRes = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${rUser.id}&size=150x150&format=Png`);
        const avatarData = await avatarRes.json();
        const avatarUrl = avatarData.data?.[0]?.imageUrl || null;
        setRobloxUser({ ...rUser, avatarUrl });
      } else {
        setRobloxError('Usuario no encontrado en Roblox. Verifica que el nombre sea exacto.');
      }
    } catch (err) {
      setRobloxError('Error conectando con Roblox. Intenta de nuevo.');
    } finally {
      setRobloxVerifying(false);
    }
  };

  const handleNext = () => {
    if (step < STEPS.length) setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(prev => prev - 1);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('staff_applications')
        .insert([{
          discord_username: discordUsername,
          discord_id: discordId,
          roblox_username: robloxUser ? robloxUser.name : formData.roblox_username,
          roblox_id: robloxUser ? robloxUser.id : null,
          reason_join: formData.reason_join,
          experience: formData.experience,
          status: 'pending'
        }]);

      if (error) {
        console.error('Error al guardar:', error);
        alert('Hubo un problema guardando tu solicitud. Por favor intenta de nuevo.');
        return;
      }
      setCompleted(true);
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    } finally {
      setSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return formData.req_age && formData.req_time && formData.req_mic;
    if (step === 2) return robloxUser !== null; // Verificación de Roblox obligatoria
    if (step === 3) return formData.reason_join.length > 20 && formData.experience.length > 10;
    return true;
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  if (completed) {
    return (
      <motion.div
        className="glass-panel text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CheckCircle2 size={80} color="var(--nmx-green)" style={{ margin: '0 auto 1rem' }} />
        <h2 className="text-green mb-2">¡Solicitud Enviada!</h2>
        <p className="mb-4">Tu postulación oficial de <strong>@{discordUsername}</strong> ha sido enviada al equipo de NaciónMX. Recibirás respuesta pronto.</p>
        <button className="btn btn-secondary mt-2" onClick={signOut}>
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </motion.div>
    );
  }

  return (
    <div className="glass-panel relative overflow-hidden">

      {/* Boton cerrar sesion */}
      <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
        <button onClick={signOut} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#adb5bd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LogOut size={14} /> Salir
        </button>
      </div>

      <div className="steps-indicator" style={{ marginTop: '1rem' }}>
        {STEPS.map((s) => (
          <div key={s.id} className={`step-item ${step === s.id ? 'active' : ''} ${step > s.id ? 'completed' : ''}`}>
            <div className="step-circle">
              {step > s.id ? <Check size={18} /> : s.id}
            </div>
            <span className="step-label">{s.title}</span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {step === 1 && (
            <div>
              <h3>Requisitos Mínimos</h3>
              <p className="mb-4">Hola <strong>{discordUsername}</strong>. Revisa y confirma los siguientes requisitos.</p>

              {/* Req Edad */}
              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                <input type="checkbox" name="req_age" checked={formData.req_age} onChange={updateForm} style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)', flexShrink: 0 }} />
                <span className="form-label">Tengo 15 años o más.</span>
              </label>

              {/* Req Antigüedad - AUTO */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem',
                borderRadius: '8px', marginBottom: '1rem',
                background: meetsTimeReq ? 'rgba(46, 204, 113, 0.08)' : 'rgba(230, 57, 70, 0.08)',
                border: `1px solid ${meetsTimeReq ? 'rgba(46, 204, 113, 0.3)' : 'rgba(230, 57, 70, 0.3)'}`
              }}>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '4px', flexShrink: 0,
                  background: meetsTimeReq ? 'var(--nmx-green)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {meetsTimeReq && <Check size={14} color="white" />}
                </div>
                <div>
                  <span className="form-label" style={{ color: meetsTimeReq ? 'var(--nmx-green)' : 'var(--nmx-red)', display: 'block' }}>
                    {meetsTimeReq ? '✓ Antigüedad verificada' : '✗ Antigüedad insuficiente'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Mi cuenta de Discord tiene al menos 5 días.
                    {createdAt && ` (Creada: ${createdAt.toLocaleDateString('es-MX')} · ${accountAgeDays} días)`}
                  </span>
                </div>
              </div>

              {/* Req Mic */}
              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer', gap: '0.75rem' }}>
                <input type="checkbox" name="req_mic" checked={formData.req_mic} onChange={updateForm} style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)', flexShrink: 0 }} />
                <span className="form-label">Cuento con un micrófono claro y funcional.</span>
              </label>

              {!meetsTimeReq && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(230, 57, 70, 0.1)', border: '1px solid rgba(230, 57, 70, 0.2)', marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--nmx-red)', fontSize: '0.85rem', margin: 0 }}>
                    Tu cuenta de Discord no cumple con el requisito mínimo de 5 días de antigüedad. Podrás postularte una vez que tu cuenta tenga al menos 5 días.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>Verificación de Roblox</h3>
              <p className="mb-4">Ingresa tu nombre de usuario exacto de Roblox para confirmar tu identidad dentro de la plataforma.</p>

              <div className="form-group">
                <label className="form-label">Roblox Username</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="TuNombreEnRoblox"
                    name="roblox_username"
                    value={formData.roblox_username}
                    onChange={updateForm}
                    style={{ flex: 1 }}
                    onKeyDown={(e) => e.key === 'Enter' && verifyRoblox()}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={verifyRoblox}
                    disabled={robloxVerifying || !formData.roblox_username.trim()}
                    style={{ flexShrink: 0 }}
                  >
                    {robloxVerifying ? <Loader size={18} className="spinning" /> : <Search size={18} />}
                    {robloxVerifying ? 'Buscando...' : 'Verificar'}
                  </button>
                </div>
              </div>

              {robloxError && (
                <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(230, 57, 70, 0.1)', border: '1px solid rgba(230, 57, 70, 0.3)', marginTop: '0.5rem' }}>
                  <p style={{ color: 'var(--nmx-red)', fontSize: '0.9rem', margin: 0 }}>✗ {robloxError}</p>
                </div>
              )}

              {robloxUser && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '12px', marginTop: '1rem',
                    background: 'rgba(46, 204, 113, 0.08)', border: '1px solid rgba(46, 204, 113, 0.3)'
                  }}
                >
                  {robloxUser.avatarUrl && (
                    <img
                      src={robloxUser.avatarUrl}
                      alt={robloxUser.name}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid var(--nmx-green)', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <div style={{ color: 'var(--nmx-green)', fontWeight: 700, fontSize: '1rem' }}>✓ Usuario Verificado</div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{robloxUser.displayName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>@{robloxUser.name} · ID: {robloxUser.id}</div>
                    <a
                      href={`https://www.roblox.com/users/${robloxUser.id}/profile`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--nmx-green)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-block', marginTop: '0.25rem' }}
                    >
                      Ver perfil en Roblox ↗
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>Preguntas de Evaluación</h3>
              <p className="mb-4">Sé detallado en tus respuestas. Esta es tu oportunidad de destacar ante el equipo.</p>

              <div className="form-group">
                <label className="form-label">¿Por qué deseas pertenecer al equipo de Staff de NaciónMX?</label>
                <textarea className="form-textarea" placeholder="Explica tus motivos, qué valor aportarías al equipo..." name="reason_join" value={formData.reason_join} onChange={updateForm} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formData.reason_join.length} caracteres (mín. 20)</span>
              </div>

              <div className="form-group">
                <label className="form-label">¿Tienes experiencia previa moderando otros servidores?</label>
                <textarea className="form-textarea" placeholder="Menciona servidores, roles que tuviste y qué aprendiste..." name="experience" value={formData.experience} onChange={updateForm} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formData.experience.length} caracteres (mín. 10)</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <ShieldCheck size={60} style={{ margin: '0 auto 1rem', color: 'var(--nmx-red)' }} />
              <h3>Confirmación Final</h3>
              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Discord</span>
                  <span style={{ fontWeight: 600 }}>@{discordUsername}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Roblox</span>
                  <span style={{ fontWeight: 600, color: 'var(--nmx-green)' }}>✓ @{robloxUser?.name}</span>
                </div>
              </div>
              <p style={{ marginBottom: 0 }}>Al enviar, tu postulación será evaluada por el equipo administrativo y recibirás respuesta vía el sistema oficial.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex justify-between">
        <button
          className="btn btn-secondary"
          onClick={handlePrev}
          disabled={step === 1 || submitting}
        >
          <ChevronLeft size={18} /> Atrás
        </button>

        {step < STEPS.length ? (
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={!canGoNext()}
          >
            Siguiente <ChevronRight size={18} />
          </button>
        ) : (
          <button
            className="btn btn-success"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Enviando...' : 'Enviar Postulación Oficial'} <Check size={18} />
          </button>
        )}
      </div>

      <style>{`
        .spinning { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
