export type NivelEnsinoFiltro = 'todos' | 1 | 2
export type FluxoTipo = 'normal' | 'manual'

export type SalaAtendimento = {
  id_sala: number
  nome: string
  tipo_sala: string
  is_ativa: boolean
}

export type TipoProtocolo = {
  id_tipo_protocolo: number
  nome: string
}

export type StatusMatricula = {
  id_status_matricula: number
  nome: string
}

export type StatusDisciplinaAluno = {
  id_status_disciplina: number
  nome: string
}

export type FaixaProtocolosAno = {
  id_config: number
  id_ano_escolar: number
  ano_nome: string
  quantidade_protocolos: number
  inicio: number
  fim: number
}

export type SalaDisciplinaNivelOption = {
  id_disciplina: number
  id_nivel_ensino: number
  disciplina_nome: string
  total_protocolos: number
  ano_representativo_id: number
  ano_representativo_nome: string
  id_config_representativo: number
  faixas: FaixaProtocolosAno[]
  label: string
}

export type AlunoBuscaOption = {
  id_aluno: number
  nome: string
  email?: string | null
  foto_url?: string | null
  cpf?: string | null
  data_nascimento?: string | null
  id_matricula?: number | null
  numero_inscricao?: string | null
  id_nivel_ensino?: number | null
  nis?: string | null
  possui_necessidade_especial?: boolean | null
  possui_beneficio_governo?: boolean | null
}

export type ProgressoOption = {
  id_progresso: number
  id_disciplina: number
  id_ano_escolar: number
  id_nivel_ensino?: number | null
  disciplina_nome: string
  ano_nome: string
  status_nome?: string | null
  label: string
}

export type SessaoView = {
  id_sessao: number
  id_aluno: number
  id_professor: number
  id_progresso: number | null
  id_sala: number | null
  hora_entrada: string
  hora_saida: string | null
  resumo_atividades: string | null
  aluno_user_id?: string | null
  aluno_nome: string
  aluno_foto_url?: string | null
  aluno_cpf?: string | null
  aluno_data_nascimento?: string | null
  aluno_celular?: string | null
  aluno_logradouro?: string | null
  aluno_numero_endereco?: string | null
  aluno_bairro?: string | null
  aluno_municipio?: string | null
  aluno_ponto_referencia?: string | null
  numero_inscricao?: string | null
  mat_data_matricula?: string | null
  mat_ano_letivo?: number | null
  id_nivel_ensino?: number | null
  aluno_nis?: string | null
  aluno_possui_necessidade_especial?: boolean | null
  aluno_possui_beneficio_governo?: boolean | null
  sala_nome?: string | null
  sala_tipo?: string | null
  disciplina_nome?: string | null
  ano_nome?: string | null
  id_disciplina?: number | null
  id_ano_escolar?: number | null
}

export type FormAlunoSessao = {
  celular: string
  logradouro: string
  numero_endereco: string
  bairro: string
  municipio: string
  ponto_referencia: string
  foto_url: string
}

export type RegistroView = {
  id_atividade: number
  id_sessao: number
  id_progresso: number
  numero_protocolo: number
  id_tipo_protocolo: number
  status: string
  nota: number | null
  is_adaptada: boolean
  sintese: string | null
  created_at: string
  updated_at: string
  tipo_nome?: string
}

export type ProfessorDestinoOption = {
  id_professor: number
  nome: string
  foto_url?: string | null
}

export type TransferenciaContexto = {
  id_sala: number
  sala_nome: string
}

export type PeDeMeiaClassificacaoUI = 'ELEGIVEL' | 'NAO_ELEGIVEL' | 'CONFERIR'

export type PeDeMeiaChipUI = {
  label: string
  color: 'success' | 'warning' | 'error' | 'default'
  variant: 'filled' | 'outlined'
  tooltip?: string
}
