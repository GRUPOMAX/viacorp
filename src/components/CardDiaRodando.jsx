import { Box, Text, HStack, Icon, VStack, Badge, useToast } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { BsCircleFill, BsExclamationTriangleFill } from 'react-icons/bs';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');

const MotionIcon = motion(Icon);

export default function CardDiaRodando({ dados, aoClicar }) {
  const toast = useToast();
  const totalKm = dados?.['KM-Control']?.['TOTAL-KM_RODADO'] ?? dados?.['TOTAL-KM_RODADO'];
  const unidade = dados?.['KM-Control']?.['UNIDADE'] ?? dados?.['UNIDADE'] ?? 'km';
  const kmFinal = dados?.['KM-Control']?.['KM-FINAL'] ?? dados?.['KM-FINAL'];
  const horaFinal = dados?.['KM-Control']?.['HORA_KM-FINAL'] ?? dados?.['HORA_KM-FINAL'];
  const dataFinalizacao = dados?.['KM-Control']?.['DATA_FINALIZACAO'];
  const isFinalizado = typeof kmFinal === 'number' && kmFinal > 0;

  const dataInicio = dayjs(dados.hora).format('YYYY-MM-DD');
  const houveFinalizacaoAtrasada = isFinalizado && dataFinalizacao && dataFinalizacao !== dataInicio;

  const handleClick = () => {

    aoClicar?.(dados); // sempre envia os dados
  };


return (
  <Box
    position="relative" // necessário para posicionar o alerta corretamente
    w="90vw"
    maxW="400px"
    mx="auto"
    p={4}
    bg="white"
    border="1px solid"
    borderColor="gray.200"
    rounded="2xl"
    boxShadow="md"
    mb={4}
    onClick={handleClick}
    cursor="pointer"
    transition="all 0.2s"
    _hover={{ boxShadow: 'lg', transform: 'scale(1.01)' }}
  >
    {/* TOPO: dia, data, veículo e alerta */}
    <HStack justify="space-between" align="center" mb={2}>
      <HStack spacing={2}>
        <Text fontWeight="semibold" fontSize="md">
          {dayjs(dados.hora).format('dddd').toLowerCase()}
        </Text>
        <Badge colorScheme="blue" fontSize="0.8em">
          {dayjs(dados.hora).format('DD/MM/YYYY')}
        </Badge>
      </HStack>

      <Badge colorScheme="purple" fontSize="0.8em">
        {(dados?.['KM-Control']?.['VEICULO'] ?? dados?.veiculo ?? 'Veículo').toUpperCase()}
      </Badge>
    </HStack>

    {/* CENTRO: informações do percurso */}
    <VStack align="start" spacing={1}>
      <Text fontSize="sm" color="gray.500">
        Iniciado às {dayjs(dados.hora).format('HH:mm')}
      </Text>

      {isFinalizado && horaFinal && (
        <Text fontSize="sm" color="gray.500">
          Finalizado às {horaFinal}
        </Text>
      )}

      {typeof totalKm === 'number' && totalKm > 0 && (
        <Text fontSize="sm" fontWeight="medium" color="green.600">
          {totalKm} {unidade} rodados
        </Text>
      )}
      {typeof dados?.['KM-Control']?.['LITROS_CONSUMIDOS'] === 'number' && (
        <Text fontSize="sm" fontWeight="medium" color="blue.600">
          {dados['KM-Control']['LITROS_CONSUMIDOS'].toFixed(2)} litros consumidos
        </Text>
      )}


    </VStack>

    {/* ÍCONE POSICIONADO NO CANTO INFERIOR DIREITO */}
    <Box position="absolute" bottom="12px" right="12px">
      {houveFinalizacaoAtrasada ? (
        <Icon as={BsExclamationTriangleFill} color="orange.400" boxSize={5} />
      ) : isFinalizado ? (
        <Icon as={BsCircleFill} color="gray.400" boxSize={4} />
      ) : (
        <MotionIcon
          as={BsCircleFill}
          color="green.400"
          boxSize={4}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </Box>
  </Box>
);


}
