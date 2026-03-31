import React from 'react';
import ApplicationForm from './components/ApplicationForm';

function App() {
  return (
    <div className="app-container">
      <div className="header-logo">
        <img 
          src="https://cdn.discordapp.com/icons/584218973686300673/a_4a3eaf861b17b2ed57da8e5cd044c59a.gif" 
          alt="NaciónMX Logo" 
        />
        <h1>Postulaciones Staff</h1>
        <p>Únete al equipo administrativo de NaciónMX y ayuda a moderar la comunidad.</p>
      </div>
      
      <ApplicationForm />
    </div>
  );
}

export default App;
