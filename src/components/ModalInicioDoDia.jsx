import { useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Button, useDisclosure, Input, VStack, IconButton, Select, Image, useToast, HStack,Box
} from '@chakra-ui/react';
import { FiPlus, FiCamera } from 'react-icons/fi';
import { useState } from 'react';
import { salvarRegistroKm } from '../services/api';
import { FiTrash } from 'react-icons/fi';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');





const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ModalInicioDoDia({ onSalvar }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [veiculo, setVeiculo] = useState('');
  const [kmInicial, setKmInicial] = useState('');
  const [fotoKm, setFotoKm] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [veiculoPadrao, setVeiculoPadrao] = useState('');
  const [opcoesVeiculos, setOpcoesVeiculos] = useState([]);
  const toast = useToast();


useEffect(() => {
  const carregarVeiculos = async () => {
    const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
    if (!usuario?.CPF || !usuario?.Enterprise) return;

    try {
      // 1. Buscar veículo padrão do usuário
      const resPadrao = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${usuario.CPF})`,
        { headers: { 'xc-token': NOCODB_TOKEN } }
      );
      const padraoData = await resPadrao.json();
      const veiculoUsuario = padraoData?.list?.[0]?.['MODEL-VEHICLE']?.trim();

      // 2. Buscar veículos padrão da empresa
      const resVeiculosEmpresa = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records?where=(Enterprise,eq,${usuario.Enterprise})`,
        { headers: { 'xc-token': NOCODB_TOKEN } }
      );
      const dadosEmpresa = await resVeiculosEmpresa.json();
      const listaPadrão = dadosEmpresa?.list?.[0]?.['Vehicle-Standard'] || [];

      // 3. Evitar duplicata e combinar
      let veiculosFinais = [...listaPadrão];
      if (
        veiculoUsuario &&
        !listaPadrão.some(v => v.veiculo?.toLowerCase() === veiculoUsuario.toLowerCase())
      ) {
        veiculosFinais.unshift({ veiculo: veiculoUsuario });
      }

      setOpcoesVeiculos(veiculosFinais);
      if (veiculoUsuario) {
        setVeiculoPadrao(veiculoUsuario);
        setVeiculo(veiculoUsuario);
      }
    } catch (err) {
      console.error('Erro ao buscar veículos:', err);
    }
  };

  carregarVeiculos();
}, []);


  const uploadImagem = async (file) => {
    const nomeSemEspacos = file.name.replace(/\s+/g, '_');
    const nomeArquivoCorrigido = encodeURIComponent(nomeSemEspacos);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('size', file.size);
    formData.append('title', nomeArquivoCorrigido);
    formData.append('path', `${Date.now()}_${nomeArquivoCorrigido}`);

    try {
      const res = await fetch('https://nocodb.nexusnerds.com.br/api/v2/storage/upload', {
        method: 'POST',
        headers: {
          'xc-token': NOCODB_TOKEN,
        },
        body: formData,
      });

      if (!res.ok) throw new Error('Falha no upload');

      const result = await res.json();
      const path = result?.[0]?.path;
      if (!path) throw new Error('URL não retornada corretamente');

      return `https://nocodb.nexusnerds.com.br/${path}`;
    } catch (err) {
      toast({
        title: 'Erro ao enviar imagem',
        description: err.message || 'Verifique o tamanho ou o formato do arquivo.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return null;
    }
  };

  const handleSalvar = async () => {
    if (!veiculo || !kmInicial) {
      toast({
        title: 'Preencha todos os campos obrigatórios',
        status: 'warning',
        isClosable: true,
      });
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
    if (!usuario?.CPF) {
      toast({
        title: 'Erro: usuário não encontrado',
        status: 'error',
        isClosable: true,
      });
      return;
    }

    const agora = dayjs();
    const hora = agora.format('HH:mm');
    const data = agora.format('YYYY-MM-DD');

    const dadosDoDia = {
      "KM-INICIAL": Number(kmInicial),
      "HORA_KM-INICIAL": hora,
      "URL_IMG-KM-INICIAL": fotoKm || '',
      "KM-FINAL": 0,
      "HORA_KM-FINAL": '',
      "URL_IMG-KM-FINAL": '',
      "TOTAL-KM_RODADO": 0,
      "ABASTECEU": false,
      "VALOR_ABASTECIMENTO": '',
      "TIPO_DE_ABASTECIMENTO": '',
      "URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_1": '',
      "URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_2": '',
      "OBSERVAÇÃO": '',
      "VEICULO": veiculo
    };

    setCarregando(true);
    try {
        await salvarRegistroKm(usuario.CPF, dadosDoDia, data);

      toast({
        title: 'Início do dia registrado!',
        status: 'success',
        isClosable: true,
      });

      onSalvar({
        hora: agora,
        veiculo,
        'KM-Control': dadosDoDia,
        'UnicID-CPF': usuario.CPF,
      });
      setVeiculo('');
      setKmInicial('');
      setFotoKm(null);
      setImgPreview(null);
      onClose();
    } catch (err) {
      toast({
        title: 'Erro ao salvar no banco',
        description: 'Verifique sua conexão ou tente novamente.',
        status: 'error',
        isClosable: true,
      });
    } finally {
      setCarregando(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setImgPreview(preview);
      const uploadedURL = await uploadImagem(file);
      if (uploadedURL) {
        setFotoKm(uploadedURL);
      }
    }
  };

  return (
    <>
      <IconButton
        icon={<FiPlus />}
        colorScheme="blue"
        aria-label="Novo registro"
        position="fixed"
        bottom="80px"
        right="20px"
        zIndex={20}
        size="lg"
        borderRadius="full"
        boxShadow="lg"
        onClick={onOpen}
      />

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Início do Dia</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={4}>
            <VStack spacing={4}>
              <Select
                placeholder="Selecione o veículo"
                value={veiculo}
                onChange={(e) => setVeiculo(e.target.value)}
              >
                {opcoesVeiculos.map((v, idx) => (
                  <option key={idx} value={v.veiculo}>
                    {v.veiculo}
                  </option>
                ))}
              </Select>


              <HStack w="100%">
                <Input
                  placeholder="KM Inicial"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={kmInicial}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) setKmInicial(value); // Apenas números
                  }}
                />

                
                <label>
                  <IconButton
                    icon={<FiCamera />}
                    aria-label="Upload KM"
                    as="span"
                    cursor="pointer"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleUpload}
                    capture="environment" // Tenta abrir a câmera em dispositivos móveis
                  />
                </label>
              </HStack>


              {imgPreview && (
                <Box position="relative" boxSize="100px">
                  <Image
                    src={imgPreview}
                    alt="Foto KM"
                    borderRadius="md"
                    boxSize="100px"
                    objectFit="cover"
                  />
                  <IconButton
                    icon={<FiTrash />} // ou use um ícone de lixeira: <FiTrash />
                    aria-label="Remover imagem"
                    size="xs"
                    position="absolute"
                    top="2px"
                    right="2px"
                    colorScheme="red"
                    onClick={() => {
                      setFotoKm(null);
                      setImgPreview(null);
                    }}
                  />
                </Box>
              )}


              <Button
                colorScheme="blue"
                w="full"
                onClick={handleSalvar}
                isLoading={carregando}
              >
                Salvar e Iniciar Dia
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
