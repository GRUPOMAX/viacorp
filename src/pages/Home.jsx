import { Box, Heading, Spinner } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import ModalInicioDoDia from '../components/ModalInicioDoDia';
import CardDiaRodando from '../components/CardDiaRodando';
import ModalFinalizarDia from '../components/ModalFinalizarDia';
import BottomMenu from '../components/BottomMenu';
import ModalRelatorioDia from '../components/ModalRelatorioDia';

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
  const [diaSelecionado, setDiaSelecionado] = useState(null); // usado no modal
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState(null);

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
        const inicioSemana = hoje.startOf('week').add(1, 'day'); // segunda

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
    const hora = dados?.hora ?? new Date(); // fallback
    setDiaSelecionado({ ...dados, hora });
    setMostrarFinalizacao(true);
  }
};


const salvarFinalizacao = (infoAtualizado) => {
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
            ...infoAtualizado, // atualiza os campos
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
      <Heading size="lg" textAlign="center" mb={4}>
        ViaCorp - KM Control
      </Heading>

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
            dadosDia={diaSelecionado} // ✅ necessário para o cálculo
          />

          <ModalRelatorioDia
            isOpen={modalRelatorioAberto}
            onClose={() => setModalRelatorioAberto(false)}
            dados={registroSelecionado}
          />

        </>
      )}

      <BottomMenu />
    </Box>
  );
}
