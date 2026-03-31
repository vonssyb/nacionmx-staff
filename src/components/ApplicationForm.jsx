import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, User, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const STEPS = [
  { id: 1, title: 'Requisitos', icon: <ShieldCheck size={20} /> },
  { id: 2, title: 'Usuario', icon: <User size={20} /> },
  { id: 3, title: 'Preguntas', icon: <MessageSquare size={20} /> },
  { id: 4, title: 'Finalizar', icon: <Check size={20} /> }
];

export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    req_age: false,
    req_time: false,
    req_mic: false,
    discord_username: '',
    discord_id: '',
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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Guardar en Supabase (Asegúrate de tener esta tabla 'staff_applications' creada en Supabase)
      const { error } = await supabase
        .from('staff_applications')
        .insert([{ 
          discord_username: formData.discord_username,
          discord_id: formData.discord_id,
          roblox_username: formData.roblox_username,
          reason_join: formData.reason_join,
          experience: formData.experience,
          status: 'pending' // Esto es lo que verá el bot luego
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

  // Validaciones por paso
  const canGoNext = () => {
    if (step === 1) return formData.req_age && formData.req_time && formData.req_mic;
    if (step === 2) return formData.discord_username.trim().length > 2 && formData.discord_id.trim().length > 15;
    if (step === 3) return formData.reason_join.length > 20 && formData.experience.length > 10;
    return true;
  };

  // Animaciones Framer Motion
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
        <p className="mb-4">Tu postulación ha sido enviada al equipo administrativo de NaciónMX. Recibirás una respuesta en tu DM o en el canal de estado vía nuestro bot.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Volver al Inicio
        </button>
      </motion.div>
    );
  }

  return (
    <div className="glass-panel relative overflow-hidden">
      {/* Indicador de pasos */}
      <div className="steps-indicator">
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
              <p className="mb-4">Para poder aplicar, debes cumplir con todos los siguientes requisitos.</p>
              
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
              <h3>Información del Usuario</h3>
              <p className="mb-4">Identifícate correctamente para que podamos revisar tu perfil en Discord y Roblox.</p>
              
              <div className="form-group">
                <label className="form-label">Discord Username (Ej: user#1234 o @user)</label>
                <input type="text" className="form-input" placeholder="@usuario_nacion" name="discord_username" value={formData.discord_username} onChange={updateForm} />
              </div>

              <div className="form-group">
                <label className="form-label">Discord ID (Ej: 145070161768599...)</label>
                <input type="text" className="form-input" placeholder="Tu ID de Discord de 17-19 números" name="discord_id" value={formData.discord_id} onChange={updateForm} />
              </div>

              <div className="form-group">
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
                <textarea className="form-textarea" placeholder="Explica tus motivos, qué valor aportarías al equipo..." name="reason_join" value={formData.reason_join} onChange={updateForm} />
              </div>

              <div className="form-group">
                <label className="form-label">¿Tienes experiencia previa moderando otros servidores? (Cuéntanos)</label>
                <textarea className="form-textarea" placeholder="Menciona servidores, roles que tuviste y qué aprendiste..." name="experience" value={formData.experience} onChange={updateForm} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="text-center">
              <ShieldCheck size={60} className="mx-auto mb-4 text-red" />
              <h3>Confirmación</h3>
              <p className="mb-4">Has completado todos los pasos. Al enviar, la información de <strong className="text-red">@{formData.discord_username}</strong> será evaluada profundamente y luego un administrador decidirá aceptarla o rechazarla mediante nuestro sistema interno (el cual notificará tus resultados de forma oficial).</p>
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
            {submitting ? 'Enviando...' : 'Enviar Postulación'} <Check size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
