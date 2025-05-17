import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_NOCODB_URL,
  headers: {
    'Content-Type': 'application/json',
    'xc-token': import.meta.env.VITE_NOCODB_TOKEN
  }
});

export async function salvarRegistroKm(cpf, dadosDoDia, dataManual = null) {
  const dataFormatada = dataManual 
    ? dataManual 
    : new Date().toISOString().split('T')[0];

  const diaSemana = new Date(dataFormatada + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
  });

  try {
    const res = await api.get(`/api/v2/tables/m0hj8eje9k5w4c0/records`, {
      params: {
        where: `(UnicID-CPF,eq,${cpf})`
      }
    });

    const existe = res.data.list[0];
    const payloadDia = {
      "UnicID-CPF": cpf,
      "Dia-da-Semana": diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1),
      "KM-Control": dadosDoDia
    };

    if (existe) {
      const idRegistro = existe.Id;
      const dadosSemanal = existe['KM-CONTROL-SEMANAL'] || {};
      let atual = dadosSemanal[dataFormatada] || [];

      const indiceExistente = atual.findIndex(
        (reg) => reg['KM-Control']?.['KM-INICIAL'] === dadosDoDia['KM-INICIAL']
      );

      if (indiceExistente !== -1) {
        atual[indiceExistente]['KM-Control'] = {
          ...atual[indiceExistente]['KM-Control'],
          ...dadosDoDia
        };
      } else {
        atual.push(payloadDia);
      }

      const novoKMControlSemanal = {
        ...dadosSemanal,
        [dataFormatada]: atual
      };

      await api.patch(`/api/v2/tables/m0hj8eje9k5w4c0/records`, {
        "Id": idRegistro,
        "KM-CONTROL-SEMANAL": novoKMControlSemanal
      });

      return { status: 'atualizado', id: idRegistro };
    }

    await api.post(`/api/v2/tables/m0hj8eje9k5w4c0/records`, {
      "UnicID-CPF": cpf,
      "KM-CONTROL-SEMANAL": {
        [dataFormatada]: [payloadDia]
      }
    });

    return { status: 'criado' };
  } catch (err) {
    console.error('Erro ao salvar controle KM:', err);
    throw err;
  }
}


export default api;
