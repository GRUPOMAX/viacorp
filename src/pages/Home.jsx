import { Box, Heading, Spinner, IconButton } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import ModalInicioDoDia from '../components/ModalInicioDoDia';
import CardDiaRodando from '../components/CardDiaRodando';
import ModalFinalizarDia from '../components/ModalFinalizarDia';
import BottomMenu from '../components/BottomMenu';
import ModalRelatorioDia from '../components/ModalRelatorioDia';
import ModalAbastecimentoZerado from '../components/ModalAbastecimentoZerado';

import { FiPlusCircle } from 'react-icons/fi';

import api, { salvarRegistroKm } from '../services/api';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);
dayjs.locale('pt-br');

export default function Home() {
  const [diasSemana, setDiasSemana] = useState([]);
  const [mostrarFinalizacao, setMostrarFinalizacao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [diaSelecionado, setDiaSelecionado] = useState(null);
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [litrosRestantes, setLitrosRestantes] = useState(null);
  const [modalAbastecimentoAberto, setModalAbastecimentoAberto] = useState(false);

  const fetchLitrosDisponiveis = async (cpf) => {
    try {
      const res = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${cpf})`,
        { headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN } }
      );
      const veiculo = await res.json();
      const litros = veiculo?.list?.[0]?.['ABASTECIMENTO-DISPONIVELE-LITRO'];
      setLitrosRestantes(Number(litros));
    } catch (err) {
      console.error('Erro ao buscar litros restantes:', err);
    }
  };

  useEffect(() => {
    const fetchSemana = async () => {
      setCarregando(true);

      const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
      const cpf = usuario?.['UnicID-CPF'];
      if (!cpf) return;

      try {
        const res = await api.get('/api/v2/tables/m0hj8eje9k5w4c0/records', {
          params: {
            where: `(UnicID-CPF,eq,${cpf})`
          }
        });

        const registro = res.data.list[0];
        const semana = [];
        const hoje = dayjs();
        const inicioSemana = hoje.startOf('week').add(1, 'day');

        for (let i = 0; i < 7; i++) {
          const dia = inicioSemana.add(i, 'day');
          const dataFormatada = dia.format('YYYY-MM-DD');
          const registros = registro?.['KM-CONTROL-SEMANAL']?.[dataFormatada];

          if (registros && registros.length > 0) {
            registros.forEach((registro) => {
              const horaString = registro?.['KM-Control']?.['HORA_KM-INICIAL'] || '00:00';
              const hora = dayjs(`${dataFormatada} ${horaString}`, 'YYYY-MM-DD HH:mm').toDate();

              semana.push({
                ...registro,
                hora,
                data: dataFormatada,
                veiculo: registro?.['KM-Control']?.['VEICULO'] ?? 'Não informado',
                cpf: cpf
              });
            });
          }
        }

        setDiasSemana(semana);
        await fetchLitrosDisponiveis(cpf);
      } catch (err) {
        console.error('Erro ao buscar controle KM:', err);
      } finally {
        setCarregando(false);
      }
    };

    fetchSemana();
  }, []);

  const abrirFinalizacao = (dados) => {
    const kmFinal = dados?.['KM-Control']?.['KM-FINAL'];
    if (typeof kmFinal === 'number' && kmFinal > 0) {
      setRegistroSelecionado(dados);
      setModalRelatorioAberto(true);
    } else {
      const hora = dados?.hora ?? new Date();
      setDiaSelecionado({ ...dados, hora });
      setMostrarFinalizacao(true);
    }
  };

  const salvarFinalizacao = (infoAtualizado) => {
    const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
    const cpf = usuario?.['UnicID-CPF'];
    const litrosRestantesAtual = infoAtualizado?.LITROS_RESTANTES_APOS;
    if (litrosRestantesAtual !== undefined) setLitrosRestantes(litrosRestantesAtual);

    setDiasSemana((prev) =>
      prev.map((dia) => {
        if (
          dia?.['UnicID-CPF'] === diaSelecionado?.['UnicID-CPF'] &&
          dayjs(dia.hora).isSame(diaSelecionado.hora, 'day')
        ) {
          return {
            ...dia,
            'KM-Control': {
              ...dia['KM-Control'],
              ...infoAtualizado
            },
          };
        }
        return dia;
      })
    );

    setMostrarFinalizacao(false);
  };

  return (
    <Box p={4} pb="100px">
      <Heading size="lg" textAlign="center" mb={2}>
        ViaCorp - KM Control
      </Heading>

      {litrosRestantes !== null && (
        <Box textAlign="center" mb={4}>
          <Box
            bg={litrosRestantes <= 0 ? 'red.100' : 'blue.100'}
            color={litrosRestantes <= 0 ? 'red.600' : 'blue.700'}
            px={4}
            py={2}
            borderRadius="md"
            fontWeight="semibold"
            fontSize="sm"
            display="inline-flex"
            alignItems="center"
            gap={2}
          >
            Combustível restante: {litrosRestantes.toFixed(2)} litros
            {litrosRestantes <= 0 && (
              <IconButton
                icon={<FiPlusCircle />}
                size="xs"
                colorScheme="red"
                variant="ghost"
                aria-label="Abastecer agora"
                onClick={() => setModalAbastecimentoAberto(true)}
              />
            )}
          </Box>
        </Box>
      )}

      {carregando ? (
        <Spinner size="lg" />
      ) : (
        <>
          {diasSemana.map((dia, index) => (
            <CardDiaRodando key={index} dados={dia} aoClicar={() => abrirFinalizacao(dia)} />
          ))}

          <ModalInicioDoDia
            onSalvar={(d) => setDiasSemana((prev) => [...prev, d])}
          />

          <ModalFinalizarDia
            isOpen={mostrarFinalizacao}
            onClose={() => setMostrarFinalizacao(false)}
            onSalvar={salvarFinalizacao}
            dadosDia={diaSelecionado}
          />

          <ModalRelatorioDia
            isOpen={modalRelatorioAberto}
            onClose={() => setModalRelatorioAberto(false)}
            dados={registroSelecionado}
          />

          <ModalAbastecimentoZerado
            isOpen={modalAbastecimentoAberto}
            onClose={() => setModalAbastecimentoAberto(false)}
            onSucesso={(novoValor) => setLitrosRestantes(novoValor)} // ✅ atualiza na hora
          />
        </>
      )}

      <BottomMenu />
    </Box>
  );
}