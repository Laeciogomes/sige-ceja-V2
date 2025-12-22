// frontend/src/utils/peDeMeia.ts
/**
 * Regras (baseadas em fontes oficiais do MEC) para "Pé-de-Meia".
 * ATENÇÃO:
 * - A elegibilidade real é definida pelo MEC/CAIXA por cruzamento (CadÚnico, CPF regular, matrícula etc.).
 * - Aqui fazemos uma "classificação operacional" usando os dados disponíveis no SIGE.
 *
 * Para CEJA, normalmente tratamos como EJA (Ensino Médio EJA).
 */

export type ModalidadePeDeMeia = 'EJA' | 'REGULAR'

export type PeDeMeiaInput = {
  // 1 = fundamental, 2 = médio (conforme o seu sistema)
  id_nivel_ensino?: number | null

  // Dados pessoais
  cpf?: string | null
  data_nascimento?: string | null

  // Proxy de CadÚnico/baixa renda no SIGE
  // (oficialmente é CadÚnico, mas no sistema geralmente NIS e/ou benefício indicam isso)
  nis?: string | null
  possui_beneficio_governo?: boolean | null

  // Matrícula (para regra do "até 2 meses após o início do período letivo")
  data_matricula?: string | null
  ano_letivo?: number | null

  // Se não vier, assumimos EJA (adequado ao CEJA)
  modalidade?: ModalidadePeDeMeia
}

export type PeDeMeiaClassificacao =
  | 'ELEGIVEL'
  | 'ELEGIVEL_ATE_31_12'
  | 'NAO_ELEGIVEL'
  | 'INDETERMINADO'

export type PeDeMeiaResultado = {
  classificacao: PeDeMeiaClassificacao
  elegivel: boolean
  motivos: string[] // motivos de não elegível / indeterminado
  avisos: string[] // avisos não bloqueantes
  detalhes: {
    modalidade: ModalidadePeDeMeia
    ano_referencia: number | null
    idade_inicio_periodo: number | null
    idade_31_12: number | null
    cpf_informado: boolean
    cadunico_indicado: boolean | null
    matricula_no_prazo: boolean | null
  }
}

/**
 * Configuração operacional do SIGE:
 * - O MEC fala "até 2 meses após o início do período letivo" (o início varia por rede).
 * - No seu código atual, estava sendo usado:
 *    1º semestre: 07/01
 *    2º semestre: 01/07
 * - Mantemos isso como padrão, mas deixamos configurável.
 */
export type PeDeMeiaConfig = {
  inicio_primeiro_semestre?: { month0: number; day: number } // month0: 0..11
  inicio_segundo_semestre?: { month0: number; day: number }
  prazo_meses_apos_inicio?: number // padrão: 2

  exigir_prazo_matricula?: boolean // padrão: true
  exigir_cpf?: boolean // padrão: true
  exigir_cadunico?: boolean // padrão: true (mas pode ser relaxado se quiser só "marcar possível")
}

const DEFAULT_CONFIG: Required<PeDeMeiaConfig> = {
  inicio_primeiro_semestre: { month0: 0, day: 7 }, // 07/01
  inicio_segundo_semestre: { month0: 6, day: 1 }, // 01/07
  prazo_meses_apos_inicio: 2,
  exigir_prazo_matricula: true,
  exigir_cpf: true,
  exigir_cadunico: true,
}

function parseDateSafe(v: string | null | undefined): Date | null {
  if (!v) return null
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function makeDateAno(ano: number, md: { month0: number; day: number }): Date {
  const m = Number.isFinite(md.month0) ? md.month0 : 0
  const day = Number.isFinite(md.day) ? md.day : 1
  return new Date(ano, m, day)
}

function addMonthsSafe(base: Date, months: number): Date {
  const d = new Date(base.getTime())
  d.setMonth(d.getMonth() + months)
  return d
}

export function calcularIdadeEm(dataNascimentoISO: string, referencia: Date): number | null {
  const nasc = parseDateSafe(dataNascimentoISO)
  if (!nasc) return null

  let idade = referencia.getFullYear() - nasc.getFullYear()
  const m = referencia.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && referencia.getDate() < nasc.getDate())) idade--
  return idade
}

