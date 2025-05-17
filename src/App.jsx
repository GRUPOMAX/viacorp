import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import RegistroAbastecimento from './components/RegistroAbastecimento';
import Login from './pages/Login';
import Historico from './pages/Historico';
import PerfilUsuario from './pages/PerfilUsuario';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const user = localStorage.getItem('usuario-viacorp');
    return user ? JSON.parse(user) : null;
  });

  useEffect(() => {
    if (!usuarioLogado) {
      localStorage.removeItem('usuario-viacorp');
    }
  }, [usuarioLogado]);

  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<Login onLogin={setUsuarioLogado} />} />

        {/* Rotas protegidas */}
        <Route
          path="/"
          element={
            usuarioLogado ? <Home usuario={usuarioLogado} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/registro"
          element={
            usuarioLogado ? <RegistroAbastecimento usuario={usuarioLogado} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/historico"
          element={
            usuarioLogado ? <Historico usuario={usuarioLogado} /> : <Navigate to="/login" />
          }
        />

        
        <Route
          path="/perfil"
          element={usuarioLogado ? <PerfilUsuario /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
