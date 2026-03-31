import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  LogOut, RefreshCw, CheckCircle, XCircle, Clock, Eye,
  ChevronDown, ChevronUp, AlertTriangle, Shield, Users,
  X, Search, Calendar, ArrowUpDown, Award, MessageSquare,
  Zap, BookOpen, FileText
} from 'lucide-react';

const OWNER_ID = '826637667718266880';

const STATUS = {
  pending:      { label: 'Pendiente',   color: '#f39c12', bg: 'rgba(243,156,18,0.15)'  },
  under_review: { label: 'En revisión', color: '#3498db', bg: 'rgba(52,152,219,0.15)'  },
  approved:     { label: 'Aprobado',    color: '#2ecc71', bg: 'rgba(46,204,113,0.15)'  },
  rejected:     { label: 'Rechazado',   color: '#E63946', bg: 'rgba(230,57,70,0.15)'   },
};

const SCORE_COLOR = s => s >= 27 ? '#2ecc71' : s >= 22 ? '#3498db' : s >= 18 ? '#e67e22' : '#E63946';
const SCORE_LABEL = s => s >= 27 ? '⭐ Excelencia' : s >= 22 ? 'Entrenamiento' : s >= 18 ? 'A prueba' : 'Rechazado';

const PART_I_OPTS  = [1,2,1,2,1,3,0,2,1,0,1,2,1,2,2,1,1,3,2];
const PART_I_Q  = ["¿Qué significa IRL-X?","Usar info de Discord en el rol","¿Cuál es un SCN?","Arrestar sin rol previo","¿Cuándo es válido un MD IC?","¿Falta grave automática?","Saltar (BH) constantemente","Bug para atravesar paredes","Tomar rango sin proceso","Matar sin rol ni motivo","¿Qué recuerda tras un PK?","¿Qué implica un CK?","EMS en servicio recibe CK","Crímenes de alto riesgo","Cuándo es válido un secuestro","Golpe de estado IC requiere","Arrestar legalmente requiere","¿Detener escena para reportar?","Mod entra con :view"];
const PART_II_Q = ["¿Cuándo aplicarías un CK forzado?","¿Diferencia entre IRL-X y EXR?","¿Cuándo se justifica un BL-T?","¿Por qué no imponer acciones en rol?","¿Valores de un buen staff?"];
const PART_III_Q = ["10 peces, 5 se ahogan. ¿Cuántos quedan?","Avión cae en frontera. ¿Dónde entierran sobrevivientes?","¿Cuántas 'R' tiene 'PIRATA'?","Sandía de 10kg sobre papel bond. ¿Qué pasa?","2 madres, 2 hijas, 3 cafés, todas reciben uno. ¿Cómo?","Hombre calvo bajo la lluvia. ¿Se moja el pelo?"];

// ── Gauge circular ──────────────────────────────────────────
function ScoreGauge({ score, max = 25, size = 64 }) {
  const pct = score / max;
  const r   = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = SCORE_COLOR(score);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={6}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease', filter: `drop-shadow(0 0 4px ${color}88)` }}/>
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ fill: color, fontSize: size < 70 ? '0.78rem' : '1rem', fontWeight: 800, transform: 'rotate(90deg)', transformOrigin: `${size/2}px ${size/2}px` }}>
        {score}/{max}
      </text>
    </svg>
  );
}

// ── Badge ───────────────────────────────────────────────────
function Badge({ status }) {
  const c = STATUS[status] || STATUS.pending;
  return <span style={{ background: c.bg, color: c.color, borderRadius: '20px', padding: '0.18rem 0.7rem', fontSize: '0.72rem', fontWeight: 700, border: `1px solid ${c.color}44`, whiteSpace: 'nowrap' }}>{c.label}</span>;
}

