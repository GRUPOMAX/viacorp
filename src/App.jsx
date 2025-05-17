import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import RegistroAbastecimento from './components/RegistroAbastecimento';
import Login from './pages/Login';
import Historico from './pages/Historico';
import PerfilUsuario from './pages/PerfilUsuario';
import LoadingScreen from './components/LoadingScreen';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const user = localStorage.getItem('usuario-viacorp');
    return user ? JSON.parse(user) : null;
  });

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuarioLogado) {
      localStorage.removeItem('usuario-viacorp');
      setCarregando(false); // Sem usuário, não precisa carregar tela de boas-vindas
    } else {
      // Simula tela de carregamento por 2.5 segundos
      const timeout = setTimeout(() => setCarregando(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [usuarioLogado]);

  return (
    <Router>
        {carregando && usuarioLogado ? (
          <LoadingScreen nome={`${usuarioLogado.first_nome} ${usuarioLogado.last_nome}`} />
        ) : (

        <Routes>
          <Route path="/login" element={<Login onLogin={setUsuarioLogado} />} />

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
      )}
    </Router>
  );
}

export default App;
