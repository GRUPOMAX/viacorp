import { Box, IconButton, HStack } from '@chakra-ui/react';
import { FiHome, FiClock, FiUser } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomMenu() {
  const navigate = useNavigate();
  const location = useLocation();

  const rotaAtual = location.pathname;

  const corAtiva = '#3182ce'; // azul
  const corInativa = '#A0AEC0'; // cinza

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      width="100%"
      bg="white"
      boxShadow="0 -2px 5px rgba(0,0,0,0.1)"
      zIndex={10}
      py={3}
    >
      <HStack justify="space-around">
        <IconButton
          icon={<FiHome color={rotaAtual === '/' ? corAtiva : corInativa} />}
          aria-label="Início"
          variant="ghost"
          onClick={() => navigate('/')}
        />
        <IconButton
          icon={<FiClock color={rotaAtual === '/historico' ? corAtiva : corInativa} />}
          aria-label="Histórico"
          variant="ghost"
          onClick={() => navigate('/historico')}
        />
        <IconButton
          icon={<FiUser color={rotaAtual === '/perfil' ? corAtiva : corInativa} />}
          aria-label="Perfil"
          variant="ghost"
          onClick={() => navigate('/perfil')}
        />
      </HStack>
    </Box>
  );
}
