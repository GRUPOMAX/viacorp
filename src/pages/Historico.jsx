import { Box, Heading, Spinner, VStack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { FiCalendar } from 'react-icons/fi';

import 'react-datepicker/dist/react-datepicker.css';

import CardDiaRodando from '../components/CardDiaRodando';
import ModalRelatorioDia from '../components/ModalRelatorioDia';
import BottomMenu from '../components/BottomMenu';
import api from '../services/api';

import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(isoWeek);
dayjs.locale('pt-br');

export default function Historico() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState(new Date());

  const [registroSelecionado, setRegistroSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    const buscarHistorico = async () => {
      setCarregando(true);

      const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
      const cpf = usuario?.['UnicID-CPF'];
      if (!cpf) return;

      try {
        const res = await api.get('/api/v2/tables/mcfjf5y9bb4z5h0/records', {
          params: {
            where: `(UnicID-CPF,eq,${cpf})`
          }
        });

        const registro = res.data.list[0];
        const registrosDoDia = [];
        const dataFormatada = dayjs(dataSelecionada).format('YYYY-MM-DD');

        const registros = registro?.['KM-CONTROL-SEMANAL']?.[dataFormatada];
        if (registros && registros.length > 0) {
          registros.forEach((r) => {
            const horaString = r?.['KM-Control']?.['HORA_KM-INICIAL'] || '00:00';
            const hora = dayjs(`${dataFormatada} ${horaString}`, 'YYYY-MM-DD HH:mm').toDate();

            registrosDoDia.push({
              ...r,
              hora,
              data: dataFormatada,
              veiculo: r?.['KM-Control']?.['VEICULO'] ?? 'Não informado',
              cpf: cpf
            });
          });
        }

        setDados(registrosDoDia);
      } catch (err) {
        console.error('Erro ao buscar histórico:', err);
      } finally {
        setCarregando(false);
      }
    };

    buscarHistorico();
  }, [dataSelecionada]);

  const abrirModal = (registro) => {
    setRegistroSelecionado(registro);
    setModalAberto(true);
  };

  return (
    <Box p={4} pb="100px">
      <Heading size="lg" textAlign="center" mb={4}>
        Histórico de KM
      </Heading>
        <VStack spacing={4} mb={4}>
        <Box position="relative" w="100%" maxW="300px">
            <DatePicker
            selected={dataSelecionada}
            onChange={(date) => setDataSelecionada(date)}
            dateFormat="dd/MM/yyyy"
            className="chakra-datepicker-input"
            />
            <Box position="absolute" top="50%" right="10px" transform="translateY(-50%)">
            <FiCalendar color="#718096" />
            </Box>
        </Box>
        </VStack>


      {carregando ? (
        <Spinner size="lg" />
      ) : (
        <>
          {dados.length > 0 ? (
            dados.map((r, i) => (
              <CardDiaRodando key={i} dados={r} aoClicar={() => abrirModal(r)} />
            ))
          ) : (
            <Box textAlign="center" color="gray.500" mt={6}>
              Nenhum registro encontrado para a data selecionada.
            </Box>
          )}
        </>
      )}

      <ModalRelatorioDia
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        dados={registroSelecionado}
      />

      <BottomMenu />
    </Box>
  );
}
