// src/utils/handleSalvarInicioDoDia.js
import dayjs from 'dayjs';
import { salvarRegistroKm } from '../services/api';

const buscarNomeUsuario = async (cpf) => {
  const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;
  try {
    const res = await fetch(
      `https://nocodb.nexusnerds.com.br/api/v2/tables/msehqhsr7j040uq/records?where=(UnicID-CPF,eq,${cpf})&fields=first_nome,last_nome`,
      { headers: { 'xc-token': NOCODB_TOKEN } }
    );
    const data = await res.json();
    const user = data?.list?.[0];
    return user ? `${user.first_nome} ${user.last_nome}` : 'usuário não identificado';
  } catch {
    return 'usuário desconhecido';
  }
};

export async function handleSalvarInicioDoDia({
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
}) {
  if (!veiculo || !kmInicial) {
    toast({ title: 'Preencha todos os campos obrigatórios', status: 'warning', isClosable: true });
    return;
  }

  const usuario = JSON.parse(localStorage.getItem('usuario-viacorp'));
  if (!usuario?.CPF || !usuario?.Enterprise) {
    toast({ title: 'Erro: usuário não encontrado', status: 'error', isClosable: true });
    return;
  }

  try {
    setCarregando(true);
    const NOCODB_TOKEN = import.meta.env.VITE_NOCODB_TOKEN;
    let litrosDisponiveis = 0;

    // Busca abastecimento do usuário ou veículo da empresa
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
      const resEmpresa = await fetch(
        `https://nocodb.nexusnerds.com.br/api/v2/tables/mz92fb5ps4z32br/records?where=(Enterprise,eq,${usuario.Enterprise})`,
        { headers: { 'xc-token': NOCODB_TOKEN } }
      );
      const dadosEmpresa = await resEmpresa.json();
      const lista = dadosEmpresa?.list?.[0]?.['Vehicle-Standard'] ?? [];
      const veiculoEmpresa = lista.find(v => v.veiculo === veiculo);
      litrosDisponiveis = veiculoEmpresa?.['ABASTECIMENTO-DISPONIVELE-LITRO'] ?? 0;
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

    // Busca todos os registros
    const resTodos = await fetch(
      `https://nocodb.nexusnerds.com.br/api/v2/tables/m0hj8eje9k5w4c0/records`,
      { headers: { 'xc-token': NOCODB_TOKEN } }
    );
    const todosRegistros = await resTodos.json();
    const registrosDoDia = todosRegistros?.list ?? [];

    // Procura conflito de veículo em uso e não finalizado
    const entradaConflitante = registrosDoDia.flatMap(reg => {
      const controle = reg['KM-CONTROL-SEMANAL'];
      const entradas = controle?.[data] ?? [];

      return entradas
        .filter(ent => {
          const veiculoIgual = ent?.['KM-Control']?.VEICULO === veiculo;
          const naoFinalizado = !ent?.['KM-Control']?.['KM-FINAL'] || ent?.['KM-Control']?.['KM-FINAL'] === 0;
          const cpfOutro = reg['UnicID-CPF'] !== usuario.CPF;
          return veiculoIgual && naoFinalizado && cpfOutro;
        })
        .map(ent => reg['UnicID-CPF']);
    });

    if (entradaConflitante.length > 0) {
      const nome = await buscarNomeUsuario(entradaConflitante[0]);
      toast({
        title: 'Veículo já em uso',
        description: `Este veículo já foi iniciado por ${nome} hoje.`,
        status: 'error',
        isClosable: true,
      });
      setCarregando(false);
      return;
    }

    await salvarRegistroKm(usuario.CPF, dadosDoDia, data);

    toast({ title: 'Início do dia registrado!', status: 'success', isClosable: true });

    onSalvar?.({
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
}
