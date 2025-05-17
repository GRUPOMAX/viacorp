import {
  Box, Button, Input, VStack, Image, Text, useToast, Fade
} from '@chakra-ui/react';
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [modoCpf, setModoCpf] = useState(false);
  const [cpf, setCpf] = useState('');
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_NOCODB_URL}/api/v2/tables/msehqhsr7j040uq/records`,
        {
          headers: {
            'xc-token': import.meta.env.VITE_NOCODB_TOKEN
          },
          params: {
            where: modoCpf ? `(CPF,eq,${cpf})` : `(email,eq,${email})`
          }
        }
      );

      const usuario = res.data.list[0];
      const isSenhaOk = modoCpf || (usuario && usuario.password === password);

      if (usuario && isSenhaOk) {
        toast({
          title: 'Login realizado com sucesso!',
          status: 'success',
          duration: 1500,
          isClosable: true,
        });

        // ✅ Salvando no localStorage
        localStorage.setItem('usuario-viacorp', JSON.stringify(usuario));
        onLogin(usuario);

        setTimeout(() => navigate('/'), 500);
      } else {
        toast({
          title: 'Credenciais inválidas',
          status: 'error',
          isClosable: true,
        });
      }
    } catch (err) {
      toast({
        title: 'Erro na autenticação',
        description: err.message,
        status: 'error',
        isClosable: true,
      });
    }
  };

  return (
    <Box
      h="100vh"
      w="100vw"
      bgGradient="linear(to-b, blue.50, white)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      p={4}
    >
      <Fade in>
        <Box
          bg="white"
          p={6}
          rounded="2xl"
          boxShadow="lg"
          w="100%"
          maxW="xs"
        >
          <VStack spacing={4}>
            <Image
              src="/LOGIN.png"
              alt="ViaCorp Logo"
              boxSize="80px"
              objectFit="contain"
              fallbackSrc="https://via.placeholder.com/80x80?text=Logo"
            />
            <Text fontSize="lg" fontWeight="bold" color="gray.700">Login - ViaCorp</Text>

            {modoCpf ? (
              <Input
                placeholder="Digite seu CPF"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                bg="gray.50"
                _focus={{ bg: 'white' }}
              />
            ) : (
              <>
                <Input
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="gray.50"
                  _focus={{ bg: 'white' }}
                />
                <Input
                  placeholder="Senha"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  bg="gray.50"
                  _focus={{ bg: 'white' }}
                />
              </>
            )}

            <Button
              colorScheme="blue"
              w="full"
              onClick={handleLogin}
              borderRadius="lg"
            >
              Entrar
            </Button>

            <Button
              variant="link"
              size="sm"
              color="blue.600"
              onClick={() => {
                setModoCpf((prev) => !prev);
                setEmail('');
                setPassword('');
                setCpf('');
              }}
            >
              {modoCpf ? 'Voltar para login por e-mail' : 'Esqueci a senha (usar CPF)'}
            </Button>
          </VStack>
        </Box>
      </Fade>
    </Box>
  );
}
