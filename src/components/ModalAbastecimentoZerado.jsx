import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Input, Select, IconButton, VStack, Button, Image, HStack, useToast, Box
} from '@chakra-ui/react';
import { useState } from 'react';
import { FiCamera, FiTrash } from 'react-icons/fi';
import dayjs from 'dayjs';

const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;

export default function ModalAbastecimentoZerado({ isOpen, onClose, onSucesso, veiculo }) {
  const [tipoCombustivel, setTipoCombustivel] = useState('');
  const [valorAbastecido, setValorAbastecido] = useState('');
  const [precoPorLitro, setPrecoPorLitro] = useState('');
  const [comprovantes, setComprovantes] = useState([]);
  const toast = useToast();

  const uploadImagem = async (file) => {
    const nome = encodeURIComponent(file.name.replace(/\s+/g, '_'));
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', nome);
    formData.append('path', `${Date.now()}_${nome}`);

    try {
      const res = await fetch('https://nocodb.nexusnerds.com.br/api/v2/storage/upload', {
        method: 'POST',
        headers: { 'xc-token': NOCODB_TOKEN },
        body: formData,
      });
      const data = await res.json();
      return `https://nocodb.nexusnerds.com.br/${data?.[0]?.path}`;
    } catch (err) {
      toast({ title: 'Erro ao fazer upload.', status: 'error', isClosable: true });
      return null;
    }
  };

  const handleUploadComprovante = async (e) => {
    const file = e.target.files[0];
    if (file && comprovantes.length < 2) {
      const url = await uploadImagem(file);
      if (url) setComprovantes(prev => [...prev, url]);
    } else {
      toast({ title: 'Máximo de 2 imagens.', status: 'warning', isClosable: true });
    }
  };

    const handleSalvar = async () => {
    if (!tipoCombustivel || !valorAbastecido || !precoPorLitro || comprovantes.length === 0) {
        toast({ title: 'Preencha todos os campos.', status: 'warning', isClosable: true });
        return;
    }

    const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
    const cpf = usuario?.['UnicID-CPF'];
    const empresa = usuario?.company ?? 'max-fibra';
    const dataHoje = dayjs().format('YYYY-MM-DD');
    const valorNum = Number(valorAbastecido.replace(/[^\d]/g, '')) / 100;
    const precoNum = Number(precoPorLitro.replace(/[^\d]/g, '')) / 100;
    const novoLitros = parseFloat((valorNum / precoNum).toFixed(2));

    if (!precoNum || precoNum <= 0) {
        toast({ title: 'Preço por litro inválido.', status: 'warning', isClosable: true });
        return;
    }

    // Verifica se é veículo da empresa
    const resEmpresa = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records?where=(Enterprise,eq,${empresa})`, {
        headers: { 'xc-token': NOCODB_TOKEN }
    });
    const dataEmpresa = await resEmpresa.json();
    const listaPadrao = dataEmpresa?.list?.[0];
    const veiculosEmpresa = listaPadrao?.['Vehicle-Standard'] ?? [];

    const isVeiculoEmpresa = veiculosEmpresa.some(v => v.veiculo === veiculo);

    if (isVeiculoEmpresa && listaPadrao?.Id) {
        // Atualiza comprovante na tabela da empresa
        const novoRegistro = {
        veiculo,
        data: dataHoje,
        tipo: tipoCombustivel,
        valor: valorAbastecido,
        preco_litro: precoPorLitro,
        litros: novoLitros,
        comprovantes: comprovantes.filter(Boolean)
        };

        const novosComprovantes = [...(listaPadrao['comprovante'] || []), novoRegistro];

        const veiculosAtualizados = (listaPadrao['Vehicle-Standard'] || []).map(v => {
          if (v.veiculo === veiculo) {
            const litrosAntigos = parseFloat(v['ABASTECIMENTO-DISPONIVELE-LITRO']) || 0;
            const litrosMaximo = parseFloat(v['LITROS-MAXIMO']) || 60;
            const novoTotal = litrosAntigos + novoLitros;
            const litrosAtualizados = novoTotal > litrosMaximo ? litrosMaximo : novoTotal;

            return {
              ...v,
              'ABASTECIMENTO-DISPONIVELE-LITRO': parseFloat(litrosAtualizados.toFixed(2)),
            };
          }
          return v;
        });

        const resposta = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'xc-token': NOCODB_TOKEN,
          },
          body: JSON.stringify({
            Id: listaPadrao.Id,
            comprovante: novosComprovantes,
            'Vehicle-Standard': veiculosAtualizados
          })
        });


        if (!resposta.ok) {
        const erro = await resposta.text();
        toast({ title: 'Erro ao salvar na empresa.', description: erro, status: 'error', isClosable: true });
        return;
        }

       toast({ title: 'Abastecimento salvo na empresa.', status: 'success', isClosable: true });
        onSucesso?.(veiculosAtualizados.find(v => v.veiculo === veiculo)?.['ABASTECIMENTO-DISPONIVELE-LITRO'] || 0);
        onClose();
        resetarCampos();
        return;
    }

    // Caso contrário, salvar no modelo de veículo do usuário
    const res = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(MODEL-VEHICLE,eq,${veiculo})`, {
        headers: { 'xc-token': NOCODB_TOKEN }
    });

    const dados = await res.json();
    const veiculoUser = dados?.list?.[0];

    if (!veiculoUser || !veiculoUser.Id) {
        toast({ title: 'Veículo do usuário não encontrado.', status: 'error', isClosable: true });
        return;
    }

    const litrosAntigos = parseFloat(veiculoUser['ABASTECIMENTO-DISPONIVELE-LITRO']) || 0;
    const litrosMaximo = parseFloat(veiculoUser['LITROS-MAXIMO']) || 60;
    const novoTotal = litrosAntigos + novoLitros;
    const litrosAtualizados = novoTotal > litrosMaximo ? litrosMaximo : novoTotal;


    const abastecimentoZerado = {
      veiculo,
      data: dataHoje,
      tipo: tipoCombustivel,
      valor: valorAbastecido,
      preco_litro: precoPorLitro,
      litros: novoLitros,
      comprovantes: comprovantes.filter(Boolean),
    };


    const payload = {
        Id: veiculoUser.Id,
        'ABASTECIMENTO-DISPONIVELE-LITRO': litrosAtualizados,
        'ABASTECIMENTO-ZERADO': [...(veiculoUser['ABASTECIMENTO-ZERADO'] || []), abastecimentoZerado],
    };

    const resposta = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records`, {
        method: 'PATCH',
        headers: {
        'Content-Type': 'application/json',
        'xc-token': NOCODB_TOKEN,
        },
        body: JSON.stringify(payload),
    });

    if (!resposta.ok) {
        const erro = await resposta.text();
        toast({ title: 'Erro ao salvar no usuário.', description: erro, status: 'error', isClosable: true });
        return;
    }

    toast({ title: 'Abastecimento salvo no usuário.', status: 'success', isClosable: true });
    onSucesso?.(litrosAtualizados);
    onClose();
    resetarCampos();
    };

    const resetarCampos = () => {
    setTipoCombustivel('');
    setValorAbastecido('');
    setPrecoPorLitro('');
    setComprovantes([]);
    };


  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Reabastecer Veículo</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={4}>
          <VStack spacing={4}>
            <Select
              placeholder="Tipo de Combustível"
              value={tipoCombustivel}
              onChange={(e) => setTipoCombustivel(e.target.value)}
            >
              <option>Gasolina</option>
              <option>Álcool</option>
              <option>Diesel</option>
            </Select>

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
              value={precoPorLitro}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                const formatted = (Number(raw) / 100).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 2,
                });
                setPrecoPorLitro(formatted);
              }}
            />

            <label>
              <IconButton icon={<FiCamera />} as="span" aria-label="Foto" />
              <input type="file" hidden accept="image/*" onChange={handleUploadComprovante} />
            </label>

            <HStack wrap="wrap">
              {comprovantes.map((url, idx) => (
                <Box key={idx} position="relative" boxSize="100px">
                  <Image src={url} alt={`Comprovante ${idx + 1}`} borderRadius="md" objectFit="cover" boxSize="100px" />
                  <IconButton
                    icon={<FiTrash />}
                    size="xs"
                    position="absolute"
                    top="2px"
                    right="2px"
                    colorScheme="red"
                    onClick={() => setComprovantes(prev => prev.filter((_, i) => i !== idx))}
                  />
                </Box>
              ))}
            </HStack>

            <Button w="full" colorScheme="green" onClick={handleSalvar}>
              Salvar Abastecimento
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
