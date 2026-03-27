import type { EspelhoPontoDia, PontoRegistroRow } from './pontoTypes'

const LOCALE = 'pt-BR'

export const TIPOS_FUNCIONARIO_IDS = [1, 2, 3, 4, 6, 7]

export const obterDataLocalISO = (data = new Date()): string => {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export const formatarData = (valor: string): string =>
  new Date(`${valor}T00:00:00`).toLocaleDateString(LOCALE)

export const formatarHora = (valor?: string | null): string => {
  if (!valor) return '—'
  return new Date(valor).toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const formatarDataHora = (valor?: string | null): string => {
  if (!valor) return '—'
  return new Date(valor).toLocaleString(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

export const nomeMesReferencia = (mesReferencia: string): string => {
  const [ano, mes] = mesReferencia.split('-').map(Number)
  const data = new Date(ano, (mes || 1) - 1, 1)
  return data.toLocaleDateString(LOCALE, {
    month: 'long',
    year: 'numeric',
  })
}

export const determinarProximoTipoRegistro = (
  registrosHoje: PontoRegistroRow[],
): 'Entrada' | 'Saida' | null => {
  const temEntrada = registrosHoje.some((r) => r.tipo_registro === 'Entrada')
  const temSaida = registrosHoje.some((r) => r.tipo_registro === 'Saida')

  if (!temEntrada) return 'Entrada'
  if (!temSaida) return 'Saida'
  return null
}

export const obterDiasDoMes = (mesReferencia: string): string[] => {
  const [ano, mes] = mesReferencia.split('-').map(Number)
  const quantidadeDias = new Date(ano, mes, 0).getDate()

  return Array.from({ length: quantidadeDias }, (_, indice) => {
    const data = new Date(ano, mes - 1, indice + 1)
    return obterDataLocalISO(data)
  })
}

export const montarEspelhoMensal = (
  registros: PontoRegistroRow[],
  mesReferencia: string,
): EspelhoPontoDia[] => {
  const agrupado = new Map<string, PontoRegistroRow[]>()

  registros.forEach((registro) => {
    const lista = agrupado.get(registro.data_referencia) ?? []
    lista.push(registro)
    agrupado.set(registro.data_referencia, lista)
  })

  return obterDiasDoMes(mesReferencia).map((data) => {
    const lista = (agrupado.get(data) ?? []).sort(
      (a, b) =>
        new Date(a.registrado_em).getTime() - new Date(b.registrado_em).getTime(),
    )

    const entrada = lista.find((item) => item.tipo_registro === 'Entrada')
    const saida = [...lista].reverse().find((item) => item.tipo_registro === 'Saida')
    const diaDaSemana = new Date(`${data}T00:00:00`).getDay()
    const fimDeSemana = diaDaSemana === 0 || diaDaSemana === 6

    let status: EspelhoPontoDia['status'] = 'Sem registro'
    if (fimDeSemana && !entrada && !saida) status = 'Fim de semana'
    else if (entrada && saida) status = 'Completo'
    else if (entrada || saida) status = 'Parcial'

    const observacoes = lista
      .map((item) => item.observacao?.trim())
      .filter(Boolean)
      .join(' | ')

    return {
      data,
      diaSemana: new Date(`${data}T00:00:00`).toLocaleDateString(LOCALE, {
        weekday: 'short',
      }),
      entrada: formatarHora(entrada?.registrado_em),
      saida: formatarHora(saida?.registrado_em),
      status,
      observacao: observacoes || '—',
    }
  })
}

export const gerarHtmlEspelhoPonto = (args: {
  nomeFuncionario: string
  emailFuncionario: string
  mesReferencia: string
  espelho: EspelhoPontoDia[]
}): string => {
  const { nomeFuncionario, emailFuncionario, mesReferencia, espelho } = args

  const linhas = espelho
    .map(
      (dia) => `
        <tr>
          <td>${formatarData(dia.data)}</td>
          <td>${dia.diaSemana}</td>
          <td>${dia.entrada}</td>
          <td>${dia.saida}</td>
          <td>${dia.status}</td>
          <td>${dia.observacao}</td>
        </tr>
      `,
    )
    .join('')

  const completos = espelho.filter((d) => d.status === 'Completo').length
  const parciais = espelho.filter((d) => d.status === 'Parcial').length
  const semRegistro = espelho.filter((d) => d.status === 'Sem registro').length

  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Espelho de ponto - ${nomeFuncionario}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          h1, h2, p { margin: 0 0 10px; }
          .muted { color: #4b5563; }
          .summary { display: flex; gap: 16px; margin: 18px 0; }
          .summary div { border: 1px solid #d1d5db; border-radius: 8px; padding: 10px 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f3f4f6; }
          .assinaturas { display: flex; justify-content: space-between; gap: 32px; margin-top: 64px; }
          .assinatura { width: 45%; text-align: center; }
          .linha { border-top: 1px solid #111827; padding-top: 8px; }
        </style>
      </head>
      <body>
        <h1>Espelho mensal de ponto</h1>
        <p class="muted"><strong>Funcionário:</strong> ${nomeFuncionario}</p>
        <p class="muted"><strong>E-mail:</strong> ${emailFuncionario}</p>
        <p class="muted"><strong>Competência:</strong> ${nomeMesReferencia(mesReferencia)}</p>

        <div class="summary">
          <div><strong>Dias completos:</strong> ${completos}</div>
          <div><strong>Dias parciais:</strong> ${parciais}</div>
          <div><strong>Sem registro:</strong> ${semRegistro}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Dia</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Status</th>
              <th>Observações</th>
            </tr>
          </thead>
          <tbody>${linhas}</tbody>
        </table>

        <div class="assinaturas">
          <div class="assinatura">
            <div class="linha">Assinatura do funcionário</div>
          </div>
          <div class="assinatura">
            <div class="linha">Secretaria / responsável</div>
          </div>
        </div>
      </body>
    </html>
  `
}
