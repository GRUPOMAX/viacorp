import { useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Button, useDisclosure, Input, VStack, IconButton, Select, Image, useToast, HStack,Box, Spinner
} from '@chakra-ui/react';
import { FiPlus, FiCamera } from 'react-icons/fi';
import { useState } from 'react';
import { salvarRegistroKm } from '../services/api';
import { handleSalvarInicioDoDia } from '../utils/handleSalvarInicioDoDia';

import { FiTrash } from 'react-icons/fi';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
dayjs.locale('pt-br');





const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ModalInicioDoDia({ onSalvar, veiculoSelecionado }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [veiculo, setVeiculo] = useState('');
  const [kmInicial, setKmInicial] = useState('');
  const [fotoKm, setFotoKm] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [veiculoPadrao, setVeiculoPadrao] = useState('');
  const [opcoesVeiculos, setOpcoesVeiculos] = useState([]);
  const [carregandoImagem, setCarregandoImagem] = useState(false);

  const toast = useToast();

useEffect(() => {
  const carregarVeiculos = async () => {
    const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
    const cpf = usuario?.CPF;
    const empresa = usuario?.Enterprise?.trim();

    if (!cpf) return;

    try {
      // Busca dados do usuário
      const resUser = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${cpf})`,
        { headers: { 'xc-token': NOCODB_TOKEN } }
      );
      const dadosUser = await resUser.json();
      const veiculoUsuario = dadosUser?.list?.[0]?.['MODEL-VEHICLE']?.trim();

      let veiculosFinais = [];

      if (empresa) {
        // Busca dados da empresa
        const resEmpresa = await fetch(
          `https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records?where=(Enterprise,eq,${empresa})`,
          { headers: { 'xc-token': NOCODB_TOKEN } }
        );
        const dadosEmpresa = await resEmpresa.json();
        const listaEmpresa = dadosEmpresa?.list?.[0]?.['Vehicle-Standard'] ?? [];

        
        veiculosFinais = veiculoUsuario
          ? [veiculoUsuario, ...listaEmpresa.map(v => v.veiculo).filter(v => v !== veiculoUsuario)]
          : listaEmpresa.map(v => v.veiculo);
      } else {
        
        veiculosFinais = veiculoUsuario ? [veiculoUsuario] : [];
      }

      // Atualiza estados
      setOpcoesVeiculos(veiculosFinais.map(v => typeof v === 'string' ? { veiculo: v } : v));
      setVeiculoPadrao(veiculoUsuario);

      if (veiculoSelecionado) {
        setVeiculo(veiculoSelecionado);
      } else if (veiculoUsuario) {
        setVeiculo(veiculoUsuario);
      }
    } catch (err) {
      console.error('Erro ao buscar veículos:', err);
    }
  };

  carregarVeiculos();
}, [veiculoSelecionado]);






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
  if (!usuario?.CPF || !usuario?.Enterprise) {
    toast({
      title: 'Erro: usuário não encontrado',
      status: 'error',
      isClosable: true,
    });
    return;
  }

  try {
    setCarregando(true);

    // 🔍 Busca da tabela do usuário primeiro
    let litrosDisponiveis = 0;

    const resUser = await fetch(
      `https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${usuario.CPF})`,
      { headers: { 'xc-token': NOCODB_TOKEN } }
    );
    const dadosUser = await resUser.json();
    const veiculoUsuario = dadosUser?.list?.[0]?.['MODEL-VEHICLE']?.trim();
    const litrosUsuario = dadosUser?.list?.[0]?.['ABASTECIMENTO-DISPONIVELE-LITRO'] ?? 0;

    if (veiculo === veiculoUsuario) {
      litrosDisponiveis = litrosUsuario;
    } else {
      //
      const resEmpresa = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records?where=(Enterprise,eq,${usuario.Enterprise})`,
        { headers: { 'xc-token': NOCODB_TOKEN } }
      );
      const dadosEmpresa = await resEmpresa.json();
      const lista = dadosEmpresa?.list?.[0]?.['Vehicle-Standard'] ?? [];
      const veiculoSelecionadoEmpresa = lista.find(v => v.veiculo === veiculo);
      litrosDisponiveis = veiculoSelecionadoEmpresa?.['ABASTECIMENTO-DISPONIVELE-LITRO'] ?? 0;
    }

    if (litrosDisponiveis <= 0) {
      toast({
        title: 'Litros zerados',
        description: 'Não é possível iniciar o dia sem combustível disponível.',
        status: 'error',
        isClosable: true,
      });
      setCarregando(false);
      return;
    }

    // 🕒 Registro
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

    // Verificar se o veículo já foi iniciado por outro usuário no dia atual
      const resTodos = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/m0hj8eje9k5w4c0/records?where=(Data,eq,${data})`,
        { headers: { 'xc-token': NOCODB_TOKEN } }
      );
      const todosRegistros = await resTodos.json();
      const registrosDoDia = todosRegistros?.list ?? [];

      // Verifica se o veículo já foi usado no dia por outro CPF
      const veiculoJaUsado = registrosDoDia.some(reg =>
        (reg['UnicID-CPF'] !== usuario.CPF) &&
        Object.values(reg['KM-CONTROL-SEMANAL'] || {}).flat().some(d => d?.VEICULO === veiculo)
      );

      if (veiculoJaUsado) {
        toast({
          title: 'Veículo já em uso',
          description: 'Este veículo já foi iniciado por outro usuário hoje.',
          status: 'error',
          isClosable: true,
        });
        setCarregando(false);
        return;
      }


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

    // 🧹 Reset
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
      setCarregandoImagem(true);
      const preview = URL.createObjectURL(file);
      setImgPreview(preview);
      const uploadedURL = await uploadImagem(file);
      if (uploadedURL) {
        setFotoKm(uploadedURL);
      }
      setCarregandoImagem(false);
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

                
                {carregandoImagem ? (
                  <Box boxSize="48px" display="flex" alignItems="center" justifyContent="center">
                    <Spinner size="sm" color="blue.500" />
                  </Box>
                ) : (
                  <label>
                    <IconButton
                      icon={<FiCamera />}
                      aria-label="Upload KM"
                      as="span"
                      cursor="pointer"
                      border="2px solid"
                      borderColor={!fotoKm ? 'green.400' : 'transparent'}
                    />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleUpload}
                    />
                  </label>
                )}


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
                    icon={<FiTrash />} 
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
                onClick={() => handleSalvarInicioDoDia({
                  veiculo,
                  kmInicial,
                  fotoKm,
                  toast,
                  onSalvar,
                  onClose,
                  setVeiculo,
                  setKmInicial,
                  setFotoKm,
                  setImgPreview,
                  setCarregando
                })}
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
