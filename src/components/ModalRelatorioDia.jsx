import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  VStack, Text, Image, HStack, Badge, Box, IconButton
} from '@chakra-ui/react';
import { FiEye, FiDownloadCloud } from 'react-icons/fi';
import { useRef, useState } from 'react';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';

export default function ModalRelatorioDia({ isOpen, onClose, dados }) {
  const [mostrarImagens, setMostrarImagens] = useState(true);
  const contentRef = useRef(null);

  const km = dados?.['KM-Control'] ?? {};
  const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
  const nomeUsuario = `${usuario?.first_nome ?? ''} ${usuario?.last_nome ?? ''}`.trim();


  const dataInicio = dayjs(dados?.hora).format('YYYY-MM-DD');
  const dataFinal = km?.['DATA_FINALIZACAO'];
  const horaInicio = dayjs(dados?.hora).format('HH:mm');
  const [modoImagem, setModoImagem] = useState(false);
  const houveAtraso = dataFinal && dataFinal !== dataInicio;



const esperarImagensCarregarem = async (elemento) => {
  const imagens = elemento.querySelectorAll('img');

  const promessas = Array.from(imagens).map((img) => {
    return new Promise((resolve) => {
      const finalizar = () => setTimeout(resolve, 150); // Dá tempo pro Chakra aplicar estilos
      if (img.complete) {
        finalizar();
      } else {
        img.onload = finalizar;
        img.onerror = finalizar;
      }
    });
  });

  await Promise.all(promessas);
};




const gerarImagem = async () => {
  setModoImagem(true);
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (!contentRef.current) return;

  await esperarImagensCarregarem(contentRef.current);

  // Adiciona pequeno delay final para layout 100% aplicado
  await new Promise((resolve) => setTimeout(resolve, 100));

  const canvas = await html2canvas(contentRef.current);
  const link = document.createElement('a');
  link.download = `relatorio-${dataInicio}.png`;
  link.href = canvas.toDataURL();
  link.click();

  setModoImagem(false);
};



  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" isCentered>
      <ModalOverlay />
      <ModalContent borderRadius="xl" boxShadow="lg">
        <ModalHeader display="flex" justifyContent="space-between" alignItems="center">
          <Text fontWeight="bold" fontSize="lg">Relatório do Dia</Text>
            <IconButton
              icon={<FiDownloadCloud />}
              aria-label="Salvar relatório como imagem"
              size="sm"
              position="absolute"
              top="10px"
              right="50px" // deslocado para não colidir com o "X"
              zIndex="1"
              onClick={gerarImagem}
            />
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} ref={contentRef}>
          <VStack spacing={4} align="stretch">


            {houveAtraso && (
              <Box p={3} bg="orange.100" borderRadius="md" borderLeft="4px solid #DD6B20">
                <Text fontWeight="bold" color="orange.700">⚠ Atenção</Text>
                <Text fontSize="sm" color="orange.700">
                  A data de finalização excedeu a data de início do dia.
                </Text>
              </Box>
            )}

              {modoImagem && (
                <Box
                  p={3}
                  bg="gray.100"
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="32px"
                >
                  <span
                    style={{
                      transform: 'translateY(-4px)',
                      fontWeight: 'bold',
                      fontSize: '14px',
                    }}
                  >
                    Usuário: {nomeUsuario || '---'}
                  </span>
                </Box>
              )}



            <Box p={3} bg="gray.50" borderRadius="md">
              <HStack justify="space-between">
                <Text><strong>Data:</strong> {dayjs(dados?.hora).format('DD/MM/YYYY')}</Text>
                <Text><strong>Veículo:</strong> {km?.VEICULO || '---'}</Text>
              </HStack>
              <HStack justify="space-between" mt={2}>
                <Text><strong>Início:</strong> {horaInicio}</Text>
                <Text><strong>Final:</strong> {km?.['HORA_KM-FINAL'] || '-'}</Text>
              </HStack>
            </Box>

            <Box p={3} bg="gray.50" borderRadius="md">
              <HStack justify="space-between">
                <Text><strong>KM Inicial:</strong> {km?.['KM-INICIAL'] ?? '-'}</Text>
                <Text><strong>KM Final:</strong> {km?.['KM-FINAL'] ?? '-'}</Text>
              </HStack>
              <Text mt={2} color="green.600" fontWeight="semibold">
                Rodados: {km?.['TOTAL-KM_RODADO']} {km?.UNIDADE}
              </Text>
            </Box>

            {km?.ABASTECEU && (
              <Box p={3} bg="blue.50" borderRadius="md">
                <Badge
                  colorScheme="blue"
                  mb={1}
                  px={3}
                  py={2}
                  borderRadius="md"
                  fontSize="xs"
                  fontWeight="bold"
                  letterSpacing="wide"
                  textTransform="uppercase"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="26px"
                >
                  <span style={{ transform: `translateY(${modoImagem ? '-4px' : '-1px'})` }}>
                    HOUVE ABASTECIMENTO
                  </span>
                </Badge>






                <HStack justify="space-between">
                  <Text><strong>Tipo:</strong> {km?.['TIPO_DE_ABASTECIMENTO']}</Text>
                  <Text><strong>Valor:</strong> {km?.['VALOR_ABASTECIMENTO']}</Text>
                </HStack>
              </Box>
            )}

            {km?.['OBSERVAÇÃO'] && (
              <Box p={3} bg="gray.100" borderRadius="md">
                <Text fontWeight="semibold" mb={1}>Observação:</Text>
                <Text fontSize="sm" color="gray.700">{km['OBSERVAÇÃO']}</Text>
              </Box>
            )}

            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontWeight="bold">Imagens:</Text>
                {!modoImagem && (
                  <IconButton
                    icon={<FiEye />}
                    aria-label="Mostrar/ocultar imagens"
                    size="sm"
                    variant="ghost"
                    onClick={() => setMostrarImagens(!mostrarImagens)}
                  />
                )}
              </HStack>

              {modoImagem ? (
                <Text fontSize="sm" color="gray.600" pl={1}>
                  Imagens disponíveis no dashboard do administrador.
                </Text>
              ) : (
                mostrarImagens && (
                  <VStack align="start" spacing={3}>
                    {km?.['URL_IMG-KM-FINAL'] && (
                      <Image
                        src={km['URL_IMG-KM-FINAL']}
                        alt="KM Final"
                        borderRadius="md"
                        objectFit="cover"
                        boxSize="full"
                        maxH="200px"
                      />
                    )}

                    <HStack spacing={3} wrap="wrap">
                      {km?.['URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_1'] && (
                        <Image
                          src={km['URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_1']}
                          alt="Comprovante 1"
                          borderRadius="md"
                          boxSize="120px"
                          objectFit="cover"
                        />
                      )}
                      {km?.['URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_2'] && (
                        <Image
                          src={km['URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_2']}
                          alt="Comprovante 2"
                          borderRadius="md"
                          boxSize="120px"
                          objectFit="cover"
                        />
                      )}
                    </HStack>
                  </VStack>
                )
              )}
            </Box>

          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
