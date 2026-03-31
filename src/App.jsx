import React, { useState, useEffect } from 'react';
import ApplicationForm from './components/ApplicationForm';
import { supabase } from './lib/supabase';
import { LogIn } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleDiscordLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: 'https://vonssyb.github.io/nacionmx-staff/'
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logueando con Discord:', error);
      alert('Hubo un error al conectar con Discord');
    }
  };

  if (loading) {
    return (
      <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando conexión...</p>
      </div>
    );
  }

  // Ruta base segura para produccion y local
  const logoPath = import.meta.env.BASE_URL + 'logo.png';

  return (
    <div className="app-container">
      <div className="header-logo">
        {/* Placeholder estético que pedirá logo en la carpeta public de github */}
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--nmx-red)', overflow: 'hidden', padding: '4px' }}>
          <img 
            src={logoPath}
            alt="NaciónMX Logo" 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 60%', border: 'none', boxShadow: 'none' }}
            onError={(e) => {
               e.target.style.display = 'none';
               e.target.parentElement.innerHTML = '<span style="font-size: 0.7rem; color: #adb5bd;">Pon logo.png<br/>en /public</span>';
            }}
          />
        </div>
        <h1>Postulaciones Staff</h1>
        <p>Únete al equipo administrativo de NaciónMX y ayuda a moderar la comunidad.</p>
      </div>
      
      {!session ? (
        <div className="glass-panel text-center" style={{ maxWidth: '400px', margin: '2rem auto' }}>
          <h2 className="mb-4 text-main" style={{ fontSize: '1.4rem' }}>Autenticación Requerida</h2>
          <p className="mb-4">Para garantizar la seguridad de tu postulación y validar tu identidad oficial, necesitas enlazar tu cuenta de Discord.</p>
          <button className="btn btn-primary btn-block" onClick={handleDiscordLogin} style={{ background: '#5865F2', boxShadow: '0 4px 14px rgba(88, 101, 242, 0.3)' }}>
            <LogIn size={20} /> Entrar con Discord
          </button>
        </div>
      ) : (
        <ApplicationForm user={session.user} />
      )}
    </div>
  );
}

export default App;
