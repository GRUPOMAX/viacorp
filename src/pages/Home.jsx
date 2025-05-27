import { Box, Heading, Spinner, IconButton, Select  } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import ModalInicioDoDia from '../components/ModalInicioDoDia';
import CardDiaRodando from '../components/CardDiaRodando';
import ModalFinalizarDia from '../components/ModalFinalizarDia';
import BottomMenu from '../components/BottomMenu';
import ModalRelatorioDia from '../components/ModalRelatorioDia';
import ModalAbastecimentoZerado from '../components/ModalAbastecimentoZerado';
import { Tooltip } from '@chakra-ui/react'; // adicione se ainda não tiver


import { FiPlusCircle } from 'react-icons/fi';

import api, { salvarRegistroKm } from '../services/api';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import isoWeek from 'dayjs/plugin/isoWeek';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
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
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState('');
  const [modalInicioAberto, setModalInicioAberto] = useState(false);
  const [performanceAtual, setPerformanceAtual] = useState(null);




  // 🔁 Animação de pulsação
  const pulse = keyframes`
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  `;


  const fetchVeiculosDisponiveis = async () => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
      const cpf = usuario?.['UnicID-CPF'];
      const empresa = usuario?.Enterprise?.trim();

      // Sempre busca os dados do usuário
      const resUsuario = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${cpf})`, {
        headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN }
      });

      const dadosUsuario = await resUsuario.json();
      const veiculoUsuario = dadosUsuario?.list?.[0]?.['MODEL-VEHICLE'];

      // Se o usuário estiver vinculado a uma empresa, tenta buscar veículos da empresa
      if (empresa) {
        const resEmpresa = await fetch(`https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records?where=(Enterprise,eq,${empresa})`, {
          headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN }
        });

        const dadosEmpresa = await resEmpresa.json();
        const veiculosPadrao = dadosEmpresa?.list?.[0]?.['Vehicle-Standard'] ?? [];

        // Evita duplicata caso o veículo do usuário esteja na lista padrão
        const listaFinal = veiculoUsuario
          ? [veiculoUsuario, ...veiculosPadrao.map(v => v.veiculo).filter(v => v !== veiculoUsuario)]
          : veiculosPadrao.map(v => v.veiculo);

        setVeiculosDisponiveis(listaFinal);
        setVeiculoSelecionado(veiculoUsuario || listaFinal[0]);
      } else {
        // Sem empresa vinculada, usa somente o veículo do usuário
        setVeiculosDisponiveis(veiculoUsuario ? [veiculoUsuario] : []);
        setVeiculoSelecionado(veiculoUsuario || '');
      }
    } catch (err) {
      console.error('Erro ao carregar veículos disponíveis:', err);
    }
  };




  const fetchLitrosPorVeiculo = async (modelo) => {
    try {
      const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
      const cpf = usuario?.['UnicID-CPF'];
      const empresa = usuario?.company ?? 'max-fibra';

      // Busca veículos do usuário
      const resUser = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/m1sy388a4zv1kgl/records?where=(UnicID-CPF,eq,${cpf})`,
        { headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN } }
      );
      const dadosUser = await resUser.json();
      const veiculoUser = dadosUser?.list?.[0];
      const modeloUser = veiculoUser?.['MODEL-VEHICLE'];

      if (modelo === modeloUser) {
        const litros = veiculoUser?.['ABASTECIMENTO-DISPONIVELE-LITRO'];
        const performance = veiculoUser?.['KM-PERFORMACE'];
        setLitrosRestantes(Number(litros));
        setPerformanceAtual(Number(performance) || 0); // ✅ aqui
        return;
      }

      // Se for padrão, busca na outra tabela
      const resPadrao = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records?where=(Enterprise,eq,${empresa})`,
        { headers: { 'xc-token': import.meta.env.VITE_NOCODB_TOKEN } }
      );
      const dadosPadrao = await resPadrao.json();
      const veiculosPadrao = dadosPadrao?.list?.[0]?.['Vehicle-Standard'] ?? [];
      const encontrado = veiculosPadrao.find(v => v.veiculo === modelo);

      if (encontrado && typeof encontrado['ABASTECIMENTO-DISPONIVELE-LITRO'] === 'number') {
        setLitrosRestantes(encontrado['ABASTECIMENTO-DISPONIVELE-LITRO']);
        setPerformanceAtual(Number(encontrado?.['KM-PERFORMACE']) || 0); // ✅ aqui também
      } else {
        setLitrosRestantes(0);
        setPerformanceAtual(0);
      }
    } catch (err) {
      console.error('Erro ao buscar combustível por veículo:', err);
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
      const controle = registro?.['KM-CONTROL-SEMANAL'] || {};

      const hoje = dayjs();
      const inicioSemana = hoje.startOf('week');
      const fimSemana = hoje.endOf('week');

      const listaFinal = [];

      Object.entries(controle).forEach(([data, entradas]) => {
        const dataDia = dayjs(String(data));
        console.log('🔍 data:', data, '➡️', dayjs(String(data)).format());


        entradas.forEach((entrada) => {
          const kmFinal = entrada?.['KM-Control']?.['KM-FINAL'];
          const dataFinalizacao = entrada?.['KM-Control']?.['DATA_FINALIZACAO'];
          const dataInicio = data;

          const naoFinalizado = !kmFinal || kmFinal === 0;

          const mostrar =
            (dataDia.isValid() &&
              dataDia.isSameOrAfter(inicioSemana, 'day') &&
              dataDia.isSameOrBefore(fimSemana, 'day')) ||
            naoFinalizado;

          if (mostrar) {
            const horaString = entrada?.['KM-Control']?.['HORA_KM-INICIAL'] || '00:00';
            const hora = dayjs(`${data} ${horaString}`, 'YYYY-MM-DD HH:mm').toDate();

            listaFinal.push({
              ...entrada,
              hora,
              data,
              veiculo: entrada?.['KM-Control']?.['VEICULO'] ?? 'Não informado',
              cpf,
            });
          }
        });
      });

      setDiasSemana(listaFinal);
      await fetchVeiculosDisponiveis();
    } catch (err) {
      console.error('Erro ao buscar controle KM:', err);
    } finally {
      setCarregando(false);
    }
  };

  fetchSemana();
}, []);


  useEffect(() => {
    if (veiculoSelecionado) {
      fetchLitrosPorVeiculo(veiculoSelecionado); // 👈 Busca inicial
    }

    const intervalo = setInterval(() => {
      if (veiculoSelecionado) {
        fetchLitrosPorVeiculo(veiculoSelecionado); // 🔁 Atualização contínua
      }
    }, 1000); // 1000 ms = 1 segundo

    return () => clearInterval(intervalo); // 🔚 Limpeza
  }, [veiculoSelecionado]);




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
        const mesmoDia = dayjs(dia.hora).format('YYYY-MM-DDTHH:mm') === dayjs(diaSelecionado.hora).format('YYYY-MM-DDTHH:mm');
        return mesmoDia
          ? { ...dia, 'KM-Control': { ...dia['KM-Control'], ...infoAtualizado } }
          : dia;
      })
    );


    setMostrarFinalizacao(false);
  };

  return (
    <Box p={4} pb="100px">

      <Heading size="lg" textAlign="center" mb={2} width={"90vw"}>
        ViaCorp - KM Control
      </Heading>
      {veiculosDisponiveis.length > 0 && (
          <Box mb={4}>
            <Select
              placeholder="Selecione o veículo"
              value={veiculoSelecionado}
              onChange={(e) => {
                const novoVeiculo = e.target.value;
                setVeiculoSelecionado(novoVeiculo);
                fetchLitrosPorVeiculo(novoVeiculo);
              }}
            >
              {veiculosDisponiveis.map((v, i) => (
                <option key={i} value={v}>{v}</option>
              ))}
            </Select>
          </Box>
        )}


        {typeof litrosRestantes === 'number' && !isNaN(litrosRestantes) && (
          <Box textAlign="center" mb={4}>
          <Box
            onClick={() => {
              if (litrosRestantes <= 5) setModalAbastecimentoAberto(true);
            }}
            cursor={litrosRestantes <= 5 ? 'pointer' : 'default'}
            bg={litrosRestantes <= 5 ? 'orange.100' : 'blue.100'}
            color={litrosRestantes <= 5 ? 'orange.700' : 'blue.700'}
            px={4}
            py={2}
            borderRadius="md"
            fontWeight="semibold"
            fontSize="sm"
            display="inline-flex"
            alignItems="center"
            gap={2}
            transition="all 0.2s"
            _hover={litrosRestantes <= 5 ? { bg: 'orange.200' } : {}}
            animation={litrosRestantes <= 5 ? `${pulse} 1.5s infinite` : 'none'}
          >
            <Tooltip
                label={
                  performanceAtual && performanceAtual > 0
                    ? `Cálculo: ${litrosRestantes.toFixed(2)} L × ${performanceAtual} km/L = ${(litrosRestantes * performanceAtual).toFixed(0)} km`
                    : 'Performance padrão não definida'
                }
                hasArrow
                placement="top"
                bg="gray.700"
                color="white"
                fontSize="xs"
              >
                <Box as="span">
                  Combustível restante: {litrosRestantes.toFixed(2)} litros
                  {performanceAtual && performanceAtual > 0 && (
                    <> ≈ {(litrosRestantes * performanceAtual).toFixed(0)} km</>
                  )}
                </Box>
              </Tooltip>
            {litrosRestantes <= 5 && <FiPlusCircle />}
          </Box>


          </Box>
        )}


      {carregando ? (
        <Spinner size="lg" />
      ) : (
        <>
        {[...diasSemana]
          .filter((dia) => {
            const kmFinal = dia?.['KM-Control']?.['KM-FINAL'];
            const dataFinalizacao = dia?.['KM-Control']?.['DATA_FINALIZACAO'];
            const dataInicio = dayjs(dia?.hora).format('YYYY-MM-DD');
            
            const naoFinalizado = !kmFinal || kmFinal === 0;
            const finalizadoNoMesmoDia = dataFinalizacao ? dataFinalizacao === dataInicio : true;
            return naoFinalizado || finalizadoNoMesmoDia;
          })
          .sort((a, b) => new Date(b.hora) - new Date(a.hora))
          .slice(0, 3)
          .map((dia, index) => (
            <CardDiaRodando key={index} dados={dia} aoClicar={() => abrirFinalizacao(dia)} />
        ))}

          <ModalInicioDoDia
            veiculoSelecionado={veiculoSelecionado}
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
            onSucesso={(novoValor) => setLitrosRestantes(novoValor)}
            veiculo={veiculoSelecionado}
          />
        </>
      )}

      <BottomMenu />
    </Box>
  );
}