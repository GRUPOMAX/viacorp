import { useEffect } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Button, Input, VStack, HStack, IconButton, Select, Image, useToast, Checkbox, Text, Box
} from '@chakra-ui/react';

import { FiCamera, FiTrash, FiPlusCircle } from 'react-icons/fi';
import { useState } from 'react';
import { salvarRegistroKm } from '../services/api';
import dayjs from 'dayjs';

const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ModalFinalizarDia({ isOpen, onClose, onSalvar, dadosDia }) {
  const [kmFinal, setKmFinal] = useState('');
  const [houveAbastecimento, setHouveAbastecimento] = useState(false);
  const [tipoCombustivel, setTipoCombustivel] = useState('');
  const [valorAbastecido, setValorAbastecido] = useState('');
  const [fotoKmFinal, setFotoKmFinal] = useState(null);
  const [comprovantes, setComprovantes] = useState([]);
  const [observacao, setObservacao] = useState('');
  const [mostrarObs, setMostrarObs] = useState(false);
  const [precoLitro, setPrecoLitro] = useState('');
  const [kmPorLitroPadrao, setKmPorLitroPadrao] = useState(0);

  const toast = useToast();

  useEffect(() => {
  const buscarPerformance = async () => {
    const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
    const cpf = usuario?.['UnicID-CPF'];

    const res = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${cpf})`, {
      headers: {
        'xc-token': NOCODB_TOKEN
      }
    });

    const dados = await res.json();
    const kmPerformance = dados?.list?.[0]?.['KM-PERFORMACE'];
    setKmPorLitroPadrao(kmPerformance || 0);
  };

  if (isOpen) buscarPerformance();
}, [isOpen]);


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

  const handleUpload = (setter) => async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadImagem(file);
      if (url) {
        setter(url);
      }
    }
  };

  const handleUploadComprovante = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (comprovantes.length >= 2) {
      toast({
        title: 'Limite de imagens atingido',
        description: 'Você pode enviar no máximo 2 imagens de comprovante.',
        status: 'warning',
        isClosable: true,
      });
      return;
    }

    const url = await uploadImagem(file);
    if (url) {
      setComprovantes((prev) => [...prev, url]);
    }
  };

const handleSalvar = async () => {
  if (!kmFinal || (houveAbastecimento && (!tipoCombustivel || !valorAbastecido))) {
    toast({
      title: 'Preencha todos os campos obrigatórios.',
      status: 'warning',
      isClosable: true,
    });
    return;
  }

  try {
    const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
    const cpf = usuario?.['UnicID-CPF'];
    const empresa = usuario?.company ?? 'max-fibra';
    const veiculoAtual = dadosDia?.veiculo;

    const dataRegistro = dayjs(dadosDia?.hora).format('YYYY-MM-DD');
    const dataHoje = dayjs().format('YYYY-MM-DD');
    const horaFinal = dayjs().format('HH:mm');

    const kmInicial = parseFloat(dadosDia?.['KM-Control']?.['KM-INICIAL'] || 0);
    const kmFinalNumber = parseFloat(kmFinal);
    let totalKm = kmFinalNumber - kmInicial;
    let unidade = 'km';

    if (totalKm < 1) {
      totalKm *= 1000;
      unidade = totalKm < 1 ? 'cm' : 'm';
      if (unidade === 'cm') totalKm *= 100;
    }

    const valorTotal = Number(valorAbastecido.replace(/[^\d]/g, '')) / 100;
    const precoPorLitro = Number(precoLitro.replace(/[^\d]/g, '')) / 100;

    const litrosAbastecidos = (houveAbastecimento && valorTotal && precoPorLitro)
      ? parseFloat((valorTotal / precoPorLitro).toFixed(2))
      : 0;



    // 🔍 Buscar dados da empresa
    const resEmp = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records?where=(Enterprise,eq,${empresa})`, {
      headers: { 'xc-token': NOCODB_TOKEN }
    });
    const dataEmp = await resEmp.json();
    const registroEmpresa = dataEmp?.list?.[0];
    const listaPadrao = registroEmpresa?.['Vehicle-Standard'] ?? [];

    // Tentar buscar da empresa
    const veiculoEmpresa = listaPadrao.find(v => v.veiculo === veiculoAtual);
    let performancePadrao = veiculoEmpresa?.['KM-PERFORMACE'];

    // Se não tiver na empresa, busca do veículo do usuário
    if (!performancePadrao || performancePadrao <= 0) {
      const resUser = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${cpf})`,
        { headers: { 'xc-token': NOCODB_TOKEN } }
      );
      const dadosUser = await resUser.json();
      const veiculoUser = dadosUser?.list?.[0];
      performancePadrao = veiculoUser?.['KM-PERFORMACE'] ?? 0;
    }

    const litrosConsumidos = performancePadrao > 0
      ? parseFloat((totalKm / performancePadrao).toFixed(2))
      : 0;

    const consumoReal = (totalKm > 0 && litrosConsumidos > 0)
      ? parseFloat((totalKm / litrosConsumidos).toFixed(2))
      : 0;



    // 🔁 Atualiza na tabela certa
    let litrosRestantesFinais = 0;

    if (veiculoEmpresa) {
      // Atualiza Vehicle-Standard
      const novaLista = listaPadrao.map(v => {
        if (v.veiculo === veiculoAtual) {
          const atual = parseFloat(v['ABASTECIMENTO-DISPONIVELE-LITRO'] || 0);
          const novo = Math.max(0, parseFloat((atual - litrosConsumidos).toFixed(2)));
          litrosRestantesFinais = novo;
          return { ...v, 'ABASTECIMENTO-DISPONIVELE-LITRO': novo };
        }
        return v;
      });

      await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_TOKEN,
        },
        body: JSON.stringify({
          Id: registroEmpresa?.Id,
          'Vehicle-Standard': novaLista
        })
      });
    } else {
      // Atualiza veículo do usuário
      const resUser = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${cpf})`,
        { headers: { 'xc-token': NOCODB_TOKEN } }
      );
      const dadosUser = await resUser.json();
      const registroUser = dadosUser?.list?.[0];
      const registroId = registroUser?.Id;

      let litrosAtualizados = parseFloat(registroUser?.['ABASTECIMENTO-DISPONIVELE-LITRO'] || 0);

      if (houveAbastecimento) litrosAtualizados += litrosAbastecidos;
      litrosAtualizados -= litrosConsumidos;
      litrosAtualizados = Math.max(0, parseFloat(litrosAtualizados.toFixed(2)));
      litrosRestantesFinais = litrosAtualizados;

      if (registroId) {
        await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'xc-token': NOCODB_TOKEN,
          },
          body: JSON.stringify({
            Id: registroId,
            'ABASTECIMENTO-DISPONIVELE-LITRO': litrosAtualizados
          })
        });
      }
    }

    const dadosAtualizados = {
      ...dadosDia['KM-Control'],
      'KM-FINAL': kmFinalNumber,
      'HORA_KM-FINAL': horaFinal,
      'URL_IMG-KM-FINAL': fotoKmFinal || '',
      'TOTAL-KM_RODADO': parseFloat(totalKm.toFixed(2)),
      'UNIDADE': unidade,
      'ABASTECEU': houveAbastecimento,
      'VALOR_ABASTECIMENTO': houveAbastecimento ? `R$ ${valorAbastecido}` : '',
      'TIPO_DE_ABASTECIMENTO': tipoCombustivel,
      'URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_1': comprovantes[0] || '',
      'URL_IMG-KM-COMPROVANTE_ABASTECIMENTO_2': comprovantes[1] || '',
      'OBSERVAÇÃO': observacao,
      'LITROS_ABASTECIDOS': litrosAbastecidos,
      'CONSUMO_REAL_KM_L': consumoReal,
      'PERFORMANCE_PADRAO_KM_L': performancePadrao,
      'PRECO_POR_LITRO': precoPorLitro,
      'LITROS_CONSUMIDOS': litrosConsumidos,
      'LITROS_RESTANTES_APOS': litrosRestantesFinais,
      ...(dataHoje !== dataRegistro && { 'DATA_FINALIZACAO': dataHoje })
    };

    await salvarRegistroKm(cpf, dadosAtualizados, dataRegistro);

    toast({
      title: 'Dia finalizado com sucesso.',
      status: 'success',
      isClosable: true,
    });

    onSalvar(dadosAtualizados);
    onClose();

    // Reset
    setKmFinal('');
    setHouveAbastecimento(false);
    setTipoCombustivel('');
    setValorAbastecido('');
    setPrecoLitro('');
    setFotoKmFinal(null);
    setComprovantes([]);
  } catch (err) {
    toast({
      title: 'Erro ao finalizar dia.',
      description: err.message,
      status: 'error',
      isClosable: true,
    });
  }
};






  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Finalizar Dia</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={4}>
          <VStack spacing={4}>
            <HStack w="100%">
              <Input
                placeholder="KM Final"
                inputMode="numeric"
                pattern="[0-9]*"
                value={kmFinal}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) setKmFinal(value);
                }}
              />

              <label>
                <IconButton
                  icon={<FiCamera />}
                  aria-label="Upload KM Final"
                  as="span"
                  cursor="pointer"
                />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleUpload(setFotoKmFinal)}
                  capture="environment"
                />
              </label>
            </HStack>

            {fotoKmFinal && (
              <Box position="relative" boxSize="100px">
                <Image
                  src={fotoKmFinal}
                  alt="Foto KM Final"
                  boxSize="100px"
                  borderRadius="md"
                  objectFit="cover"
                />
                <IconButton
                  icon={<FiTrash />}
                  size="xs"
                  position="absolute"
                  top="2px"
                  right="2px"
                  colorScheme="red"
                  aria-label="Remover imagem"
                  onClick={() => setFotoKmFinal(null)}
                />
              </Box>
            )}


            <Checkbox
              isChecked={houveAbastecimento}
              onChange={(e) => setHouveAbastecimento(e.target.checked)}
              colorScheme="blue"
              alignSelf="flex-start"
            >
              Houve abastecimento?
            </Checkbox>

            {houveAbastecimento && (
              <>
                <HStack w="100%">
                  <Select
                    placeholder="Tipo de Combustível"
                    value={tipoCombustivel}
                    onChange={(e) => setTipoCombustivel(e.target.value)}
                  >
                    <option>Gasolina</option>
                    <option>Álcool</option>
                    <option>Diesel</option>
                  </Select>

                  <label>
                    <IconButton
                      icon={<FiCamera />}
                      aria-label="Upload comprovante"
                      as="span"
                      cursor="pointer"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleUploadComprovante}
                      capture="environment"
                    />
                  </label>
                </HStack>

                  <Input
                    placeholder="Valor abastecido (R$)"
                    inputMode="numeric"
                    value={valorAbastecido}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const formatted = (Number(raw) / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 2,
                      });
                      setValorAbastecido(formatted);
                    }}
                  />

                  <Input
                    placeholder="Preço por litro (R$)"
                    inputMode="numeric"
                    value={precoLitro}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const formatted = (Number(raw) / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 2,
                      });
                      setPrecoLitro(formatted);
                    }}
                  />



                {comprovantes.length > 0 && (
                  <HStack spacing={2} wrap="wrap">
                    {comprovantes.map((url, index) => (
                      <Box key={index} position="relative" boxSize="100px">
                        <Image
                          src={url}
                          alt={`Comprovante ${index + 1}`}
                          boxSize="100px"
                          borderRadius="md"
                          objectFit="cover"
                        />
                        <IconButton
                          icon={<FiTrash />}
                          size="xs"
                          position="absolute"
                          top="2px"
                          right="2px"
                          colorScheme="red"
                          aria-label="Remover comprovante"
                          onClick={() => {
                            setComprovantes(prev => prev.filter((_, i) => i !== index));
                          }}
                        />
                      </Box>
                    ))}
                  </HStack>

                )}
              </>
            )}

            {!mostrarObs ? (
                <Button
                  leftIcon={<FiPlusCircle />}
                  size="sm"
                  variant="outline"
                  onClick={() => setMostrarObs(true)}
                  w="full"
                >
                  Adicionar Observação
                </Button>
              ) : (
                <Input
                  placeholder="Digite uma observação"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                />
              )}


            <Button colorScheme="green" w="full" onClick={handleSalvar}>
              Finalizar
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
