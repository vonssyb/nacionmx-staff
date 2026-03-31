import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, AlertTriangle, Clock, Zap, BookOpen, Shield, Check } from 'lucide-react';

// ─── BANCO DE PREGUNTAS ───────────────────────────────────
const PART_I = [
  { id: 1,  q: "¿Qué significa IRL-X?",                                                    opts: ["Actuar fuera del personaje","Irrealismo extremo","Uso de bugs leves","Muerte parcial"],              answer: 1 },
  { id: 2,  q: "Usar información vista en Discord dentro del rol es:",                     opts: ["Rol libre","Meta permitido","CXM","FOR-R"],                                                           answer: 2 },
  { id: 3,  q: "¿Cuál de estas acciones es SCN?",                                          opts: ["Rolear una herida leve","Ignorar un choque a 120 km/h","Llamar EMS","Esperar respawn"],              answer: 1 },
  { id: 4,  q: "Arrestar a un jugador sin rol previo se considera:",                       opts: ["ARL","MAT-R","ARX","LEG-3"],                                                                         answer: 2 },
  { id: 5,  q: "¿Cuándo se considera válido un MD IC?",                                   opts: ["Siempre que sea privado","Cuando se declara IC y hay relación previa","Cuando conviene","Cuando no hay staff"], answer: 1 },
  { id: 6,  q: "¿Cuál es una falta grave automática?",                                    opts: ["CDI","SAV","ROL-X","MD-R"],                                                                          answer: 3 },
  { id: 7,  q: "Cuando un jugador salta (BH) constantemente es:",                         opts: ["IRL-X","SAV","CXM","INTX"],                                                                         answer: 0 },
  { id: 8,  q: "¿Qué ocurre si alguien usa un bug para atravesar paredes?",               opts: ["Warn","Kick","BXG","CDI"],                                                                           answer: 2 },
  { id: 9,  q: "Tomar un rango sin proceso previo es:",                                    opts: ["ARX","RANK-F","ID-FX","EXR"],                                                                       answer: 1 },
  { id: 10, q: "Matar sin rol ni motivo corresponde a:",                                   opts: ["TK","MAT-R","IRL-X","MVP"],                                                                         answer: 0 },
  { id: 11, q: "¿Qué recuerda un jugador tras un PK (MVP)?",                              opts: ["Todo","Nada","Solo lo ajeno a la escena","Solo a su asesino"],                                      answer: 1 },
  { id: 12, q: "¿Qué implica un CK?",                                                     opts: ["Respawn inmediato","Olvidar la escena","Eliminación total del personaje","Ban"],                     answer: 2 },
  { id: 13, q: "Un EMS en servicio puede recibir CK:",                                    opts: ["Siempre","Nunca","Solo con ticket","Solo fuera de servicio"],                                        answer: 1 },
  { id: 14, q: "¿Quién puede realizar crímenes de alto riesgo?",                          opts: ["Cualquiera","Staff","Bandas o carteles registrados","Civiles"],                                      answer: 2 },
  { id: 15, q: "Un secuestro es válido cuando:",                                           opts: ["El secuestrador quiere","No hay policías","Hay rol previo y grupo criminal","Es rápido"],           answer: 2 },
  { id: 16, q: "Un golpe de estado IC requiere:",                                          opts: ["Buen rol","Aprobación de staff vía ticket","Ser líder criminal","Más de 10 jugadores"],              answer: 1 },
  { id: 17, q: "Arrestar legalmente requiere:",                                            opts: ["Autoridad","Evidencia y procedimiento","Ser policía","Orden OOC"],                                  answer: 1 },
  { id: 18, q: "¿Se puede detener una escena para reportar?",                             opts: ["Sí","No","Solo admins","Si hay abuso"],                                                              answer: 3 },
  { id: 19, q: "¿Qué pasa cuando un mod entra en escena con :view?",                     opts: ["Se cancela","Se pausa","Se vuelve escena moderada","Nada"],                                         answer: 2 },
];

