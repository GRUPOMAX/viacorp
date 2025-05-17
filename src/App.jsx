import { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import RegistroAbastecimento from './components/RegistroAbastecimento';
import Login from './pages/Login';
import Historico from './pages/Historico';
import PerfilUsuario from './pages/PerfilUsuario';
import LoadingScreen from './components/LoadingScreen';
import { Box, Text } from '@chakra-ui/react';

function App() {
  const [usuarioLogado, setUsuarioLogado] = useState(() => {
    const user = localStorage.getItem('usuario-viacorp');
    return user ? JSON.parse(user) : null;
  });

  const [carregando, setCarregando] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!usuarioLogado) {
      localStorage.removeItem('usuario-viacorp');
      setCarregando(false);
    } else {
      const timeout = setTimeout(() => setCarregando(false), 2500);
      return () => clearTimeout(timeout);
    }
  }, [usuarioLogado]);

  if (!isMobile) {
    return (
      <Box w="100vw" h="100vh" bg="gray.100" display="flex" justifyContent="center" alignItems="center" p={4} textAlign="center">
        <Box maxW="400px" bg="white" p={6} borderRadius="lg" boxShadow="lg">
          <Text fontSize="xl" fontWeight="bold" mb={4}>Acesso não permitido</Text>
          <Text fontSize="md">Este sistema foi desenvolvido exclusivamente para uso em dispositivos móveis.</Text>
          <Text fontSize="sm" color="gray.500" mt={2}>Acesse novamente usando seu celular.</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Router>
      {carregando && usuarioLogado ? (
        <LoadingScreen nome={`${usuarioLogado.first_nome} ${usuarioLogado.last_nome}`} />
      ) : (
        <Routes>
          <Route path="/login" element={<Login onLogin={setUsuarioLogado} />} />
          <Route
            path="/"
            element={usuarioLogado ? <Home usuario={usuarioLogado} /> : <Navigate to="/login" />}
          />
          <Route
            path="/registro"
            element={usuarioLogado ? <RegistroAbastecimento usuario={usuarioLogado} /> : <Navigate to="/login" />}
          />
          <Route
            path="/historico"
            element={usuarioLogado ? <Historico usuario={usuarioLogado} /> : <Navigate to="/login" />}
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