// ── Stat card animada ────────────────────────────────────────
function StatCard({ icon, label, value, color, active, onClick }) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ background: active ? `${color}18` : 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '1.1rem 1.25rem', border: `1px solid ${active ? color : 'rgba(255,255,255,0.07)'}`, flex: 1, minWidth: '110px', cursor: 'pointer', transition: 'background 0.25s, border-color 0.25s' }}>
      <div style={{ color, marginBottom: '0.5rem', opacity: active ? 1 : 0.7 }}>{icon}</div>
      <div style={{ fontSize: '1.7rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{label}</div>
    </motion.div>
  );
}

// ── Modal detalle ────────────────────────────────────────────
function AppModal({ app, onClose, onUpdate }) {
  const [note, setNote]   = useState(app.review_notes || '');
  const [busy, setBusy]   = useState(false);
  const [tab, setTab]     = useState('p1');

  const act = async (status) => {
    setBusy(true);
    const { error } = await supabase.from('staff_applications').update({
      status, reviewed_by: OWNER_ID,
      reviewed_by_username: 'vonssyb',
      reviewed_at: new Date().toISOString(),
      review_notes: note || null,
    }).eq('id', app.id);
    setBusy(false);
    if (!error) { onUpdate(app.id, status); onClose(); }
    else alert('Error: ' + error.message);
  };

  const p1 = app.part1_answers || {};
  const p2 = app.part2_answers || {};
  const p3 = app.part3_answers || {};
  const pt = app.part3_times   || {};
  const sf = app.suspicious_flags || [];
  const p1correct = PART_I_OPTS.reduce((s,a,i) => s + (p1[i+1] === a ? 1 : 0), 0);

  const TABS = [
    { key:'p1', label:'Parte I', icon:<BookOpen size={14}/> },
    { key:'p2', label:'Parte II', icon:<FileText size={14}/> },
    { key:'p3', label:'Anti-IA ⚡', icon:<Zap size={14}/> },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ opacity:0, scale:0.93, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.93 }}
        onClick={e=>e.stopPropagation()}
        style={{ background:'#0d0d12', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'20px', width:'100%', maxWidth:'700px', maxHeight:'90vh', overflowY:'auto', display:'flex', flexDirection:'column' }}>

        {/* ── Header modal ── */}
        <div style={{ background:'linear-gradient(135deg, rgba(230,57,70,0.12), rgba(88,101,242,0.08))', borderRadius:'20px 20px 0 0', padding:'1.5rem', borderBottom:'1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'0.4rem' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'rgba(88,101,242,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#5865F2', fontSize:'1.1rem' }}>
                  {(app.discord_username?.[0]||'?').toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin:0, lineHeight:1 }}>@{app.discord_username}</h3>
                  {app.roblox_username && <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Roblox: @{app.roblox_username}</span>}
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginTop:'0.4rem' }}>
                <Badge status={app.status}/>
                {sf.length>0 && <span style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.72rem', color:'#f39c12' }}><AlertTriangle size={11}/>{sf.length} sospechosa(s)</span>}
                <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>
                  {new Date(app.created_at).toLocaleString('es-MX',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                </span>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'flex-start', gap:'1rem' }}>
              {/* Gauge */}
              <div style={{ textAlign:'center' }}>
                <ScoreGauge score={app.auto_score||0} max={25} size={72}/>
                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>{SCORE_LABEL(app.auto_score||0)}</div>
              </div>
              <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)', border:'none', cursor:'pointer', color:'#adb5bd', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={16}/></button>
            </div>
          </div>

          {/* Mini stats */}
          <div style={{ display:'flex', gap:'0.6rem', marginTop:'1rem', flexWrap:'wrap' }}>
            {[
              ['Parte I', `${p1correct}/19`, '#5865F2'],
              ['Auto-Score', `${app.auto_score||0}/25`, SCORE_COLOR(app.auto_score||0)],
              ['Respondidas P2', `${Object.keys(p2).length}/5`, 'var(--nmx-red)'],
              ['Flags IA', sf.length, sf.length?'#f39c12':'#2ecc71'],
            ].map(([l,v,c])=>(
              <div key={l} style={{ background:'rgba(255,255,255,0.05)', borderRadius:'8px', padding:'0.5rem 0.85rem', flex:'1', minWidth:'100px', textAlign:'center' }}>
                <div style={{ fontWeight:700, color:c, fontSize:'1rem' }}>{v}</div>
                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:'0', borderBottom:'1px solid rgba(255,255,255,0.07)', padding:'0 1.5rem' }}>
          {TABS.map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} style={{ padding:'0.75rem 1rem', display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.83rem', fontWeight:tab===t.key?700:400, background:'none', border:'none', cursor:'pointer', color:tab===t.key?'var(--nmx-red)':'var(--text-muted)', borderBottom:`2px solid ${tab===t.key?'var(--nmx-red)':'transparent'}`, transition:'all 0.2s', marginBottom:'-1px' }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── Contenido tabs ── */}
        <div style={{ padding:'1.25rem 1.5rem', flex:1 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-6}} transition={{duration:0.18}}>

              {tab==='p1' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                  {PART_I_Q.map((q,i)=>{
                    const qId=i+1, ans=p1[qId], ok=ans===PART_I_OPTS[i];
                    return (
                      <div key={qId} style={{ display:'flex', alignItems:'center', gap:'0.6rem', padding:'0.45rem 0.6rem', borderRadius:'7px', background: ok?'rgba(46,204,113,0.05)':'rgba(230,57,70,0.05)', border:`1px solid ${ok?'rgba(46,204,113,0.15)':'rgba(230,57,70,0.15)'}` }}>
                        <span style={{ fontWeight:700, minWidth:'18px', color: ok?'#2ecc71':'#E63946', fontSize:'0.8rem' }}>{ok?'✓':'✗'}</span>
                        <span style={{ flex:1, fontSize:'0.78rem', color:'var(--text-muted)' }}>P{qId}. {q}</span>
                        <span style={{ fontWeight:700, minWidth:'20px', textAlign:'center', fontSize:'0.8rem', color: ok?'#2ecc71':'#E63946' }}>
                          {ans!==undefined?['A','B','C','D'][ans]:'—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab==='p2' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
                  {PART_II_Q.map((q,i)=>{
                    const qId=i+20, resp=p2[qId];
                    return (
                      <div key={qId} style={{ borderRadius:'10px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ background:'rgba(230,57,70,0.08)', padding:'0.55rem 0.85rem', fontSize:'0.73rem', color:'var(--nmx-red)', fontWeight:600 }}>P{qId}: {q}</div>
                        <div style={{ padding:'0.7rem 0.85rem', fontSize:'0.85rem', lineHeight:1.55, color:resp?'#fff':'var(--text-muted)', fontStyle:resp?'normal':'italic', background:'rgba(255,255,255,0.02)' }}>
                          {resp||'Sin respuesta'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {tab==='p3' && (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
                  {PART_III_Q.map((q,i)=>{
                    const qId=i+25, resp=p3[qId], t=pt[qId], susp=sf.includes(qId);
                    return (
                      <div key={qId} style={{ borderRadius:'10px', overflow:'hidden', border:`1px solid ${susp?'rgba(243,156,18,0.35)':'rgba(255,255,255,0.07)'}`, background:susp?'rgba(243,156,18,0.05)':'rgba(255,255,255,0.02)' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.55rem 0.85rem', background:'rgba(243,156,18,0.08)' }}>
                          <span style={{ fontSize:'0.73rem', color:'#f39c12', fontWeight:600 }}>P{qId}: {q}</span>
                          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                            {susp && <span style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'0.7rem', color:'#f39c12' }}><AlertTriangle size={11}/>Sospechosa</span>}
                            <span style={{ fontSize:'0.72rem', color:susp?'#f39c12':'#2ecc71', fontWeight:700, background:susp?'rgba(243,156,18,0.15)':'rgba(46,204,113,0.15)', padding:'0.1rem 0.4rem', borderRadius:'4px' }}>
                              {t?`${t}s`:'—'}
                            </span>
                          </div>
                        </div>
                        <div style={{ padding:'0.6rem 0.85rem', fontSize:'0.85rem', color:resp?'#fff':'var(--text-muted)', fontStyle:resp?'normal':'italic' }}>
                          {resp||'Sin respuesta'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Acciones ── */}
        <div style={{ padding:'1.25rem 1.5rem', borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(255,255,255,0.02)' }}>
          <textarea value={note} onChange={e=>setNote(e.target.value)} className="form-textarea"
            placeholder="Nota interna (opcional, visible solo para staff)..."
            style={{ minHeight:'65px', marginBottom:'0.75rem', resize:'vertical' }}/>
          {(app.status==='pending'||app.status==='under_review') ? (
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="btn btn-success" style={{ flex:1 }} onClick={()=>act('approved')} disabled={busy}>
                <CheckCircle size={16}/> {busy?'Guardando...':'Aprobar'}
              </button>
              <motion.button whileTap={{ scale: 0.97 }}
                style={{ flex:1, padding:'0.65rem 1rem', borderRadius:'8px', background:'rgba(230,57,70,0.15)', color:'#E63946', border:'1px solid rgba(230,57,70,0.45)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', fontWeight:600, fontSize:'0.9rem' }}
                onClick={()=>act('rejected')} disabled={busy}>
                <XCircle size={16}/> {busy?'Guardando...':'Rechazar'}
              </motion.button>
            </div>
          ) : (
            <div style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.82rem', padding:'0.6rem', background:'rgba(255,255,255,0.03)', borderRadius:'8px' }}>
              Ya revisado · {app.review_notes && <em style={{ color: '#fff' }}>"{app.review_notes}"</em>}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Panel principal ──────────────────────────────────────────
export default function AdminPanel({ user, onSignOut }) {
  const discordId = user.identities?.find(i => i.provider === 'discord')?.id;
  const isOwner   = discordId === OWNER_ID;

  const [apps, setApps]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [sort, setSort]         = useState('newest');
  const [selected, setSelected] = useState(null);

  const fetch = async () => {
    setLoading(true);
    setFetchError('');
    // RPC retorna JSON puro para evitar que RLS bloquee SETOF staff_applications
    const { data, error } = await supabase.rpc('get_all_staff_applications');
    if (error) {
      console.error('[Admin] Supabase error:', error);
      setFetchError(error.message);
    } else {
      // data puede ser el array directamente o un JSON string
      const parsed = Array.isArray(data) ? data : (typeof data === 'string' ? JSON.parse(data) : (data || []));
      setApps(parsed);
    }
    setLoading(false);
  };

  useEffect(() => { if (isOwner) fetch(); }, [isOwner]);

  const onUpdate = (id, newStatus) => setApps(p => p.map(a => a.id===id?{...a,status:newStatus}:a));

  const filtered = useMemo(() => {
    let list = filter==='all' ? apps : apps.filter(a => a.status===filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(a => (a.discord_username||'').toLowerCase().includes(q) || (a.roblox_username||'').toLowerCase().includes(q));
    }
    if (sort==='score_high') list = [...list].sort((a,b) => (b.auto_score||0)-(a.auto_score||0));
    if (sort==='score_low')  list = [...list].sort((a,b) => (a.auto_score||0)-(b.auto_score||0));
    if (sort==='newest')     list = [...list].sort((a,b) => new Date(b.created_at)-new Date(a.created_at));
    if (sort==='oldest')     list = [...list].sort((a,b) => new Date(a.created_at)-new Date(b.created_at));
    return list;
  }, [apps, filter, search, sort]);

  const stats = {
    total:    apps.length,
    pending:  apps.filter(a=>a.status==='pending').length,
    approved: apps.filter(a=>a.status==='approved').length,
    rejected: apps.filter(a=>a.status==='rejected').length,
  };

  const avgScore = apps.length ? Math.round(apps.reduce((s,a)=>s+(a.auto_score||0),0)/apps.length) : 0;

  if (!isOwner) return (
    <div className="glass-panel text-center" style={{ maxWidth:'420px', margin:'3rem auto' }}>
      <Shield size={60} color="var(--nmx-red)" style={{ margin:'0 auto 1rem' }}/>
      <h2>Acceso Denegado</h2>
      <p className="mb-4">No tienes permisos de administrador.</p>
      <button className="btn btn-secondary" onClick={onSignOut}><LogOut size={15}/> Salir</button>
    </div>
  );

  return (
    <div style={{ maxWidth:'960px', margin:'0 auto', padding:'2rem 1rem' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2rem' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.65rem', marginBottom:'0.3rem' }}>
            <div style={{ width:'38px', height:'38px', borderRadius:'10px', background:'rgba(230,57,70,0.15)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(230,57,70,0.3)' }}>
              <Shield size={20} color="var(--nmx-red)"/>
            </div>
            <h2 style={{ margin:0, fontSize:'1.5rem' }}>Panel de Administrador</h2>
          </div>
          <p style={{ margin:0, fontSize:'0.8rem', color:'var(--text-muted)' }}>
            Postulaciones Staff · NaciónMX RP
            {!loading && <> · <span style={{ color:'var(--nmx-red)' }}>Puntaje promedio: {avgScore}/25</span></>}
          </p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button className="btn btn-secondary" style={{ fontSize:'0.8rem', padding:'0.45rem 0.85rem' }} onClick={fetch} disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading?'spin 1s linear infinite':'' }}/> Actualizar
          </button>
          <button className="btn btn-secondary" style={{ fontSize:'0.8rem', padding:'0.45rem 0.85rem' }} onClick={onSignOut}>
            <LogOut size={13}/> Salir
          </button>
        </div>
      </div>

      {/* ── Stats clickeables ── */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.75rem', flexWrap:'wrap' }}>
        <StatCard icon={<Users size={20}/>} label="Total" value={stats.total} color="#5865F2"
          active={filter==='all'} onClick={()=>setFilter('all')}/>
        <StatCard icon={<Clock size={20}/>} label="Pendientes" value={stats.pending} color="#f39c12"
          active={filter==='pending'} onClick={()=>setFilter('pending')}/>
        <StatCard icon={<CheckCircle size={20}/>} label="Aprobados" value={stats.approved} color="#2ecc71"
          active={filter==='approved'} onClick={()=>setFilter('approved')}/>
        <StatCard icon={<XCircle size={20}/>} label="Rechazados" value={stats.rejected} color="#E63946"
          active={filter==='rejected'} onClick={()=>setFilter('rejected')}/>
      </div>

      {/* ── Búsqueda + sort ── */}
      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:'200px', position:'relative' }}>
          <Search size={15} style={{ position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por usuario..."
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'0.5rem 0.75rem 0.5rem 2.2rem', color:'#fff', fontSize:'0.85rem', outline:'none', boxSizing:'border-box' }}/>
        </div>
        <div style={{ position:'relative' }}>
          <ArrowUpDown size={13} style={{ position:'absolute', left:'0.7rem', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
          <select value={sort} onChange={e=>setSort(e.target.value)}
            style={{ appearance:'none', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'0.5rem 2rem 0.5rem 2.2rem', color:'#fff', fontSize:'0.83rem', cursor:'pointer' }}>
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguas</option>
            <option value="score_high">Mayor puntaje</option>
            <option value="score_low">Menor puntaje</option>
          </select>
        </div>
      </div>

      {/* ── Error / Debug ── */}
      {fetchError && (
        <div style={{ background:'rgba(230,57,70,0.1)', border:'1px solid rgba(230,57,70,0.35)', borderRadius:'10px', padding:'1rem', marginBottom:'1rem', fontSize:'0.82rem' }}>
          <strong style={{ color:'#E63946' }}>Error de Supabase:</strong>
          <code style={{ display:'block', marginTop:'0.3rem', color:'#f8a5a5', wordBreak:'break-all' }}>{fetchError}</code>
          <div style={{ marginTop:'0.5rem', color:'var(--text-muted)', fontSize:'0.75rem' }}>
            Tu Discord ID detectado: <code style={{ color:'#f39c12' }}>{discordId || 'no encontrado'}</code>
          </div>
        </div>
      )}

      {/* ── Lista ── */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-muted)' }}>
          <RefreshCw size={32} style={{ animation:'spin 1s linear infinite', margin:'0 auto 1rem', display:'block', opacity:0.5 }}/>
          Cargando postulaciones...
        </div>
      ) : filtered.length===0 ? (
        <div style={{ textAlign:'center', padding:'3.5rem', color:'var(--text-muted)', background:'rgba(255,255,255,0.02)', borderRadius:'14px', border:'1px dashed rgba(255,255,255,0.08)' }}>
          <MessageSquare size={36} style={{ margin:'0 auto 0.75rem', opacity:0.35, display:'block' }}/>
          No hay postulaciones {search ? 'que coincidan' : filter!=='all'?`con estado "${filter}"`:''}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
          <AnimatePresence>
            {filtered.map((app, idx) => (
              <motion.div key={app.id}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, x:-20 }}
                transition={{ delay: idx * 0.03 }}
                onClick={()=>setSelected(app)}
                style={{ background:'rgba(255,255,255,0.04)', borderRadius:'13px', padding:'1rem 1.25rem', border:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', gap:'1.1rem', cursor:'pointer', transition:'all 0.2s' }}
                whileHover={{ background:'rgba(255,255,255,0.065)', borderColor:'rgba(230,57,70,0.35)', x: 3 }}
                whileTap={{ scale:0.99 }}
              >
                {/* Avatar */}
                <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'linear-gradient(135deg, rgba(88,101,242,0.3), rgba(230,57,70,0.2))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontWeight:800, color:'#fff', fontSize:'1.1rem', border:'1px solid rgba(255,255,255,0.1)' }}>
                  {(app.discord_username?.[0]||'?').toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:'0.92rem', marginBottom:'0.2rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    @{app.discord_username}
                    {app.roblox_username && <span style={{ color:'var(--text-muted)', fontWeight:400, fontSize:'0.78rem', marginLeft:'0.45rem' }}>· {app.roblox_username}</span>}
                  </div>
                  <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', alignItems:'center' }}>
                    <Badge status={app.status}/>
                    {(app.suspicious_flags||[]).length>0 && (
                      <span style={{ fontSize:'0.7rem', color:'#f39c12', display:'flex', alignItems:'center', gap:'0.2rem' }}>
                        <AlertTriangle size={10}/>{app.suspicious_flags.length}
                      </span>
                    )}
                    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.2rem' }}>
                      <Calendar size={10}/>
                      {new Date(app.created_at).toLocaleDateString('es-MX',{day:'2-digit',month:'short'})}
                    </span>
                  </div>
                </div>

                {/* Gauge pequeño */}
                <div style={{ flexShrink:0, textAlign:'center' }}>
                  <ScoreGauge score={app.auto_score||0} max={25} size={54}/>
                </div>

                {/* Flecha */}
                <div style={{ flexShrink:0, width:'28px', height:'28px', borderRadius:'50%', background:'rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Eye size={13} color="var(--text-muted)"/>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selected && <AppModal app={selected} onClose={()=>setSelected(null)} onUpdate={onUpdate}/>}
      </AnimatePresence>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