const PART_II = [
  { id: 20, q: "¿Cuándo aplicarías un CK forzado como staff?" },
  { id: 21, q: "¿Qué diferencia hay entre IRL-X y EXR?" },
  { id: 22, q: "¿Cuándo se justifica una Blacklist total (BL-T)?" },
  { id: 23, q: "¿Por qué no se deben imponer acciones en el rol (Powergaming)?" },
  { id: 24, q: "¿Qué valores debe tener un buen staff de Nación MX RP?" },
];

const PART_III = [
  { id: 25, q: "🐟 Tienes 10 peces en una pecera, 5 se ahogan. ¿Cuántos quedan?",           hint: "Piensa en la naturaleza de los peces." },
  { id: 26, q: "✈️ Un avión cae en la frontera. ¿Dónde entierran a los sobrevivientes?",    hint: "Pon atención en la palabra clave." },
  { id: 27, q: "🔤 ¿Cuántas letras 'R' tiene la palabra 'PIRATA'?",                         hint: "Cuenta con cuidado." },
  { id: 28, q: "🍉 Una sandía de 10kg sobre papel bond flotando. ¿Qué pasa al soltarla?",   hint: "Física básica." },
  { id: 29, q: "☕ 2 madres y 2 hijas compran 3 cafés, todas reciben uno. ¿Cómo?",          hint: "Piensa en la relación entre ellas." },
  { id: 30, q: "🌧️ Un hombre calvo bajo la lluvia sin paraguas ni techo. ¿Se moja el pelo?", hint: "Atención a todos los detalles." },
];

const LETTERS = ['A', 'B', 'C', 'D'];
const P1_TOTAL = 19 * 60; // 19 min
const P2_SECS  = 60;
const P3_SECS  = 15;