/**
 * Proxy (SIGE) para o requisito oficial: "família inscrita no CadÚnico".
 * - Se tem NIS, normalmente indica CadÚnico.
 * - Se marcou que possui benefício do governo, também é um forte indicativo.
 *
 * Retorno:
 * - true  -> há indicação de CadÚnico/baixa renda
 * - false -> há indicação de "não"
 * - null  -> dados insuficientes no SIGE para afirmar
 */
export function inferirCadUnico(
  nis: string | null | undefined,
  possuiBeneficio: boolean | null | undefined,
): boolean | null {
  const nisOk = Boolean((nis ?? '').trim())
  if (nisOk) return true

  if (possuiBeneficio === true) return true
  if (possuiBeneficio == null) return null

  // possuiBeneficio === false e sem NIS
  return false
}

/**
 * Regra operacional do "prazo de matrícula":
 * - oficial: "até 2 meses após o início do período letivo"
 * - aqui: usamos 07/01 e 01/07 como padrão do SIGE (configurável)
 *
 * Retorno:
 * - true/false quando conseguimos calcular
 * - null se faltar data_matricula/ano ou data inválida
 */
export function verificarMatriculaNoPrazo(
  dataMatriculaISO: string | null | undefined,
  anoLetivo: number | null | undefined,
  config?: PeDeMeiaConfig,
): boolean | null {
  const cfg = { ...DEFAULT_CONFIG, ...(config ?? {}) }

  const dataMat = parseDateSafe(dataMatriculaISO)
  const ano = typeof anoLetivo === 'number' && Number.isFinite(anoLetivo) ? anoLetivo : null
  if (!dataMat || !ano) return null

  const inicio1 = makeDateAno(ano, cfg.inicio_primeiro_semestre)
  const inicio2 = makeDateAno(ano, cfg.inicio_segundo_semestre)

  // Determina em qual "janela" a matrícula cai
  const inicioPeriodo = dataMat <= inicio2 ? inicio1 : inicio2
  const cutoff = addMonthsSafe(inicioPeriodo, cfg.prazo_meses_apos_inicio)

  return dataMat <= cutoff
}

