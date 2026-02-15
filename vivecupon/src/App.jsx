import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css'; 

// Fix de Iconos de Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// --- CONFIGURACIÓN ---
// 👈 INGENIERO: Cambia esto por tu correo real de acceso para habilitar el botón de Admin
const ADMIN_EMAIL = "tu-correo@ejemplo.com"; 

function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center[0] && center[1]) {
      map.setView(center, 14);
    }
  }, [center]);
  return null;
}

function App() {
  const [session, setSession] = useState(null);
  const [ubicacionUsuario, setUbicacionUsuario] = useState({ lat: -33.4489, lon: -70.6693 });
  const [cupones, setCupones] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrarAuthModal, setMostrarAuthModal] = useState(false);
  const [modoAdmin, setModoAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modoRegistro, setModoRegistro] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(false);

  // 1. Sesión y Geolocalización
  useEffect(() => {
    // Obtener sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    
    // Escuchar cambios de auth (Login/Logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) setMostrarAuthModal(false); // Cierra modal automáticamente al entrar
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setUbicacionUsuario({ lat: p.coords.latitude, lon: p.coords.longitude }),
        null, { timeout: 5000 }
      );
    }
    return () => { authListener?.subscription?.unsubscribe(); };
  }, []);

  // 2. Cargar Datos
  const fetchCupones = async () => {
    const { data, error } = await supabase.from('cupones').select('*');
    if (error) console.error(error.message);
    else setCupones(data || []);
  };

  useEffect(() => { fetchCupones(); }, []);

  // 3. Handlers de Autenticación
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        // PASO 1 LOGRADO: Esto asegura que Google te devuelva a localhost:5173
        redirectTo: window.location.origin 
      }
    });
    if (error) alert("Error: Revisa la consola para más detalles.");
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    const { error } = modoRegistro 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoadingAuth(false);
  };

  // 4. Lógica de Admin
  const handleAgregar = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const { error } = await supabase.from('cupones').insert([{
      titulo: fd.get('titulo'),
      descripcion: fd.get('descripcion'),
      codigo_promo: fd.get('codigo'),
      latitud: parseFloat(fd.get('lat')),
      longitud: parseFloat(fd.get('lon')),
      es_activo: true
    }]);
    if (error) alert(error.message); else { e.target.reset(); fetchCupones(); }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿Eliminar este beneficio permanentemente?")) {
      await supabase.from('cupones').delete().eq('id', id);
      fetchCupones();
    }
  };

  const cuponesFiltrados = (cupones || []).filter(c => 
    c?.titulo?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="app-container">
      <header className="main-header">
        <div className="header-container">
          <div onClick={() => setModoAdmin(false)} style={{cursor:'pointer'}}>
            <h2 style={{margin: 0}}>🎟️ ViveCoupon</h2>
            {session && (
              <small style={{display: 'block', fontSize: '0.8rem', opacity: 0.9}}>
                Hola, {session.user.user_metadata.full_name || session.user.email}
              </small>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {session?.user?.email === ADMIN_EMAIL && (
              <button onClick={() => setModoAdmin(!modoAdmin)} className="btn btn-admin">
                {modoAdmin ? 'Ver Mapa' : '⚙️ Admin'}
              </button>
            )}
            <button onClick={() => session ? supabase.signOut() : setMostrarAuthModal(true)} className="btn btn-white">
              {session ? 'Salir' : 'Entrar'}
            </button>
          </div>
        </div>
        {!modoAdmin && <input placeholder="🔍 Buscar beneficios locales..." className="search-bar" onChange={e => setBusqueda(e.target.value)} />}
      </header>

      {modoAdmin ? (
        <div className="admin-container" style={{maxWidth: '1100px', margin: '20px auto', padding: '0 20px'}}>
          <form onSubmit={handleAgregar} className="admin-card" style={{textAlign: 'left'}}>
            <h3>➕ Nuevo Beneficio</h3>
            <input name="titulo" placeholder="Nombre del Local" required className="input-field" />
            <input name="descripcion" placeholder="Descripción corta" required className="input-field" />
            <input name="codigo" placeholder="Código Promo (Ej: VIVE20)" required className="input-field" />
            <div style={{display: 'flex', gap: '10px'}}>
               <input name="lat" placeholder="Latitud" required className="input-field" />
               <input name="lon" placeholder="Longitud" required className="input-field" />
            </div>
            <button type="submit" className="btn btn-primary">Guardar en Base de Datos</button>
          </form>

          <div style={{marginTop: '30px'}}>
            <h4>Lista de Cupones (Admin)</h4>
            {cupones.map(c => (
              <div key={c.id} className="admin-list-item" style={{display: 'flex', justifyContent: 'space-between', padding: '10px', background: 'white', marginBottom: '5px', borderRadius: '10px'}}>
                <span>{c.titulo}</span>
                <button onClick={() => handleEliminar(c.id)} className="btn btn-delete" style={{background: '#fee', color: 'red', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="map-wrapper">
            <MapContainer center={[ubicacionUsuario.lat, ubicacionUsuario.lon]} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ChangeView center={[ubicacionUsuario.lat, ubicacionUsuario.lon]} />
              <Marker position={[ubicacionUsuario.lat, ubicacionUsuario.lon]} />
              {cuponesFiltrados.map(c => (
                (c.latitud && c.longitud) && (
                  <Marker key={c.id} position={[parseFloat(c.latitud), parseFloat(c.longitud)]}>
                    <Popup>
                      <div style={{textAlign: 'center'}}>
                        <b>{c.titulo}</b><br/>
                        <button className="btn btn-primary" style={{padding: '5px 10px', marginTop: '5px', fontSize: '12px', width: 'auto'}} 
                                onClick={() => session ? setSeleccionado(c) : setMostrarAuthModal(true)}>
                          Ver
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
          <div className="coupons-grid">
            {cuponesFiltrados.map(c => (
              <div key={c.id} onClick={() => session ? setSeleccionado(c) : setMostrarAuthModal(true)} className="coupon-card">
                <h3 style={{margin: '0 0 10px 0'}}>{c.titulo}</h3>
                <p style={{fontSize: '0.9rem', color: '#5f6368', minHeight: '40px'}}>{c.descripcion}</p>
                <div className={session ? 'promo-active' : 'promo-locked'}>
                    {session ? 'VER CÓDIGO' : '🔒 Inicia sesión'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL AUTH */}
      {mostrarAuthModal && (
        <div className="overlay" onClick={() => setMostrarAuthModal(false)}>
          <div className="auth-card" onClick={e => e.stopPropagation()}>
            <h3 style={{marginBottom: '20px'}}>{modoRegistro ? 'Crea tu cuenta' : 'Ingresa a ViveCoupon'}</h3>
            
            <button type="button" onClick={handleGoogleLogin} className="btn-google">
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706 0-.589.102-1.166.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.043.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>

            <div className="separator">o usa tu correo</div>

            <form onSubmit={handleAuth}>
              <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required className="input-field" />
              <input type="password" placeholder="Contraseña" onChange={e => setPassword(e.target.value)} required className="input-field" />
              <button type="submit" className="btn btn-primary" disabled={loadingAuth}>
                {loadingAuth ? 'Procesando...' : modoRegistro ? 'Registrar' : 'Entrar'}
              </button>
            </form>
            <p onClick={() => setModoRegistro(!modoRegistro)} style={{color: '#1a73e8', cursor: 'pointer', marginTop: '15px', fontSize: '0.9rem'}}>
              {modoRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
            </p>
            <button onClick={() => setMostrarAuthModal(false)} style={{background: 'none', border: 'none', color: '#999', marginTop: '10px', cursor: 'pointer'}}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL CÓDIGO */}
      {seleccionado && (
        <div className="overlay" onClick={() => setSeleccionado(null)}>
          <div className="auth-card" onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#1a73e8', marginBottom: '10px'}}>{seleccionado.titulo}</h2>
            <p style={{color: '#5f6368'}}>Muestra este código en el local:</p>
            <div className="promo-code-display">
              {seleccionado.codigo_promo}
            </div>
            <button onClick={() => setSeleccionado(null)} className="btn btn-primary">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;