// ─── BARRA DE TIEMPO ─────────────────────────────────────
function TimerBar({ remaining, total, large = false }) {
  const pct   = Math.max(0, (remaining / total) * 100);
  const color = remaining > total * 0.5 ? '#2ecc71' : remaining > total * 0.25 ? '#f39c12' : '#E63946';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
      <Clock size={large ? 18 : 13} color={color} style={{ flexShrink: 0 }} />
      <span style={{ color, fontWeight: 700, minWidth: large ? '44px' : '30px', fontSize: large ? '1.3rem' : '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
        {remaining}s
      </span>
      <div style={{ flex: 1, height: large ? '6px' : '4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 1s linear, background 0.3s' }} />
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────
export default function ExamSection({ onComplete }) {
  // ── Estado general ──
  const [examPart, setExamPart] = useState(0); // 0=intro 1=P1 2=P2 3=P3

  // ── Parte I ──
  const [p1Answers, setP1Answers] = useState({});
  const [p1Timer, setP1Timer]     = useState(P1_TOTAL);

  // ── Parte II ──
  const [p2Idx, setP2Idx]         = useState(0);
  const [p2Answers, setP2Answers] = useState({});
  const [p2Timer, setP2Timer]     = useState(P2_SECS);
  const [p2Suspicious, setP2Suspicious] = useState({});

  // ── Parte III ──
  const [p3Idx, setP3Idx]         = useState(0);
  const [p3Input, setP3Input]     = useState('');
  const [p3Answers, setP3Answers] = useState({});
  const [p3Times, setP3Times]     = useState({});
  const [p3Timer, setP3Timer]     = useState(P3_SECS);
  const [p3Suspicious, setP3Suspicious] = useState({});
  const p3StartRef = useRef(null);
  const doneRef    = useRef(false); // evitar doble onComplete

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // TIMERS — todos los hooks ALWAYS en el top-level
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  // Timer Parte I (informativo)
  useEffect(() => {
    if (examPart !== 1) return;
    const id = setInterval(() => setP1Timer(t => Math.max(t - 1, 0)), 1000);
    return () => clearInterval(id);
  }, [examPart]);

  // Timer Parte II — auto-avanza al expirar
  useEffect(() => {
    if (examPart !== 2) return;
    setP2Timer(P2_SECS); // reset al entrar o cambiar pregunta
  }, [examPart, p2Idx]);

  useEffect(() => {
    if (examPart !== 2) return;
    const id = setInterval(() => {
      setP2Timer(t => {
        if (t <= 1) {
          clearInterval(id);
          // Marcar sospechoso y avanzar
          const qId = PART_II[p2Idx]?.id;
          if (qId) setP2Suspicious(prev => ({ ...prev, [qId]: true }));
          setTimeout(() => advanceP2(true), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [examPart, p2Idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Timer Parte III — auto-avanza al expirar
  useEffect(() => {
    if (examPart !== 3) return;
    setP3Timer(P3_SECS);
    p3StartRef.current = Date.now();
  }, [examPart, p3Idx]);

  useEffect(() => {
    if (examPart !== 3) return;
    const id = setInterval(() => {
      setP3Timer(t => {
        if (t <= 1) {
          clearInterval(id);
          setTimeout(() => advanceP3(true), 0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [examPart, p3Idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Scoring ─────────────────────────────
  const scorePartI = useCallback(() =>
    PART_I.reduce((s, q) => s + (p1Answers[q.id] === q.answer ? 1 : 0), 0),
  [p1Answers]);

  // ─── Avanzar P2 ──────────────────────────
  const advanceP2 = useCallback((markSuspicious = false) => {
    const q = PART_II[p2Idx];
    if (markSuspicious && q) setP2Suspicious(prev => ({ ...prev, [q.id]: true }));
    if (p2Idx < PART_II.length - 1) {
      setP2Idx(i => i + 1);
    } else {
      setExamPart(3);
    }
  }, [p2Idx]);

  // ─── Avanzar P3 ──────────────────────────
  const advanceP3 = useCallback((timeoutForced = false) => {
    if (doneRef.current) return;
    const q       = PART_III[p3Idx];
    const elapsed = Math.round((Date.now() - (p3StartRef.current || Date.now())) / 1000);
    const susp    = timeoutForced || elapsed > P3_SECS;

    const newAnswers    = { ...p3Answers,    [q.id]: p3Input };
    const newTimes      = { ...p3Times,      [q.id]: timeoutForced ? P3_SECS + 1 : elapsed };
    const newSuspicious = { ...p3Suspicious, [q.id]: susp };

    setP3Answers(newAnswers);
    setP3Times(newTimes);
    setP3Suspicious(newSuspicious);
    setP3Input('');

    if (p3Idx < PART_III.length - 1) {
      setP3Idx(i => i + 1);
    } else {
      if (doneRef.current) return;
      doneRef.current = true;
      const suspiciousFlags = Object.entries({ ...p2Suspicious, ...newSuspicious })
        .filter(([, v]) => v).map(([k]) => Number(k));
      onComplete({
        p1Answers,
        p2Answers,
        p3Answers: newAnswers,
        p3Times:   newTimes,
        scorePartI: scorePartI(),
        autoScore:  scorePartI() + Object.keys(newAnswers).length,
        suspiciousFlags,
      });
    }
  }, [p3Idx, p3Input, p3Answers, p3Times, p3Suspicious, p2Suspicious, p1Answers, p2Answers, scorePartI, onComplete]);

  const canAdvanceP1 = Object.keys(p1Answers).length === PART_I.length;
  const currentP2Q   = PART_II[p2Idx];
  const currentP3Q   = PART_III[p3Idx];
  const canAdvanceP2 = (p2Answers[currentP2Q?.id] || '').trim().length >= 10;

  const vIn  = { opacity: 0, y: 14 };
  const vAn  = { opacity: 1, y: 0  };
  const vEx  = { opacity: 0, y: -14 };

  // ════════════════════════════════════════════
  // INTRO
  // ════════════════════════════════════════════
  if (examPart === 0) return (
    <motion.div initial={vIn} animate={vAn} style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2.4rem', marginBottom: '0.6rem' }}>🇲🇽</div>
      <h3 style={{ marginBottom: '0.2rem' }}>EXAMEN OFICIAL NACIÓN MX RP</h3>
      <p style={{ color: 'var(--nmx-red)', fontWeight: 700, fontSize: '0.8rem', marginBottom: '1.4rem' }}>STAFF V3.0 — CONFIDENCIAL</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.7rem', marginBottom: '1.4rem' }}>
        {[
          { icon: <BookOpen size={20}/>, label:'PARTE I', desc:'19 MC',        color:'#5865F2', time:'60s c/u'  },
          { icon: <Shield size={20}/>,  label:'PARTE II', desc:'5 abiertas',   color:'var(--nmx-red)', time:'60s c/u' },
          { icon: <Zap size={20}/>,     label:'PARTE III',desc:'6 Anti-IA',    color:'#f39c12', time:'15s ⚡'   },
        ].map(x=>(
          <div key={x.label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'0.85rem', border:`1px solid ${x.color}33` }}>
            <div style={{ color:x.color, marginBottom:'0.3rem' }}>{x.icon}</div>
            <div style={{ fontWeight:700, fontSize:'0.85rem' }}>{x.label}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.74rem' }}>{x.desc}</div>
            <div style={{ color:x.color, fontSize:'0.72rem', fontWeight:600, marginTop:'0.2rem' }}>{x.time}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'space-around', background:'rgba(255,255,255,0.03)', borderRadius:'8px', padding:'0.7rem', marginBottom:'1.4rem' }}>
        {[['<18','Rechazado','#E63946'],['18-21','A prueba','#e67e22'],['22-26','Entrenamiento','#3498db'],['27-30','⭐ Excelencia','#2ecc71']].map(([p,l,c])=>(
          <div key={p} style={{ textAlign:'center' }}>
            <div style={{ color:c, fontWeight:700, fontSize:'0.86rem' }}>{p}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.68rem' }}>{l}</div>
          </div>
        ))}
      </div>
      <button className="btn btn-primary btn-block" onClick={()=>setExamPart(1)}>
        Comenzar Examen <ChevronRight size={18}/>
      </button>
    </motion.div>
  );

  // ════════════════════════════════════════════
  // PARTE I — opción múltiple
  // ════════════════════════════════════════════
  if (examPart === 1) return (
    <motion.div initial={vIn} animate={vAn}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.7rem' }}>
        <div>
          <h3 style={{ marginBottom:'0.1rem', fontSize:'0.98rem' }}>Parte I — Reglamento Técnico</h3>
          <p style={{ margin:0, fontSize:'0.76rem', color:'var(--text-muted)' }}>Opción múltiple · 60s de referencia por pregunta</p>
        </div>
        <div style={{ background:'rgba(88,101,242,0.12)', borderRadius:'8px', padding:'0.45rem 0.75rem', textAlign:'center', border:'1px solid rgba(88,101,242,0.3)' }}>
          <div style={{ fontWeight:700, color:'#5865F2' }}>{Object.keys(p1Answers).length}/19</div>
          <div style={{ fontSize:'0.66rem', color:'var(--text-muted)' }}>resp.</div>
        </div>
      </div>

      {/* Cronómetro global P1 */}
      <div style={{ marginBottom:'1rem' }}>
        <TimerBar remaining={p1Timer} total={P1_TOTAL} />
      </div>

      <div style={{ maxHeight:'400px', overflowY:'auto', paddingRight:'4px', display:'flex', flexDirection:'column', gap:'0.8rem' }}>
        {PART_I.map(q=>(
          <div key={q.id} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'0.95rem', border:`1px solid ${p1Answers[q.id]!==undefined?'rgba(88,101,242,0.45)':'rgba(255,255,255,0.06)'}`, transition:'border-color 0.25s' }}>
            <div style={{ fontSize:'0.7rem', color:'rgba(88,101,242,0.9)', fontWeight:700, marginBottom:'0.3rem' }}>P{q.id}</div>
            <div style={{ fontWeight:600, marginBottom:'0.65rem', fontSize:'0.9rem', lineHeight:1.4 }}>{q.q}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem' }}>
              {q.opts.map((opt,i)=>(
                <button key={i} onClick={()=>setP1Answers(prev=>({...prev,[q.id]:i}))} style={{ padding:'0.42rem 0.65rem', borderRadius:'6px', border:'none', cursor:'pointer', textAlign:'left', fontSize:'0.8rem', fontWeight:500, transition:'all 0.2s', background:p1Answers[q.id]===i?'#5865F2':'rgba(255,255,255,0.06)', color:p1Answers[q.id]===i?'#fff':'var(--text-main)', boxShadow:p1Answers[q.id]===i?'0 3px 10px rgba(88,101,242,0.35)':'none' }}>
                  <span style={{ fontWeight:700, marginRight:'0.3rem' }}>{LETTERS[i]})</span>{opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop:'1.2rem', display:'flex', justifyContent:'flex-end' }}>
        <button className="btn btn-primary" onClick={()=>setExamPart(2)} disabled={!canAdvanceP1}>
          Continuar → Parte II <ChevronRight size={18}/>
        </button>
      </div>
      {!canAdvanceP1 && <p style={{ textAlign:'right', fontSize:'0.73rem', color:'var(--text-muted)', marginTop:'0.35rem' }}>
        {19-Object.keys(p1Answers).length} sin responder
      </p>}
    </motion.div>
  );

  // ════════════════════════════════════════════
  // PARTE II — preguntas abiertas
  // ════════════════════════════════════════════
  if (examPart === 2) return (
    <motion.div initial={vIn} animate={vAn}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.65rem' }}>
        <div>
          <h3 style={{ marginBottom:'0.1rem', fontSize:'0.98rem' }}>Parte II — Criterio y Rol</h3>
          <p style={{ margin:0, fontSize:'0.76rem', color:'var(--text-muted)' }}>Pregunta {p2Idx+1} de {PART_II.length}</p>
        </div>
        <div style={{ background:'rgba(230,57,70,0.12)', borderRadius:'8px', padding:'0.45rem 0.75rem', textAlign:'center', border:'1px solid rgba(230,57,70,0.3)' }}>
          <div style={{ fontWeight:700, color:'var(--nmx-red)' }}>{p2Idx+1}/{PART_II.length}</div>
        </div>
      </div>

      <div style={{ height:'3px', background:'rgba(255,255,255,0.07)', borderRadius:'2px', marginBottom:'0.9rem' }}>
        <div style={{ height:'100%', width:`${(p2Idx/PART_II.length)*100}%`, background:'var(--nmx-red)', borderRadius:'2px', transition:'width 0.35s' }}/>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`p2-${p2Idx}`} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}>
          {/* Cronómetro P2 */}
          <div style={{ marginBottom:'0.75rem' }}>
            <TimerBar remaining={p2Timer} total={P2_SECS} />
          </div>

          <div style={{ background:'rgba(230,57,70,0.06)', border:'1px solid rgba(230,57,70,0.2)', borderRadius:'10px', padding:'1rem', marginBottom:'0.9rem' }}>
            <div style={{ fontSize:'0.7rem', color:'var(--nmx-red)', fontWeight:700, marginBottom:'0.3rem' }}>PREGUNTA {currentP2Q?.id}</div>
            <div style={{ fontWeight:600, fontSize:'0.97rem', lineHeight:1.45 }}>{currentP2Q?.q}</div>
          </div>

          <textarea className="form-textarea" placeholder="Escribe tu respuesta aquí..." value={p2Answers[currentP2Q?.id]||''}
            onChange={e=>setP2Answers(prev=>({...prev,[currentP2Q.id]:e.target.value}))} autoFocus style={{ minHeight:'95px', resize:'vertical' }}/>
          <div style={{ fontSize:'0.7rem', color:canAdvanceP2?'var(--nmx-green)':'var(--text-muted)', marginTop:'0.2rem' }}>
            {(p2Answers[currentP2Q?.id]||'').length} chars {!canAdvanceP2?'(mín. 10)':'✓'}
          </div>
        </motion.div>
      </AnimatePresence>

      <div style={{ marginTop:'1rem', display:'flex', justifyContent:'space-between' }}>
        <button className="btn btn-secondary" style={{ fontSize:'0.83rem' }}
          onClick={()=>{ if(p2Idx>0) setP2Idx(i=>i-1); else setExamPart(1); }}>
          <ChevronLeft size={16}/> Atrás
        </button>
        <button className="btn btn-primary" onClick={()=>advanceP2(false)} disabled={!canAdvanceP2}>
          {p2Idx<PART_II.length-1?'Siguiente':'Ir a Parte III ⚡'} <ChevronRight size={18}/>
        </button>
      </div>
    </motion.div>
  );

  // ════════════════════════════════════════════
  // PARTE III — Anti-IA rapid fire
  // ════════════════════════════════════════════
  if (examPart === 3) return (
    <motion.div initial={vIn} animate={vAn} style={{ textAlign:'center' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
        <div style={{ textAlign:'left' }}>
          <h3 style={{ marginBottom:'0.1rem', color:'#f39c12', fontSize:'0.98rem' }}>⚡ Parte III — Filtro Anti-IA</h3>
          <p style={{ margin:0, fontSize:'0.76rem', color:'var(--text-muted)' }}>Responde en menos de 15 segundos</p>
        </div>
        <div style={{ fontWeight:700, color:'#f39c12' }}>{p3Idx+1}/{PART_III.length}</div>
      </div>

      <div style={{ height:'3px', background:'rgba(255,255,255,0.07)', borderRadius:'2px', marginBottom:'1.2rem' }}>
        <div style={{ height:'100%', width:`${(p3Idx/PART_III.length)*100}%`, background:'#f39c12', borderRadius:'2px', transition:'width 0.35s' }}/>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={`p3-${p3Idx}`} initial={{opacity:0,scale:0.97}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.97}}>
          {/* Cronómetro grande P3 */}
          <div style={{ marginBottom:'1rem', display:'flex', justifyContent:'center' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', background:'rgba(243,156,18,0.1)', borderRadius:'8px', padding:'0.55rem 1rem', border:'1px solid rgba(243,156,18,0.3)', minWidth:'160px' }}>
              <Zap size={16} color="#f39c12"/>
              <TimerBar remaining={p3Timer} total={P3_SECS} large />
            </div>
          </div>

          <div style={{ background:'rgba(243,156,18,0.07)', border:'2px solid rgba(243,156,18,0.35)', borderRadius:'14px', padding:'1.2rem', marginBottom:'1rem' }}>
            <div style={{ fontSize:'0.68rem', fontWeight:700, color:'#f39c12', marginBottom:'0.4rem', textTransform:'uppercase', letterSpacing:'0.06em' }}>Pregunta {currentP3Q?.id}</div>
            <div style={{ fontSize:'1.08rem', fontWeight:700, lineHeight:1.4, marginBottom:'0.55rem' }}>{currentP3Q?.q}</div>
            <div style={{ fontSize:'0.76rem', color:'rgba(243,156,18,0.7)', fontStyle:'italic' }}>💡 {currentP3Q?.hint}</div>
          </div>

          <input type="text" className="form-input" placeholder="Tu respuesta rápida..." value={p3Input}
            onChange={e=>setP3Input(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&p3Input.trim()) advanceP3(false); }}
            autoFocus style={{ textAlign:'center', fontSize:'1.02rem', fontWeight:600, marginBottom:'0.85rem' }}/>

          <button className="btn btn-primary btn-block" onClick={()=>advanceP3(false)} disabled={!p3Input.trim()}
            style={{ background:'#f39c12', boxShadow:'0 4px 14px rgba(243,156,18,0.22)' }}>
            {p3Idx<PART_III.length-1?'Siguiente ⚡':'Finalizar Examen ✓'}
          </button>
        </motion.div>
      </AnimatePresence>

      {Object.values(p3Suspicious).some(Boolean)&&(
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(243,156,18,0.07)', border:'1px solid rgba(243,156,18,0.25)', borderRadius:'7px', padding:'0.55rem 0.8rem', marginTop:'0.9rem', textAlign:'left' }}>
          <AlertTriangle size={14} color="#f39c12"/>
          <span style={{ fontSize:'0.76rem', color:'#f39c12' }}>Algunas respuestas tardaron más de 15s — el staff será notificado.</span>
        </div>
      )}
    </motion.div>
  );

  return null;
}