export function avaliarPeDeMeia(input: PeDeMeiaInput, config?: PeDeMeiaConfig): PeDeMeiaResultado {
  const cfg = { ...DEFAULT_CONFIG, ...(config ?? {}) }
  const modalidade: ModalidadePeDeMeia = input.modalidade ?? 'EJA'

  const motivos: string[] = []
  const avisos: string[] = []

  let naoElegivel = false
  let indeterminado = false

  const fail = (msg: string) => {
    naoElegivel = true
    motivos.push(msg)
  }

  const unsure = (msg: string) => {
    indeterminado = true
    motivos.push(msg)
  }

  // === 1) Ensino médio ===
  const nivel = input.id_nivel_ensino ?? null
  if (nivel !== 2) {
    fail('Pé-de-Meia é para estudantes do ensino médio (no SIGE: nível = Médio).')
  }

  // === 2) CPF ===
  const cpfInformado = Boolean((input.cpf ?? '').trim())
  if (cfg.exigir_cpf && !cpfInformado) {
    fail('CPF não informado (o programa exige CPF regular).')
  }

  // === 3) CadÚnico (proxy pelo SIGE) ===
  const cadIndicado = inferirCadUnico(input.nis, input.possui_beneficio_governo)
  if (cfg.exigir_cadunico) {
    if (cadIndicado === false) {
      fail('Sem indicação de CadÚnico/baixa renda (no SIGE: sem NIS e sem benefício do governo).')
    } else if (cadIndicado == null) {
      unsure('Dados insuficientes para confirmar CadÚnico (preencha NIS e/ou benefício do governo).')
    }
  }

  // === 4) Ano de referência ===
  const ano = typeof input.ano_letivo === 'number' && Number.isFinite(input.ano_letivo) ? input.ano_letivo : null
  if (!ano) {
    unsure('Ano letivo não informado (necessário para calcular idade e prazo).')
  }

  // === 5) Idade (EJA vs Regular) ===
  let idade31: number | null = null
  let idadeInicio: number | null = null

  if (ano) {
    const ref31 = new Date(ano, 11, 31)

    if (!input.data_nascimento) {
      unsure('Data de nascimento não informada (necessário para regra de idade).')
    } else {
      idade31 = calcularIdadeEm(input.data_nascimento, ref31)

      // Início do período (para tratar a exceção de quem faz 25 durante o ano, mas recebe até 31/12)
      const dm = parseDateSafe(input.data_matricula)
      const inicio1 = makeDateAno(ano, cfg.inicio_primeiro_semestre)
      const inicio2 = makeDateAno(ano, cfg.inicio_segundo_semestre)
      const inicioPeriodo = dm ? (dm <= inicio2 ? inicio1 : inicio2) : inicio1

      idadeInicio = calcularIdadeEm(input.data_nascimento, inicioPeriodo)

      if (idade31 == null || idadeInicio == null) {
        unsure('Não foi possível calcular a idade (data inválida).')
      } else {
        if (modalidade === 'EJA') {
          // Regra EJA: faixa 19-24; MEC menciona 19 completados até 31/12 e tratamento de desligamento ao completar 25.
          if (idade31 < 19) fail('EJA: idade abaixo de 19 anos no ano de referência.')
          if (idadeInicio > 24) fail('EJA: idade acima de 24 anos no início do período letivo.')
          if (!naoElegivel && idade31 > 24 && idadeInicio <= 24) {
            avisos.push('EJA: completa 25 anos no ano de referência; tende a receber até 31/12 e ser desligado ao fim do período letivo.')
          }
          if (!naoElegivel && idadeInicio < 19 && idade31 >= 19) {
            avisos.push('EJA: completa 19 anos durante o ano; elegibilidade pode iniciar no ano de referência.')
          }
        } else {
          // Regular: faixa 14-24
          if (idade31 < 14) fail('Regular: idade abaixo de 14 anos no ano de referência.')
          if (idade31 > 24) fail('Regular: idade acima de 24 anos no ano de referência.')
        }
      }
    }
  }

  // === 6) Prazo de matrícula (até 2 meses após início do período letivo) ===
  const matriculaNoPrazo = cfg.exigir_prazo_matricula
    ? verificarMatriculaNoPrazo(input.data_matricula, input.ano_letivo, cfg)
    : null

  if (cfg.exigir_prazo_matricula) {
    if (matriculaNoPrazo === false) {
      fail('Matrícula fora do prazo (até 2 meses após o início do período letivo).')
    } else if (matriculaNoPrazo == null) {
      unsure('Não foi possível validar o prazo de matrícula (data_matricula e/ou ano_letivo ausentes/ inválidos).')
    }
  }

  // === classificação final ===
  let classificacao: PeDeMeiaClassificacao = 'INDETERMINADO'
  if (naoElegivel) classificacao = 'NAO_ELEGIVEL'
  else if (indeterminado) classificacao = 'INDETERMINADO'
  else {
    // Se EJA e completa 25 no ano (idade31 > 24), mas começou com <=24: marca especial
    if (modalidade === 'EJA' && idade31 != null && idadeInicio != null && idade31 > 24 && idadeInicio <= 24) {
      classificacao = 'ELEGIVEL_ATE_31_12'
    } else {
      classificacao = 'ELEGIVEL'
    }
  }

  return {
    classificacao,
    elegivel: classificacao === 'ELEGIVEL' || classificacao === 'ELEGIVEL_ATE_31_12',
    motivos,
    avisos,
    detalhes: {
      modalidade,
      ano_referencia: ano,
      idade_inicio_periodo: idadeInicio,
      idade_31_12: idade31,
      cpf_informado: cpfInformado,
      cadunico_indicado: cadIndicado,
      matricula_no_prazo: matriculaNoPrazo,
    },
  }
}

/**
 * Atalho: retorna só boolean.
 * (Útil para filtros "Somente Pé-de-Meia elegíveis".)
 */
export function isElegivelPeDeMeia(input: PeDeMeiaInput, config?: PeDeMeiaConfig): boolean {
  return avaliarPeDeMeia(input, config).elegivel
}
