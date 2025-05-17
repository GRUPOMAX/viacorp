import { Box, Input, Button, Text, VStack } from '@chakra-ui/react';
import { useState } from 'react';

export default function RegistroAbastecimento() {
  const [kmInicial, setKmInicial] = useState('');
  const [kmFinal, setKmFinal] = useState('');
  const [tipo, setTipo] = useState('');
  const [resultado, setResultado] = useState(null);

  const calcular = () => {
    const total = parseFloat(kmFinal) - parseFloat(kmInicial);
    setResultado(total > 0 ? total : 0);
  };

  return (
    <Box p={4}>
      <VStack spacing={3}>
        <Input placeholder="Tipo de Abastecimento" value={tipo} onChange={(e) => setTipo(e.target.value)} />
        <Input type="number" placeholder="KM Inicial" value={kmInicial} onChange={(e) => setKmInicial(e.target.value)} />
        <Input type="number" placeholder="KM Final" value={kmFinal} onChange={(e) => setKmFinal(e.target.value)} />
        <Button colorScheme="blue" onClick={calcular}>Calcular</Button>
        {resultado !== null && <Text>KM Rodado: {resultado} km</Text>}
      </VStack>
    </Box>
  );
}
