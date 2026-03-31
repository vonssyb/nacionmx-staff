import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, AlertTriangle, CheckCircle2, Clock, Zap, BookOpen, Shield } from 'lucide-react';

// ─────────────────────────────────────────────
// BANCO DE PREGUNTAS
// ─────────────────────────────────────────────
const PART_I = [
  { id: 1, q: "¿Qué significa IRL-X?", opts: ["Actuar fuera del personaje", "Irrealismo extremo", "Uso de bugs leves", "Muerte parcial"], answer: 1 },
  { id: 2, q: "Usar información vista en Discord dentro del rol es:", opts: ["Rol libre", "Meta permitido", "CXM", "FOR-R"], answer: 2 },
  { id: 3, q: "¿Cuál de estas acciones es SCN?", opts: ["Rolear una herida leve", "Ignorar un choque a 120 km/h", "Llamar EMS", "Esperar respawn"], answer: 1 },
  { id: 4, q: "Arrestar a un jugador sin rol previo se considera:", opts: ["ARL", "MAT-R", "ARX", "LEG-3"], answer: 2 },
  { id: 5, q: "¿Cuándo se considera válido un MD IC?", opts: ["Siempre que sea privado", "Cuando se declara IC y hay relación previa", "Cuando conviene", "Cuando no hay staff"], answer: 1 },
  { id: 6, q: "¿Cuál es una falta grave automática?", opts: ["CDI", "SAV", "ROL-X", "MD-R"], answer: 3 },
  { id: 7, q: "Cuando un jugador salta (BH) constantemente es:", opts: ["IRL-X", "SAV", "CXM", "INTX"], answer: 0 },
  { id: 8, q: "¿Qué ocurre si alguien usa un bug para atravesar paredes?", opts: ["Warn", "Kick", "BXG", "CDI"], answer: 2 },
  { id: 9, q: "Tomar un rango sin proceso previo es:", opts: ["ARX", "RANK-F", "ID-FX", "EXR"], answer: 1 },
  { id: 10, q: "Matar sin rol ni motivo corresponde a:", opts: ["TK", "MAT-R", "IRL-X", "MVP"], answer: 0 },
  { id: 11, q: "¿Qué recuerda un jugador tras un PK (MVP)?", opts: ["Todo", "Nada", "Solo lo ajeno a la escena", "Solo a su asesino"], answer: 1 },
  { id: 12, q: "¿Qué implica un CK?", opts: ["Respawn inmediato", "Olvidar la escena", "Eliminación total del personaje", "Ban"], answer: 2 },
  { id: 13, q: "Un EMS en servicio puede recibir CK:", opts: ["Siempre", "Nunca", "Solo con ticket", "Solo fuera de servicio"], answer: 1 },
  { id: 14, q: "¿Quién puede realizar crímenes de alto riesgo?", opts: ["Cualquiera", "Staff", "Bandas o carteles registrados", "Civiles"], answer: 2 },
  { id: 15, q: "Un secuestro es válido cuando:", opts: ["El secuestrador quiere", "No hay policías", "Hay rol previo y grupo criminal", "Es rápido"], answer: 2 },
  { id: 16, q: "Un golpe de estado IC requiere:", opts: ["Buen rol", "Aprobación de staff vía ticket", "Ser líder criminal", "Más de 10 jugadores"], answer: 1 },
  { id: 17, q: "Arrestar legalmente requiere:", opts: ["Autoridad", "Evidencia y procedimiento", "Ser policía", "Orden OOC"], answer: 1 },
  { id: 18, q: "¿Se puede detener una escena para reportar?", opts: ["Sí", "No", "Solo admins", "Si hay abuso"], answer: 3 },
  { id: 19, q: "¿Qué pasa cuando un mod entra en escena con :view?", opts: ["Se cancela", "Se pausa", "Se vuelve escena moderada", "Nada"], answer: 2 },
];

const PART_II = [
  { id: 20, q: "¿Cuándo aplicarías un CK forzado como staff?" },
  { id: 21, q: "¿Qué diferencia hay entre IRL-X y EXR?" },
  { id: 22, q: "¿Cuándo se justifica una Blacklist total (BL-T)?" },
  { id: 23, q: "¿Por qué no se deben imponer acciones en el rol (Powergaming)?" },
  { id: 24, q: "¿Qué valores debe tener un buen staff de Nación MX RP?" },
];

