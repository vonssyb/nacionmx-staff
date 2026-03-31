import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, User, MessageSquare, ShieldCheck, CheckCircle2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STEPS = [
  { id: 1, title: 'Requisitos', icon: <ShieldCheck size={20} /> },
  { id: 2, title: 'Usuario', icon: <User size={20} /> },
  { id: 3, title: 'Preguntas', icon: <MessageSquare size={20} /> },
  { id: 4, title: 'Finalizar', icon: <Check size={20} /> }
];

export default function ApplicationForm({ user }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  // Extraer la logica oficial de supabase discord
  const discordUsername = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const discordId = user.identities?.find(i => i.provider === 'discord')?.id || 'desconocido';

  const [formData, setFormData] = useState({
    req_age: false,
    req_time: false,
    req_mic: false,
    roblox_username: '',
    reason_join: '',
    experience: ''
  });

  const updateForm = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
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
          roblox_username: formData.roblox_username,
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
    if (step === 2) return formData.roblox_username.trim().length > 3;
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
        <CheckCircle2 size={80} color="var(--nmx-green)" className="mx-auto mb-4" />
        <h2 className="text-green mb-2">¡Solicitud Enviada!</h2>
        <p className="mb-4">Tu postulación oficial autografiada por <strong>@{discordUsername}</strong> ha sido enviada al equipo de NaciónMX.</p>
        <button className="btn btn-secondary mt-2" onClick={signOut}>
          <LogOut size={18} className="mr-2" /> Cerrar Sesión
        </button>
      </motion.div>
    );
  }

  return (
    <div className="glass-panel relative overflow-hidden">
      
      {/* Boton cerrar sesion decorativo superior */}
      <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
        <button onClick={signOut} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderRadius: '4px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <LogOut size={14} /> Cerrar Sesión
        </button>
      </div>

      <div className="steps-indicator mt-4">
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
              <p className="mb-4">Hola <strong>{discordUsername}</strong>. Confirma tus requisitos para avanzar.</p>
              
              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="req_age" checked={formData.req_age} onChange={updateForm} style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)' }} />
                <span className="form-label ml-2">Tengo 16 años o más.</span>
              </label>
              
              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="req_time" checked={formData.req_time} onChange={updateForm} style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)' }} />
                <span className="form-label ml-2">Llevo al menos 2 meses en el servidor de Discord.</span>
              </label>

              <label className="form-group" style={{ flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }}>
                <input type="checkbox" name="req_mic" checked={formData.req_mic} onChange={updateForm} style={{ width: '20px', height: '20px', accentColor: 'var(--nmx-red)' }} />
                <span className="form-label ml-2">Cuento con un micrófono claro y funcional.</span>
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <h3>Vinculación Oficial</h3>
              <p className="mb-4">Gracias al inicio de sesión, tus datos de Discord están securizados. Ahora solo necesitamos tu nombre en Roblox.</p>
              
              <div className="form-group mb-4" style={{ background: 'rgba(0,255,100,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,255,100,0.2)' }}>
                <span style={{ fontSize: '0.8rem', color: '#2ecc71', fontWeight: 'bold' }}>✓ DISCORD VINCULADO</span>
                <div style={{ marginTop: '0.5rem', fontWeight: '500' }}>User: {discordUsername}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {discordId}</div>
              </div>

              <div className="form-group mt-4">
                <label className="form-label">Roblox Username (Para ERLC)</label>
                <input type="text" className="form-input" placeholder="TuNombreEnRoblox" name="roblox_username" value={formData.roblox_username} onChange={updateForm} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h3>Preguntas de Evaluación</h3>
              <p className="mb-4">Sé detallado en tus respuestas. Esta es tu oportunidad de destacar.</p>
              
              <div className="form-group">
                <label className="form-label">¿Por qué deseas pertenecer al equipo de Staff de NaciónMX?</label>
                <textarea className="form-textarea" placeholder="Explica tus motivos..." name="reason_join" value={formData.reason_join} onChange={updateForm} />
              </div>

              <div className="form-group">
                <label className="form-label">¿Tienes experiencia previa moderando otros servidores? (Cuéntanos)</label>
                <textarea className="form-textarea" placeholder="Menciona servidores, roles que tuviste..." name="experience" value={formData.experience} onChange={updateForm} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <ShieldCheck size={60} className="mx-auto mb-4 text-red" />
              <h3>Confirmación Final</h3>
              <p className="mb-4">Has completado todos los pasos. Al enviar, tu postulación oficial garantizada por tu cuenta de Discord <strong>@{discordUsername}</strong> será enviada al equipo.</p>
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
    </div>
  );
}
