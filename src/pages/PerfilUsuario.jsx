import {
  Box, Heading, Text, Avatar, VStack, Button, useToast, Divider, Icon
} from '@chakra-ui/react';
import { FiLogOut } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import BottomMenu from '../components/BottomMenu';

export default function PerfilUsuario() {
  const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
  const navigate = useNavigate();
  const toast = useToast();

  const nomeCompleto = `${usuario?.first_nome || ''} ${usuario?.last_nome || ''}`.trim() || 'Nome não informado';

  const handleLogout = () => {
    localStorage.removeItem('usuario-viacorp');
    toast({
      title: 'Logout realizado.',
      description: 'Você foi desconectado com sucesso.',
      status: 'info',
      duration: 3000,
      isClosable: true
    });
    navigate('/login');
  };

  return (
    <Box w="100vw" p={4} pb="100px">
      <VStack spacing={6} align="center" w="100%">
        <Avatar size="2xl" name={nomeCompleto} bg="green.400" color="white" />
        <Heading size="md" textAlign="center">{nomeCompleto}</Heading>

        <Box
          w="100%"
          maxW="400px"
          bg="gray.50"
          p={6}
          rounded="xl"
          boxShadow="base"
        >
          <VStack spacing={3} align="start">
            <Box>
              <Text fontSize="sm" color="gray.500">CPF</Text>
              <Text fontWeight="medium" color="gray.800">{usuario?.CPF || '---'}</Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500">Email</Text>
              <Text fontWeight="medium" color="gray.800">{usuario?.email || '---'}</Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500">Veículo</Text>
              <Text fontWeight="medium" color="gray.800">{usuario?.vehicle || usuario?.model_vehicle || '---'}</Text>
            </Box>

            <Box>
              <Text fontSize="sm" color="gray.500">Tipo de Abastecimento</Text>
              <Text fontWeight="medium" color="gray.800">{usuario?.tipo_abastecimento || '---'}</Text>
            </Box>
          </VStack>
        </Box>

        <Button
          colorScheme="red"
          mt={4}
          size="md"
          leftIcon={<Icon as={FiLogOut} />}
          onClick={handleLogout}
        >
          Sair
        </Button>
      </VStack>

      <BottomMenu />
    </Box>
  );
}