const PART_III = [
  { id: 25, q: "🐟 Tienes 10 peces en una pecera, 5 se ahogan. ¿Cuántos quedan?", hint: "Piensa en la naturaleza de los peces." },
  { id: 26, q: "✈️ Un avión cae exactamente en la frontera entre México y EUA. ¿Dónde entierran a los sobrevivientes?", hint: "Pon atención en la palabra clave." },
  { id: 27, q: "🔤 ¿Cuántas letras 'R' tiene la palabra 'PIRATA'?", hint: "Cuenta con cuidado cada letra." },
  { id: 28, q: "🍉 Tienes una sandía de 10kg sobre un papel bond flotando en agua. La sueltas. ¿Qué pasa?", hint: "Física básica." },
  { id: 29, q: "☕ 2 madres y 2 hijas van a una cafetería. Ordenan 3 cafés y todas reciben uno. ¿Cómo es posible?", hint: "Piensa en la relación entre ellas." },
  { id: 30, q: "🌧️ Un hombre calvo camina bajo la lluvia sin paraguas ni techo. ¿Se moja el pelo?", hint: "Presta atención a todos los detalles." },
];

const LETTERS = ['A', 'B', 'C', 'D'];

// ─────────────────────────────────────────────
// COMPONENTE TIMER
// ─────────────────────────────────────────────
function CountdownTimer({ seconds, onExpire, isRapidFire }) {
  const [remaining, setRemaining] = useState(seconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      onExpire?.();
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => prev - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [remaining]);

  const pct = (remaining / seconds) * 100;
  const color = remaining > seconds * 0.5 ? '#2ecc71' : remaining > seconds * 0.25 ? '#f39c12' : '#E63946';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {isRapidFire && <Zap size={16} color={color} />}
      <Clock size={14} color={color} />
      <span style={{ color, fontWeight: 700, fontSize: isRapidFire ? '1.5rem' : '1rem', fontVariantNumeric: 'tabular-nums' }}>
        {remaining}s
      </span>
      <div style={{ flex: 1, height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.1)', minWidth: '80px' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 1s linear, background 0.3s' }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL DEL EXAMEN
// ─────────────────────────────────────────────
export default function ExamSection({ onComplete }) {
  const [examPart, setExamPart] = useState(0); // 0=intro, 1=Part I, 2=Part II, 3=Part III, 4=done
  const [p1Answers, setP1Answers] = useState({});     // {questionId: optionIdx}
  const [p2Answers, setP2Answers] = useState({});     // {questionId: "text"}
  const [p3Answers, setP3Answers] = useState({});     // {questionId: "text"}
  const [p3Times, setP3Times] = useState({});         // {questionId: seconds}
  const [p3Suspicious, setP3Suspicious] = useState({}); // {questionId: bool}
  const [currentP3, setCurrentP3] = useState(0);
  const [p3TimerKey, setP3TimerKey] = useState(0);
  const [p3Input, setP3Input] = useState('');
  const p3StartRef = useRef(null);

  // ── Puntuación Parte I ──
  const scorePartI = () => {
    let correct = 0;
    PART_I.forEach(q => {
      if (p1Answers[q.id] === q.answer) correct++;
    });
    return correct;
  };

  // ── Puntuación Parte III ──
  const scorePartIII = () => {
    // Solo medimos tiempo como proxy; respuestas abiertas revisadas por staff
    return Object.keys(p3Answers).length; // Todas respondidas = puntos base
  };

  const handleP1Answer = (questionId, optIdx) => {
    setP1Answers(prev => ({ ...prev, [questionId]: optIdx }));
  };

  const handleP2Answer = (questionId, text) => {
    setP2Answers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleP3Submit = () => {
    const q = PART_III[currentP3];
    const elapsed = Math.round((Date.now() - p3StartRef.current) / 1000);
    const suspicious = elapsed > 15;

    setP3Answers(prev => ({ ...prev, [q.id]: p3Input }));
    setP3Times(prev => ({ ...prev, [q.id]: elapsed }));
    setP3Suspicious(prev => ({ ...prev, [q.id]: suspicious }));
    setP3Input('');

    if (currentP3 < PART_III.length - 1) {
      setCurrentP3(prev => prev + 1);
      setP3TimerKey(prev => prev + 1);
      setTimeout(() => { p3StartRef.current = Date.now(); }, 50);
    } else {
      // Examen completo
      const finalScore = scorePartI() + scorePartIII();
      onComplete({
        p1Answers,
        p2Answers,
        p3Answers,
        p3Times,
        p3Suspicious,
        scorePartI: scorePartI(),
        autoScore: finalScore,
        suspiciousFlags: Object.entries(p3Suspicious).filter(([,v]) => v).map(([k]) => Number(k))
      });
      setExamPart(4);
    }
  };

  const handleP3Expire = useCallback(() => {
    const q = PART_III[currentP3];
    setP3Suspicious(prev => ({ ...prev, [q.id]: true }));
    setP3Times(prev => ({ ...prev, [q.id]: 16 }));
    handleP3Submit();
  }, [currentP3, p3Input]);

  const canAdvanceP1 = Object.keys(p1Answers).length === PART_I.length;
  const canAdvanceP2 = PART_II.every(q => (p2Answers[q.id] || '').trim().length >= 15);

  const variants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  // ─── INTRO ───
  if (examPart === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🇲🇽</div>
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.25rem' }}>EXAMEN OFICIAL NACIÓN MX RP</h3>
        <p style={{ color: 'var(--nmx-red)', fontWeight: 700, marginBottom: '1.5rem', fontSize: '0.85rem' }}>STAFF V3.0 — CONFIDENCIAL</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { icon: <BookOpen size={22} />, label: 'PARTE I', desc: '19 preguntas MC', color: '#5865F2', time: '60s c/u' },
            { icon: <Shield size={22} />, label: 'PARTE II', desc: '5 preguntas abiertas', color: 'var(--nmx-red)', time: '60s c/u' },
            { icon: <Zap size={22} />, label: 'PARTE III', desc: '6 preguntas Anti-IA', color: '#f39c12', time: '15s c/u ⚡' },
          ].map(item => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '1rem', border: `1px solid ${item.color}33` }}>
              <div style={{ color: item.color, marginBottom: '0.35rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.label}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{item.desc}</div>
              <div style={{ color: item.color, fontSize: '0.75rem', marginTop: '0.25rem', fontWeight: 600 }}>{item.time}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(243,156,18,0.08)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1.5rem', textAlign: 'left' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#f39c12' }}>
            <strong>⚠️ VIGILANCIA NARANJA:</strong> Respuestas pegadas desde IA o que tarden demasiado serán marcadas automáticamente como sospechosas y notificadas al staff revisor.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem' }}>
          {[['<18', 'Rechazado', '#E63946'], ['18-21', 'A prueba', '#e67e22'], ['22-26', 'Entrenamiento', '#3498db'], ['27-30', '⭐ Excelencia', '#2ecc71']].map(([pts, label, color]) => (
            <div key={pts} style={{ textAlign: 'center' }}>
              <div style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{pts}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{label}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary btn-block" onClick={() => setExamPart(1)}>
          Comenzar Examen <ChevronRight size={18} />
        </button>
      </motion.div>
    );
  }

  // ─── PARTE I: MULTIPLE CHOICE ───
  if (examPart === 1) {
    const answered = Object.keys(p1Answers).length;
    return (
      <motion.div variants={variants} initial="initial" animate="animate" exit="exit">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.1rem' }}>Parte I: Reglamento Técnico</h3>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>Opción múltiple — Referencia: 60 segundos por pregunta</p>
          </div>
          <div style={{ background: 'rgba(88,101,242,0.15)', borderRadius: '8px', padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgba(88,101,242,0.3)' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#5865F2' }}>{answered}/19</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>respondidas</div>
          </div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {PART_I.map((q, qi) => (
            <div key={q.id} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '1rem',
              border: `1px solid ${p1Answers[q.id] !== undefined ? 'rgba(88,101,242,0.4)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'border-color 0.3s'
            }}>
              <div style={{ fontSize: '0.78rem', color: 'rgba(88,101,242,0.8)', fontWeight: 700, marginBottom: '0.35rem' }}>PREGUNTA {q.id}</div>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', lineHeight: 1.4 }}>{q.q}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {q.opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleP1Answer(q.id, i)}
                    style={{
                      padding: '0.5rem 0.75rem', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      textAlign: 'left', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s',
                      background: p1Answers[q.id] === i ? '#5865F2' : 'rgba(255,255,255,0.06)',
                      color: p1Answers[q.id] === i ? '#fff' : 'var(--text-main)',
                      boxShadow: p1Answers[q.id] === i ? '0 4px 12px rgba(88,101,242,0.35)' : 'none',
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: '0.4rem' }}>{LETTERS[i]})</span>{opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-primary"
            onClick={() => setExamPart(2)}
            disabled={!canAdvanceP1}
          >
            Continuar a Parte II <ChevronRight size={18} />
          </button>
        </div>
        {!canAdvanceP1 && (
          <p style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Responde todas las {PART_I.length} preguntas para continuar ({PART_I.length - answered} pendientes)
          </p>
        )}
      </motion.div>
    );
  }

  // ─── PARTE II: PREGUNTAS ABIERTAS ───
  if (examPart === 2) {
    return (
      <motion.div variants={variants} initial="initial" animate="animate" exit="exit">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ marginBottom: '0.1rem' }}>Parte II: Criterio y Rol</h3>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>Preguntas abiertas — Referencia: 60 segundos por respuesta</p>
          </div>
          <div style={{ background: 'rgba(230,57,70,0.15)', borderRadius: '8px', padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid rgba(230,57,70,0.3)' }}>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--nmx-red)' }}>
              {PART_II.filter(q => (p2Answers[q.id] || '').length >= 15).length}/5
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>respondidas</div>
          </div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {PART_II.map(q => (
            <div key={q.id} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '1rem', border: `1px solid ${(p2Answers[q.id]||'').length >= 15 ? 'rgba(230,57,70,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--nmx-red)', fontWeight: 700, marginBottom: '0.35rem' }}>PREGUNTA {q.id}</div>
              <div style={{ fontWeight: 600, marginBottom: '0.75rem', lineHeight: 1.4 }}>{q.q}</div>
              <textarea
                className="form-textarea"
                placeholder="Escribe tu respuesta aquí..."
                value={p2Answers[q.id] || ''}
                onChange={e => handleP2Answer(q.id, e.target.value)}
                style={{ minHeight: '90px', resize: 'vertical' }}
              />
              <div style={{ fontSize: '0.72rem', color: (p2Answers[q.id]||'').length >= 15 ? 'var(--nmx-green)' : 'var(--text-muted)', marginTop: '0.25rem' }}>
                {(p2Answers[q.id]||'').length} caracteres {(p2Answers[q.id]||'').length < 15 ? '(mín. 15)' : '✓'}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn btn-secondary" onClick={() => setExamPart(1)}>&larr; Volver</button>
          <button className="btn btn-primary" onClick={() => { setExamPart(3); p3StartRef.current = Date.now(); }} disabled={!canAdvanceP2}>
            Continuar a Parte III ⚡ <ChevronRight size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  // ─── PARTE III: ANTI-IA RAPID FIRE ───
  if (examPart === 3) {
    const currentQ = PART_III[currentP3];
    const progressPct = ((currentP3) / PART_III.length) * 100;

    return (
      <motion.div variants={variants} initial="initial" animate="animate" exit="exit" style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ marginBottom: '0.1rem', color: '#f39c12' }}>⚡ Parte III: Filtro Anti-IA</h3>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>Responde en menos de 15 segundos. ¡Ráfaga!</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700, color: '#f39c12', fontSize: '1.1rem' }}>{currentP3 + 1} / {PART_III.length}</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '1.5rem' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: '#f39c12', borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Timer grande y visible */}
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
              <CountdownTimer
                key={p3TimerKey}
                seconds={15}
                onExpire={handleP3Expire}
                isRapidFire={true}
              />
            </div>

            <div style={{
              background: 'rgba(243,156,18,0.08)', border: '2px solid rgba(243,156,18,0.4)',
              borderRadius: '16px', padding: '1.5rem', marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f39c12', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Pregunta {currentQ.id}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '0.75rem' }}>
                {currentQ.q}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(243,156,18,0.7)', fontStyle: 'italic' }}>
                💡 {currentQ.hint}
              </div>
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="Tu respuesta rápida aquí..."
              value={p3Input}
              onChange={e => setP3Input(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && p3Input.trim()) handleP3Submit(); }}
              autoFocus
              style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}
            />

            <button
              className="btn btn-primary btn-block"
              onClick={handleP3Submit}
              disabled={!p3Input.trim()}
              style={{ background: '#f39c12', boxShadow: '0 4px 14px rgba(243,156,18,0.3)' }}
            >
              {currentP3 < PART_III.length - 1 ? 'Siguiente ⚡' : 'Finalizar Examen ✓'}
            </button>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  // ─── COMPLETADO ───
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
      <CheckCircle2 size={64} color="var(--nmx-green)" style={{ margin: '0 auto 1rem' }} />
      <h3 style={{ color: 'var(--nmx-green)', marginBottom: '0.5rem' }}>¡Examen Completado!</h3>
      <p>Tus respuestas han sido guardadas. El equipo revisará tu evaluación y recibirás una respuesta pronto.</p>

      {Object.values(p3Suspicious).some(Boolean) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)', borderRadius: '8px', padding: '0.75rem', marginTop: '1rem', textAlign: 'left' }}>
          <AlertTriangle size={18} color="#f39c12" />
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#f39c12' }}>
            <strong>⚠️ Alerta:</strong> Algunas respuestas superaron el tiempo límite de la Parte III. El staff revisor será notificado.
          </p>
        </div>
      )}
    </motion.div>
  );
}
