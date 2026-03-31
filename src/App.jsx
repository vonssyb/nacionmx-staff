import React, { useState, useEffect } from 'react';
import ApplicationForm from './components/ApplicationForm';
import AdminPanel from './components/AdminPanel';
import { supabase } from './lib/supabase';
import { LogIn } from 'lucide-react';

const OWNER_DISCORD_ID = '826637667718266880';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.hash === '#/admin' || window.location.pathname.endsWith('/admin')
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    // Escuchar cambios de hash
    const handleHash = () => {
      setIsAdminRoute(
        window.location.hash === '#/admin' || window.location.pathname.endsWith('/admin')
      );
    };
    window.addEventListener('hashchange', handleHash);
    return () => { subscription.unsubscribe(); window.removeEventListener('hashchange', handleHash); };
  }, []);

  const handleDiscordLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          scopes: 'identify email guilds.members.read',
          redirectTo: isAdminRoute
            ? 'https://vonssyb.github.io/nacionmx-staff/#/admin'
            : 'https://vonssyb.github.io/nacionmx-staff/',
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logueando con Discord:', error);
      alert('Hubo un error al conectar con Discord');
    }
  };

  const signOut = async () => { await supabase.auth.signOut(); };

  if (loading) return (
    <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <p>Cargando conexión...</p>
    </div>
  );

  // ── RUTA ADMIN ──────────────────────────────────────────
  if (isAdminRoute) {
    const discordId = session?.user?.identities?.find(i => i.provider === 'discord')?.id;
    const isOwner   = discordId === OWNER_DISCORD_ID;

    if (!session) return (
      <div className="app-container">
        <div className="glass-panel text-center" style={{ maxWidth: '400px', margin: '2rem auto' }}>
          <h2 className="mb-4 text-main" style={{ fontSize: '1.3rem' }}>🛡️ Acceso Admin</h2>
          <p className="mb-4">Inicia sesión con Discord para acceder al panel de administración.</p>
          <button className="btn btn-primary btn-block" onClick={handleDiscordLogin}
            style={{ background: '#5865F2', boxShadow: '0 4px 14px rgba(88,101,242,0.3)' }}>
            <LogIn size={20} /> Entrar con Discord
          </button>
        </div>
      </div>
    );

    if (!isOwner) return (
      <div className="app-container">
        <div className="glass-panel text-center" style={{ maxWidth: '400px', margin: '2rem auto' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚫</p>
          <h2>Sin acceso</h2>
          <p className="mb-4">Tu cuenta no tiene permisos de administrador.</p>
          <button className="btn btn-secondary" onClick={signOut}>Cerrar sesión</button>
        </div>
      </div>
    );

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-dark)', padding: '1rem 0' }}>
        <AdminPanel user={session.user} onSignOut={signOut} />
      </div>
    );
  }

  // ── RUTA NORMAL (formulario) ─────────────────────────────
  const logoPath = import.meta.env.BASE_URL + 'logo.png';

  return (
    <div className="app-container">
      <div className="header-logo">
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed var(--nmx-red)', overflow: 'hidden', padding: '4px' }}>
          <img
            src={logoPath}
            alt="NaciónMX Logo"
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center 60%', border: 'none', boxShadow: 'none' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<span style="font-size:0.7rem;color:#adb5bd;">Pon logo.png<br/>en /public</span>';
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
          <button className="btn btn-primary btn-block" onClick={handleDiscordLogin}
            style={{ background: '#5865F2', boxShadow: '0 4px 14px rgba(88, 101, 242, 0.3)' }}>
            <LogIn size={20} /> Entrar con Discord
          </button>
        </div>
      ) : (
        <ApplicationForm user={session.user} providerToken={session.provider_token} />
      )}
    </div>
  );
}

export default App;
