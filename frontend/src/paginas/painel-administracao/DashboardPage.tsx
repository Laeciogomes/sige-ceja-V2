import React from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { SupabaseClient } from '@supabase/supabase-js'

import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded'
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded'
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'
import DoorFrontRoundedIcon from '@mui/icons-material/DoorFrontRounded'
import Groups2RoundedIcon from '@mui/icons-material/Groups2Rounded'
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded'
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'

import { useAuth, type PapelUsuario } from '../../contextos/AuthContext'
import { useSupabase } from '../../contextos/SupabaseContext'
import MonitorOperacionalSection from './dashboard/MonitorOperacionalSection'
import {
  PAPEIS_COM_MONITOR_AO_VIVO,
  carregarMonitorOperacionalAoVivo,
  type MonitorOperacionalData,
} from './dashboard/monitorOperacional'

type StatCardProps = {
  titulo: string
  valor: string
  tendencia?: string
  cor: string
  icone: React.ReactNode
}

type QuickAction = {
  label: string
  path: string
}

type ActivityItem = {
  id: string
  user: string
  action: string
  time: string
  color: string
  path?: string
}

type DashboardData = {
  tituloPagina: string
  subtitulo: string
  stats: StatCardProps[]
  bannerTitulo: string
  bannerDescricao: string
  bannerBotaoLabel: string
  bannerBotaoPath: string | null
  acessoRapido: QuickAction[]
  mostrarBotaoPrincipal: boolean
  textoBotaoPrincipal: string
  botaoPrincipalPath: string | null
  atividadesRecentes: ActivityItem[]
  nomeExibicao: string
  monitorOperacional?: MonitorOperacionalData | null
}

type UsuarioDashboard = {
  id: string
  email: string | null
  papel?: PapelUsuario
}

const STATUS_MATRICULA_ATIVA = 1
const STATUS_MATRICULA_CONCLUIDA = 2
const STATUS_DISCIPLINA_A_CURSAR = 1
const STATUS_DISCIPLINA_EM_CURSO = 2
const STATUS_DISCIPLINA_APROVADO = 3
const STATUS_DISCIPLINA_APROVEITAMENTO = 5

const COR_AZUL = '#2196F3'
const COR_VERDE = '#4CAF50'
const COR_LARANJA = '#FF9800'
const COR_VERMELHA = '#F44336'

const asOne = <T,>(value: T | T[] | null | undefined): T | null => {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

const primeiroNome = (nome: string | null | undefined): string => {
  const texto = String(nome ?? '').trim()
  if (!texto) return 'Usuário'
  return texto.split(/\s+/)[0] ?? 'Usuário'
}

const formatarNumero = (valor: number): string =>
  new Intl.NumberFormat('pt-BR').format(valor)

const formatarMedia = (valor: number | null): string => {
  if (valor == null || Number.isNaN(valor)) return '—'
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
}

const formatarPercentual = (valor: number | null): string => {
  if (valor == null || Number.isNaN(valor)) return '0%'
  return `${Math.round(valor)}%`
}

const mediaNumerica = (valores: Array<number | null | undefined>): number | null => {
  const notas = valores
    .map(valor => (valor == null ? null : Number(valor)))
    .filter((valor): valor is number => valor != null && Number.isFinite(valor))

  if (!notas.length) return null
  const soma = notas.reduce((acc, valor) => acc + valor, 0)
  return soma / notas.length
}

const formatarMomento = (valor: string | null | undefined): string => {
  if (!valor) return 'Sem data'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return 'Sem data'

  const agora = new Date()
  const mesmoDia =
    data.getDate() === agora.getDate() &&
    data.getMonth() === agora.getMonth() &&
    data.getFullYear() === agora.getFullYear()

  if (mesmoDia) {
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

const contar = async (
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> => {
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

const carregarNomeUsuario = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<string> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('name')
    .eq('id', userId)
    .maybeSingle<{ name: string | null }>()

  if (error) throw error
  return data?.name?.trim() || 'Usuário'
}

const carregarProfessorId = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<number | null> => {
  const { data, error } = await supabase
    .from('professores')
    .select('id_professor')
    .eq('user_id', userId)
    .maybeSingle<{ id_professor: number | null }>()

  if (error) throw error
  return data?.id_professor ?? null
}

const carregarAlunoId = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<number | null> => {
  const { data, error } = await supabase
    .from('alunos')
    .select('id_aluno')
    .eq('user_id', userId)
    .maybeSingle<{ id_aluno: number | null }>()

  if (error) throw error
  return data?.id_aluno ?? null
}

const carregarAtividadesMatriculas = async (
  supabase: SupabaseClient,
  path: string,
): Promise<ActivityItem[]> => {
  const { data, error } = await supabase
    .from('matriculas')
    .select(
      `
      id_matricula,
      numero_inscricao,
      data_matricula,
      alunos!inner(
        id_aluno,
        usuarios!inner(name)
      )
    `,
    )
    .order('data_matricula', { ascending: false })
    .limit(5)

  if (error) throw error

  return ((data ?? []) as any[]).map(row => {
    const aluno = asOne<any>(row.alunos)
    const usuario = asOne<any>(aluno?.usuarios)
    const nomeAluno = String(usuario?.name ?? `Aluno #${row.id_matricula}`)
    const ra = row?.numero_inscricao ? ` • RA ${String(row.numero_inscricao)}` : ''

    return {
      id: `matricula-${String(row.id_matricula)}`,
      user: 'Matrícula',
      action: `${nomeAluno}${ra}`,
      time: formatarMomento(row?.data_matricula ? `${String(row.data_matricula)}T00:00:00` : null),
      color: COR_AZUL,
      path,
    }
  })
}

const carregarAtividadesProfessor = async (
  supabase: SupabaseClient,
  professorId: number,
): Promise<ActivityItem[]> => {
  const { data, error } = await supabase
    .from('sessoes_atendimento')
    .select(
      `
      id_sessao,
      hora_entrada,
      hora_saida,
      alunos!inner(
        id_aluno,
        usuarios!inner(name)
      ),
      progresso_aluno(
        id_progresso,
        disciplinas(nome_disciplina)
      )
    `,
    )
    .eq('id_professor', professorId)
    .order('hora_entrada', { ascending: false })
    .limit(5)

  if (error) throw error

  return ((data ?? []) as any[]).map(row => {
    const aluno = asOne<any>(row.alunos)
    const usuario = asOne<any>(aluno?.usuarios)
    const progresso = asOne<any>(row.progresso_aluno)
    const disciplina = asOne<any>(progresso?.disciplinas)
    const nomeAluno = String(usuario?.name ?? `Aluno #${row.id_sessao}`)
    const textoSessao = row?.hora_saida ? 'Sessão finalizada' : 'Sessão em andamento'

    return {
      id: `sessao-prof-${String(row.id_sessao)}`,
      user: nomeAluno,
      action: disciplina?.nome_disciplina
        ? `${textoSessao} • ${String(disciplina.nome_disciplina)}`
        : textoSessao,
      time: formatarMomento(row?.hora_entrada ? String(row.hora_entrada) : null),
      color: row?.hora_saida ? COR_VERDE : COR_LARANJA,
      path: '/professores/atendimentos',
    }
  })
}

const carregarAtividadesAcompanhamento = async (
  supabase: SupabaseClient,
  path: string,
): Promise<ActivityItem[]> => {
  const { data, error } = await supabase
    .from('acompanhamento_aluno')
    .select(
      `
      id_acompanhamento,
      tipo,
      status,
      data_evento,
      alunos!inner(
        id_aluno,
        usuarios!inner(name)
      )
    `,
    )
    .order('data_evento', { ascending: false })
    .limit(5)

  if (error) throw error

  return ((data ?? []) as any[]).map(row => {
    const aluno = asOne<any>(row.alunos)
    const usuario = asOne<any>(aluno?.usuarios)
    const nomeAluno = String(usuario?.name ?? `Aluno #${row.id_acompanhamento}`)
    const tipo = row?.tipo ? String(row.tipo) : 'Registro'
    const status = row?.status ? String(row.status) : 'Sem status'

    return {
      id: `acomp-${String(row.id_acompanhamento)}`,
      user: nomeAluno,
      action: `${tipo} • ${status}`,
      time: formatarMomento(row?.data_evento ? String(row.data_evento) : null),
      color: status === 'Retornou' ? COR_VERDE : COR_VERMELHA,
      path,
    }
  })
}

const carregarAtividadesAluno = async (
  supabase: SupabaseClient,
  alunoId: number,
): Promise<ActivityItem[]> => {
  const { data, error } = await supabase
    .from('sessoes_atendimento')
    .select(
      `
      id_sessao,
      hora_entrada,
      hora_saida,
      professores(
        id_professor,
        usuarios(name)
      ),
      progresso_aluno(
        id_progresso,
        disciplinas(nome_disciplina)
      )
    `,
    )
    .eq('id_aluno', alunoId)
    .order('hora_entrada', { ascending: false })
    .limit(5)

  if (error) throw error

  return ((data ?? []) as any[]).map(row => {
    const professor = asOne<any>(row.professores)
    const usuarioProfessor = asOne<any>(professor?.usuarios)
    const progresso = asOne<any>(row.progresso_aluno)
    const disciplina = asOne<any>(progresso?.disciplinas)
    const professorNome = String(usuarioProfessor?.name ?? 'Professor')
    const textoSessao = row?.hora_saida ? 'Atendimento registrado' : 'Atendimento em aberto'

    return {
      id: `sessao-aluno-${String(row.id_sessao)}`,
      user: professorNome,
      action: disciplina?.nome_disciplina
        ? `${textoSessao} • ${String(disciplina.nome_disciplina)}`
        : textoSessao,
      time: formatarMomento(row?.hora_entrada ? String(row.hora_entrada) : null),
      color: row?.hora_saida ? COR_VERDE : COR_LARANJA,
      path: '/alunos/progresso',
    }
  })
}

const criarDashboardPadrao = (papel?: PapelUsuario): DashboardData => {
  const papelAtual = papel ?? 'AVALIADOR'

  switch (papelAtual) {
    case 'ADMIN':
      return {
        tituloPagina: 'Dashboard Administração',
        subtitulo:
          'Visão consolidada do sistema com indicadores gerais de cadastros, matrículas e atendimentos.',
        stats: [
          {
            titulo: 'Alunos cadastrados',
            valor: '—',
            cor: COR_AZUL,
            icone: <PeopleAltRoundedIcon />,
          },
          {
            titulo: 'Matrículas ativas',
            valor: '—',
            cor: COR_VERDE,
            icone: <SchoolRoundedIcon />,
          },
          {
            titulo: 'Professores',
            valor: '—',
            cor: COR_LARANJA,
            icone: <AssignmentIndRoundedIcon />,
          },
          {
            titulo: 'Atendimentos',
            valor: '—',
            cor: COR_VERMELHA,
            icone: <MeetingRoomIcon />,
          },
        ],
        bannerTitulo: 'Carregando indicadores da administração',
        bannerDescricao:
          'Assim que a consulta no banco terminar, os números gerais do SIGE-CEJA serão exibidos aqui.',
        bannerBotaoLabel: 'Abrir administração',
        bannerBotaoPath: '/admin',
        acessoRapido: [
          { label: 'Usuários', path: '/secretaria/usuarios' },
          { label: 'Matrículas', path: '/secretaria/matriculas' },
          { label: 'Turmas', path: '/secretaria/turmas' },
          { label: 'Salas', path: '/secretaria/salas' },
          { label: 'SASP', path: '/coordenacao/sasp' },
          { label: 'Acompanhamento', path: '/coordenacao/acompanhamento' },
        ],
        mostrarBotaoPrincipal: true,
        textoBotaoPrincipal: 'Abrir matrículas',
        botaoPrincipalPath: '/secretaria/matriculas',
        atividadesRecentes: [],
        nomeExibicao: 'Usuário',
      }

    case 'SECRETARIA':
      return {
        tituloPagina: 'Dashboard Secretaria',
        subtitulo:
          'Indicadores operacionais da secretaria escolar, centralizados diretamente no banco de dados.',
        stats: [
          {
            titulo: 'Matrículas ativas',
            valor: '—',
            cor: COR_VERDE,
            icone: <SchoolRoundedIcon />,
          },
          {
            titulo: 'Alunos cadastrados',
            valor: '—',
            cor: COR_AZUL,
            icone: <PeopleAltRoundedIcon />,
          },
          {
            titulo: 'Turmas ativas',
            valor: '—',
            cor: COR_LARANJA,
            icone: <Groups2RoundedIcon />,
          },
          {
            titulo: 'Salas ativas',
            valor: '—',
            cor: COR_VERMELHA,
            icone: <DoorFrontRoundedIcon />,
          },
        ],
        bannerTitulo: 'Carregando rotina da secretaria',
        bannerDescricao:
          'Os totais de matrículas, turmas, salas e cadastros serão lidos do banco assim que a consulta terminar.',
        bannerBotaoLabel: 'Ir para matrículas',
        bannerBotaoPath: '/secretaria/matriculas',
        acessoRapido: [
          { label: 'Matrículas', path: '/secretaria/matriculas' },
          { label: 'Usuários', path: '/secretaria/usuarios' },
          { label: 'Turmas', path: '/secretaria/turmas' },
          { label: 'Salas', path: '/secretaria/salas' },
          { label: 'Disciplinas', path: '/secretaria/disciplinas' },
          { label: 'Protocolos', path: '/secretaria/protocolos' },
        ],
        mostrarBotaoPrincipal: true,
        textoBotaoPrincipal: 'Nova matrícula',
        botaoPrincipalPath: '/secretaria/matriculas',
        atividadesRecentes: [],
        nomeExibicao: 'Usuário',
      }

    case 'PROFESSOR':
      return {
        tituloPagina: 'Dashboard Professor',
        subtitulo:
          'Resumo pedagógico com atendimentos, atividades pendentes e médias lançadas pelo próprio professor.',
        stats: [
          {
            titulo: 'Atendimentos realizados',
            valor: '—',
            cor: COR_AZUL,
            icone: <MeetingRoomIcon />,
          },
          {
            titulo: 'Sessões em aberto',
            valor: '—',
            cor: COR_LARANJA,
            icone: <CalendarTodayIcon />,
          },
          {
            titulo: 'Atividades pendentes',
            valor: '—',
            cor: COR_VERMELHA,
            icone: <AssignmentTurnedInRoundedIcon />,
          },
          {
            titulo: 'Média das notas',
            valor: '—',
            cor: COR_VERDE,
            icone: <InsightsRoundedIcon />,
          },
        ],
        bannerTitulo: 'Carregando dados pedagógicos',
        bannerDescricao:
          'Os indicadores do seu trabalho docente serão montados a partir das sessões e dos registros de atendimento.',
        bannerBotaoLabel: 'Abrir atendimentos',
        bannerBotaoPath: '/professores/atendimentos',
        acessoRapido: [
          { label: 'Meus atendimentos', path: '/professores/atendimentos' },
          { label: 'Acompanhamento', path: '/professores/acompanhamento' },
          { label: 'Minha ficha', path: '/professores/atendimentos' },
          { label: 'Registrar atendimento', path: '/professores/atendimentos' },
          { label: 'Consultar aluno', path: '/professores/atendimentos' },
          { label: 'Pendências', path: '/professores/acompanhamento' },
        ],
        mostrarBotaoPrincipal: true,
        textoBotaoPrincipal: 'Novo atendimento',
        botaoPrincipalPath: '/professores/atendimentos',
        atividadesRecentes: [],
        nomeExibicao: 'Usuário',
      }

    case 'COORDENACAO':
      return {
        tituloPagina: 'Dashboard Coordenação',
        subtitulo:
          'Painel consolidado com SASP, acompanhamento pedagógico e andamento dos protocolos.',
        stats: [
          {
            titulo: 'SASP preenchidos',
            valor: '—',
            cor: COR_AZUL,
            icone: <DescriptionRoundedIcon />,
          },
          {
            titulo: 'Atendimentos',
            valor: '—',
            cor: COR_VERDE,
            icone: <MeetingRoomIcon />,
          },
          {
            titulo: 'Acompanhamentos abertos',
            valor: '—',
            cor: COR_VERMELHA,
            icone: <AssignmentTurnedInRoundedIcon />,
          },
          {
            titulo: 'Protocolos concluídos',
            valor: '—',
            cor: COR_LARANJA,
            icone: <InsightsRoundedIcon />,
          },
        ],
        bannerTitulo: 'Carregando visão da coordenação',
        bannerDescricao:
          'Os dados do SASP, dos acompanhamentos e dos protocolos serão consolidados automaticamente.',
        bannerBotaoLabel: 'Abrir SASP',
        bannerBotaoPath: '/coordenacao/sasp',
        acessoRapido: [
          { label: 'SASP', path: '/coordenacao/sasp' },
          { label: 'Acompanhamento', path: '/coordenacao/acompanhamento' },
          { label: 'Matrículas', path: '/secretaria/matriculas' },
          { label: 'Turmas', path: '/secretaria/turmas' },
          { label: 'Relatórios', path: '/secretaria/relatorios-fichas' },
          { label: 'Protocolos', path: '/secretaria/protocolos' },
        ],
        mostrarBotaoPrincipal: true,
        textoBotaoPrincipal: 'Abrir SASP',
        botaoPrincipalPath: '/coordenacao/sasp',
        atividadesRecentes: [],
        nomeExibicao: 'Usuário',
      }

    case 'DIRETOR':
      return {
        tituloPagina: 'Dashboard Direção',
        subtitulo:
          'Painel estratégico da unidade com foco em matrículas, turmas, atendimentos e taxa de conclusão.',
        stats: [
          {
            titulo: 'Matrículas ativas',
            valor: '—',
            cor: COR_AZUL,
            icone: <SchoolRoundedIcon />,
          },
          {
            titulo: 'Turmas ativas',
            valor: '—',
            cor: COR_VERDE,
            icone: <Groups2RoundedIcon />,
          },
          {
            titulo: 'Atendimentos',
            valor: '—',
            cor: COR_LARANJA,
            icone: <MeetingRoomIcon />,
          },
          {
            titulo: 'Conclusão de matrículas',
            valor: '—',
            cor: COR_VERMELHA,
            icone: <InsightsRoundedIcon />,
          },
        ],
        bannerTitulo: 'Carregando panorama institucional',
        bannerDescricao:
          'Os principais indicadores da unidade serão montados diretamente do banco de dados.',
        bannerBotaoLabel: 'Abrir direção',
        bannerBotaoPath: '/direcao',
        acessoRapido: [
          { label: 'Acompanhamento', path: '/direcao/acompanhamento' },
          { label: 'SASP', path: '/direcao/sasp' },
          { label: 'Matrículas', path: '/secretaria/matriculas' },
          { label: 'Turmas', path: '/secretaria/turmas' },
          { label: 'Relatórios', path: '/secretaria/relatorios-fichas' },
          { label: 'Usuários', path: '/secretaria/usuarios' },
        ],
        mostrarBotaoPrincipal: true,
        textoBotaoPrincipal: 'Ver relatórios',
        botaoPrincipalPath: '/secretaria/relatorios-fichas',
        atividadesRecentes: [],
        nomeExibicao: 'Usuário',
      }

    case 'ALUNO':
      return {
        tituloPagina: 'Minha área',
        subtitulo:
          'Resumo individual com matrículas, disciplinas, atividades pendentes e média geral.',
        stats: [
          {
            titulo: 'Matrículas ativas',
            valor: '—',
            cor: COR_AZUL,
            icone: <SchoolRoundedIcon />,
          },
          {
            titulo: 'Disciplinas em andamento',
            valor: '—',
            cor: COR_LARANJA,
            icone: <MenuBookRoundedIcon />,
          },
          {
            titulo: 'Atividades pendentes',
            valor: '—',
            cor: COR_VERMELHA,
            icone: <AssignmentTurnedInRoundedIcon />,
          },
          {
            titulo: 'Média geral',
            valor: '—',
            cor: COR_VERDE,
            icone: <InsightsRoundedIcon />,
          },
        ],
        bannerTitulo: 'Carregando sua vida escolar',
        bannerDescricao:
          'Seu progresso individual será lido do banco para exibir matrículas, disciplinas e atendimentos.',
        bannerBotaoLabel: 'Ver meu progresso',
        bannerBotaoPath: '/alunos/progresso',
        acessoRapido: [
          { label: 'Minhas matrículas', path: '/alunos/matriculas' },
          { label: 'Meu progresso', path: '/alunos/progresso' },
          { label: 'Meus dados', path: '/perfil' },
          { label: 'Configurações', path: '/config' },
          { label: 'Ajuda', path: '/alunos' },
          { label: 'Suporte', path: '/alunos' },
        ],
        mostrarBotaoPrincipal: false,
        textoBotaoPrincipal: 'Ver meu progresso',
        botaoPrincipalPath: '/alunos/progresso',
        atividadesRecentes: [],
        nomeExibicao: 'Usuário',
      }

    case 'AVALIADOR':
    default:
      return {
        tituloPagina: 'Dashboard',
        subtitulo:
          'O sistema está aguardando a identificação do seu perfil para carregar a visão correta.',
        stats: [
          {
            titulo: 'Indicadores',
            valor: '—',
            cor: COR_AZUL,
            icone: <PeopleAltRoundedIcon />,
          },
          {
            titulo: 'Registros',
            valor: '—',
            cor: COR_LARANJA,
            icone: <AssignmentTurnedInRoundedIcon />,
          },
          {
            titulo: 'Métricas',
            valor: '—',
            cor: COR_VERDE,
            icone: <InsightsRoundedIcon />,
          },
          {
            titulo: 'Alertas',
            valor: '—',
            cor: COR_VERMELHA,
            icone: <CalendarTodayIcon />,
          },
        ],
        bannerTitulo: 'Bem-vindo ao SIGE-CEJA',
        bannerDescricao:
          'Assim que o seu perfil estiver identificado, a dashboard será ajustada automaticamente.',
        bannerBotaoLabel: 'Atualizar',
        bannerBotaoPath: null,
        acessoRapido: [
          { label: 'Perfil', path: '/perfil' },
          { label: 'Configurações', path: '/config' },
          { label: 'Ajuda', path: '/' },
          { label: 'Suporte', path: '/' },
          { label: 'Documentação', path: '/' },
          { label: 'Sistema', path: '/' },
        ],
        mostrarBotaoPrincipal: false,
        textoBotaoPrincipal: 'Atualizar',
        botaoPrincipalPath: null,
        atividadesRecentes: [],
        nomeExibicao: 'Usuário',
      }
  }
}

const carregarDashboardAdmin = async (
  supabase: SupabaseClient,
  usuario: UsuarioDashboard,
): Promise<DashboardData> => {
  const base = criarDashboardPadrao('ADMIN')

  const [
    nome,
    totalAlunos,
    matriculasAtivas,
    totalProfessores,
    totalTurmas,
    totalSalas,
    atividadesRecentes,
    monitorOperacional,
  ] = await Promise.all([
    carregarNomeUsuario(supabase, usuario.id),
    contar(
      supabase
        .from('alunos')
        .select('id_aluno', { count: 'exact', head: true }),
    ),
    contar(
      supabase
        .from('matriculas')
        .select('id_matricula', { count: 'exact', head: true })
        .eq('id_status_matricula', STATUS_MATRICULA_ATIVA),
    ),
    contar(
      supabase
        .from('professores')
        .select('id_professor', { count: 'exact', head: true }),
    ),
    contar(
      supabase
        .from('turmas')
        .select('id_turma', { count: 'exact', head: true })
        .eq('is_ativa', true),
    ),
    contar(
      supabase
        .from('salas_atendimento')
        .select('id_sala', { count: 'exact', head: true })
        .eq('is_ativa', true),
    ),
    carregarAtividadesMatriculas(supabase, '/secretaria/matriculas'),
    carregarMonitorOperacionalAoVivo(supabase),
  ])

  return {
    ...base,
    nomeExibicao: nome,
    monitorOperacional,
    stats: [
      {
        titulo: 'Alunos cadastrados',
        valor: formatarNumero(totalAlunos),
        cor: COR_AZUL,
        icone: <PeopleAltRoundedIcon />,
      },
      {
        titulo: 'Matrículas ativas',
        valor: formatarNumero(matriculasAtivas),
        cor: COR_VERDE,
        icone: <SchoolRoundedIcon />,
      },
      {
        titulo: 'Abertos agora',
        valor: formatarNumero(monitorOperacional.totalAbertos),
        cor: COR_LARANJA,
        icone: <MeetingRoomIcon />,
      },
      {
        titulo: 'Professores em atendimento',
        valor: formatarNumero(monitorOperacional.professoresAtivos),
        cor: COR_VERMELHA,
        icone: <AssignmentIndRoundedIcon />,
      },
    ],
    bannerTitulo: 'Visão consolidada do SIGE-CEJA',
    bannerDescricao: `${formatarNumero(totalAlunos)} alunos cadastrados, ${formatarNumero(matriculasAtivas)} matrículas ativas, ${formatarNumero(totalProfessores)} professores, ${formatarNumero(totalTurmas)} turmas ativas, ${formatarNumero(totalSalas)} salas em funcionamento e ${formatarNumero(monitorOperacional.totalAbertos)} atendimentos abertos agora.`,
    atividadesRecentes,
  }
}

const carregarDashboardSecretaria = async (
  supabase: SupabaseClient,
  usuario: UsuarioDashboard,
): Promise<DashboardData> => {
  const base = criarDashboardPadrao('SECRETARIA')

  const [
    nome,
    matriculasAtivas,
    totalAlunos,
    totalTurmas,
    totalSalas,
    totalUsuarios,
    atividadesRecentes,
    monitorOperacional,
  ] = await Promise.all([
    carregarNomeUsuario(supabase, usuario.id),
    contar(
      supabase
        .from('matriculas')
        .select('id_matricula', { count: 'exact', head: true })
        .eq('id_status_matricula', STATUS_MATRICULA_ATIVA),
    ),
    contar(
      supabase
        .from('alunos')
        .select('id_aluno', { count: 'exact', head: true }),
    ),
    contar(
      supabase
        .from('turmas')
        .select('id_turma', { count: 'exact', head: true })
        .eq('is_ativa', true),
    ),
    contar(
      supabase
        .from('salas_atendimento')
        .select('id_sala', { count: 'exact', head: true })
        .eq('is_ativa', true),
    ),
    contar(
      supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true }),
    ),
    carregarAtividadesMatriculas(supabase, '/secretaria/matriculas'),
    carregarMonitorOperacionalAoVivo(supabase),
  ])

  return {
    ...base,
    nomeExibicao: nome,
    monitorOperacional,
    stats: [
      {
        titulo: 'Matrículas ativas',
        valor: formatarNumero(matriculasAtivas),
        cor: COR_VERDE,
        icone: <SchoolRoundedIcon />,
      },
      {
        titulo: 'Abertos agora',
        valor: formatarNumero(monitorOperacional.totalAbertos),
        cor: COR_LARANJA,
        icone: <MeetingRoomIcon />,
      },
      {
        titulo: 'Salas ocupadas',
        valor: formatarNumero(monitorOperacional.salasOcupadas),
        cor: COR_VERMELHA,
        icone: <DoorFrontRoundedIcon />,
      },
      {
        titulo: 'Professores em atendimento',
        valor: formatarNumero(monitorOperacional.professoresAtivos),
        cor: COR_AZUL,
        icone: <AssignmentIndRoundedIcon />,
      },
    ],
    bannerTitulo: 'Rotina operacional da secretaria',
    bannerDescricao: `${formatarNumero(totalUsuarios)} usuários cadastrados, ${formatarNumero(totalAlunos)} alunos, ${formatarNumero(matriculasAtivas)} matrículas ativas, ${formatarNumero(totalTurmas)} turmas em andamento, ${formatarNumero(totalSalas)} salas cadastradas e ${formatarNumero(monitorOperacional.totalAbertos)} atendimentos abertos neste momento.`,
    atividadesRecentes,
  }
}

const carregarDashboardProfessor = async (
  supabase: SupabaseClient,
  usuario: UsuarioDashboard,
): Promise<DashboardData> => {
  const base = criarDashboardPadrao('PROFESSOR')
  const [nome, professorId] = await Promise.all([
    carregarNomeUsuario(supabase, usuario.id),
    carregarProfessorId(supabase, usuario.id),
  ])

  if (!professorId) {
    return {
      ...base,
      nomeExibicao: nome,
      bannerTitulo: 'Professor ainda não vinculado',
      bannerDescricao:
        'Não encontramos um vínculo em public.professores para este usuário. Depois que o vínculo for criado, os indicadores serão exibidos aqui.',
    }
  }

  const [totalAtendimentos, sessoesAbertas, atividadesPendentes, notasRows, sessoesRows, atividadesRecentes] =
    await Promise.all([
      contar(
        supabase
          .from('sessoes_atendimento')
          .select('id_sessao', { count: 'exact', head: true })
          .eq('id_professor', professorId),
      ),
      contar(
        supabase
          .from('sessoes_atendimento')
          .select('id_sessao', { count: 'exact', head: true })
          .eq('id_professor', professorId)
          .is('hora_saida', null),
      ),
      contar(
        supabase
          .from('registros_atendimento')
          .select(
            'id_atividade, sessoes_atendimento!inner(id_professor)',
            { count: 'exact', head: true },
          )
          .eq('sessoes_atendimento.id_professor', professorId)
          .neq('status', 'Concluída'),
      ),
      supabase
        .from('registros_atendimento')
        .select('nota, sessoes_atendimento!inner(id_professor)')
        .eq('sessoes_atendimento.id_professor', professorId)
        .not('nota', 'is', null),
      supabase
        .from('sessoes_atendimento')
        .select('id_aluno')
        .eq('id_professor', professorId),
      carregarAtividadesProfessor(supabase, professorId),
    ])

  if (notasRows.error) throw notasRows.error
  if (sessoesRows.error) throw sessoesRows.error

  const mediaNotas = mediaNumerica(
    ((notasRows.data ?? []) as Array<{ nota: number | null }>).map(row => row.nota),
  )
  const alunosAtendidos = new Set(
    ((sessoesRows.data ?? []) as Array<{ id_aluno: number | null }>).map(row => row.id_aluno).filter((id): id is number => typeof id === 'number'),
  ).size

  return {
    ...base,
    nomeExibicao: nome,
    stats: [
      {
        titulo: 'Atendimentos realizados',
        valor: formatarNumero(totalAtendimentos),
        cor: COR_AZUL,
        icone: <MeetingRoomIcon />,
      },
      {
        titulo: 'Sessões em aberto',
        valor: formatarNumero(sessoesAbertas),
        cor: COR_LARANJA,
        icone: <CalendarTodayIcon />,
      },
      {
        titulo: 'Atividades pendentes',
        valor: formatarNumero(atividadesPendentes),
        cor: COR_VERMELHA,
        icone: <AssignmentTurnedInRoundedIcon />,
      },
      {
        titulo: 'Média das notas',
        valor: formatarMedia(mediaNotas),
        cor: COR_VERDE,
        icone: <InsightsRoundedIcon />,
      },
    ],
    bannerTitulo: 'Resumo do seu trabalho docente',
    bannerDescricao: `${formatarNumero(totalAtendimentos)} atendimentos registrados para ${formatarNumero(alunosAtendidos)} alunos, com ${formatarNumero(atividadesPendentes)} atividades pendentes neste momento.`,
    atividadesRecentes,
  }
}

const carregarDashboardCoordenacao = async (
  supabase: SupabaseClient,
  usuario: UsuarioDashboard,
): Promise<DashboardData> => {
  const base = criarDashboardPadrao('COORDENACAO')

  const [
    nome,
    totalSasp,
    acompanhamentosAbertos,
    totalProtocolos,
    protocolosConcluidos,
    atividadesRecentes,
    monitorOperacional,
  ] = await Promise.all([
    carregarNomeUsuario(supabase, usuario.id),
    contar(
      supabase
        .from('formulario_sasp')
        .select('id_sasp', { count: 'exact', head: true }),
    ),
    contar(
      supabase
        .from('acompanhamento_aluno')
        .select('id_acompanhamento', { count: 'exact', head: true })
        .neq('status', 'Retornou'),
    ),
    contar(
      supabase
        .from('registros_atendimento')
        .select('id_atividade', { count: 'exact', head: true }),
    ),
    contar(
      supabase
        .from('registros_atendimento')
        .select('id_atividade', { count: 'exact', head: true })
        .eq('status', 'Concluída'),
    ),
    carregarAtividadesAcompanhamento(supabase, '/coordenacao/acompanhamento'),
    carregarMonitorOperacionalAoVivo(supabase),
  ])

  const taxaProtocolos = totalProtocolos
    ? (protocolosConcluidos / totalProtocolos) * 100
    : 0

  return {
    ...base,
    nomeExibicao: nome,
    monitorOperacional,
    stats: [
      {
        titulo: 'SASP preenchidos',
        valor: formatarNumero(totalSasp),
        cor: COR_AZUL,
        icone: <DescriptionRoundedIcon />,
      },
      {
        titulo: 'Abertos agora',
        valor: formatarNumero(monitorOperacional.totalAbertos),
        cor: COR_VERDE,
        icone: <MeetingRoomIcon />,
      },
      {
        titulo: 'Acompanhamentos abertos',
        valor: formatarNumero(acompanhamentosAbertos),
        cor: COR_VERMELHA,
        icone: <AssignmentTurnedInRoundedIcon />,
      },
      {
        titulo: 'Professores em atendimento',
        valor: formatarNumero(monitorOperacional.professoresAtivos),
        cor: COR_LARANJA,
        icone: <AssignmentIndRoundedIcon />,
      },
    ],
    bannerTitulo: 'Visão pedagógica consolidada',
    bannerDescricao: `${formatarNumero(totalSasp)} formulários SASP preenchidos, ${formatarNumero(acompanhamentosAbertos)} acompanhamentos em aberto, ${formatarNumero(monitorOperacional.totalAbertos)} atendimentos acontecendo agora e taxa de ${formatarPercentual(taxaProtocolos)} de protocolos concluídos.`,
    atividadesRecentes,
  }
}

const carregarDashboardDirecao = async (
  supabase: SupabaseClient,
  usuario: UsuarioDashboard,
): Promise<DashboardData> => {
  const base = criarDashboardPadrao('DIRETOR')

  const [
    nome,
    matriculasAtivas,
    turmasAtivas,
    totalMatriculas,
    matriculasConcluidas,
    totalSasp,
    acompanhamentosAbertos,
    atividadesRecentes,
    monitorOperacional,
  ] = await Promise.all([
    carregarNomeUsuario(supabase, usuario.id),
    contar(
      supabase
        .from('matriculas')
        .select('id_matricula', { count: 'exact', head: true })
        .eq('id_status_matricula', STATUS_MATRICULA_ATIVA),
    ),
    contar(
      supabase
        .from('turmas')
        .select('id_turma', { count: 'exact', head: true })
        .eq('is_ativa', true),
    ),
    contar(
      supabase
        .from('matriculas')
        .select('id_matricula', { count: 'exact', head: true }),
    ),
    contar(
      supabase
        .from('matriculas')
        .select('id_matricula', { count: 'exact', head: true })
        .eq('id_status_matricula', STATUS_MATRICULA_CONCLUIDA),
    ),
    contar(
      supabase
        .from('formulario_sasp')
        .select('id_sasp', { count: 'exact', head: true }),
    ),
    contar(
      supabase
        .from('acompanhamento_aluno')
        .select('id_acompanhamento', { count: 'exact', head: true })
        .neq('status', 'Retornou'),
    ),
    carregarAtividadesMatriculas(supabase, '/secretaria/matriculas'),
    carregarMonitorOperacionalAoVivo(supabase),
  ])

  const taxaConclusao = totalMatriculas
    ? (matriculasConcluidas / totalMatriculas) * 100
    : 0

  return {
    ...base,
    nomeExibicao: nome,
    monitorOperacional,
    stats: [
      {
        titulo: 'Matrículas ativas',
        valor: formatarNumero(matriculasAtivas),
        cor: COR_AZUL,
        icone: <SchoolRoundedIcon />,
      },
      {
        titulo: 'Abertos agora',
        valor: formatarNumero(monitorOperacional.totalAbertos),
        cor: COR_LARANJA,
        icone: <MeetingRoomIcon />,
      },
      {
        titulo: 'Salas ocupadas',
        valor: formatarNumero(monitorOperacional.salasOcupadas),
        cor: COR_VERDE,
        icone: <DoorFrontRoundedIcon />,
      },
      {
        titulo: 'Conclusão de matrículas',
        valor: formatarPercentual(taxaConclusao),
        cor: COR_VERMELHA,
        icone: <InsightsRoundedIcon />,
      },
    ],
    bannerTitulo: 'Panorama institucional da unidade',
    bannerDescricao: `${formatarNumero(turmasAtivas)} turmas ativas, ${formatarNumero(totalSasp)} SASP preenchidos, ${formatarNumero(acompanhamentosAbertos)} acompanhamentos em aberto e ${formatarNumero(monitorOperacional.totalAbertos)} atendimentos em execução agora, distribuídos em ${formatarNumero(monitorOperacional.salasOcupadas)} sala(s).`,
    atividadesRecentes,
  }
}

const carregarDashboardAluno = async (
  supabase: SupabaseClient,
  usuario: UsuarioDashboard,
): Promise<DashboardData> => {
  const base = criarDashboardPadrao('ALUNO')
  const [nome, alunoId] = await Promise.all([
    carregarNomeUsuario(supabase, usuario.id),
    carregarAlunoId(supabase, usuario.id),
  ])

  if (!alunoId) {
    return {
      ...base,
      nomeExibicao: nome,
      bannerTitulo: 'Aluno ainda não vinculado',
      bannerDescricao:
        'Não encontramos um vínculo em public.alunos para este usuário. Depois que o vínculo existir, as informações acadêmicas aparecerão aqui.',
    }
  }

  const matriculasQuery = await supabase
    .from('matriculas')
    .select('id_matricula, id_status_matricula')
    .eq('id_aluno', alunoId)

  if (matriculasQuery.error) throw matriculasQuery.error

  const matriculas = (matriculasQuery.data ?? []) as Array<{
    id_matricula: number | null
    id_status_matricula: number | null
  }>

  const idsMatriculas = matriculas
    .map(row => row.id_matricula)
    .filter((id): id is number => typeof id === 'number')

  const matriculasAtivas = matriculas.filter(
    row => row.id_status_matricula === STATUS_MATRICULA_ATIVA,
  ).length

  let disciplinasEmAndamento = 0
  let atividadesPendentes = 0
  let mediaGeral: number | null = null
  let disciplinasConcluidas = 0

  if (idsMatriculas.length) {
    const progressoQuery = await supabase
      .from('progresso_aluno')
      .select('id_progresso, id_status_disciplina, nota_final')
      .in('id_matricula', idsMatriculas)

    if (progressoQuery.error) throw progressoQuery.error

    const progressos = (progressoQuery.data ?? []) as Array<{
      id_progresso: number | null
      id_status_disciplina: number | null
      nota_final: number | null
    }>

    const idsProgressos = progressos
      .map(row => row.id_progresso)
      .filter((id): id is number => typeof id === 'number')

    disciplinasEmAndamento = progressos.filter(
      row =>
        row.id_status_disciplina === STATUS_DISCIPLINA_A_CURSAR ||
        row.id_status_disciplina === STATUS_DISCIPLINA_EM_CURSO,
    ).length

    disciplinasConcluidas = progressos.filter(
      row =>
        row.id_status_disciplina === STATUS_DISCIPLINA_APROVADO ||
        row.id_status_disciplina === STATUS_DISCIPLINA_APROVEITAMENTO,
    ).length

    mediaGeral = mediaNumerica(progressos.map(row => row.nota_final))

    if (idsProgressos.length) {
      const pendentesQuery = await supabase
        .from('registros_atendimento')
        .select('id_atividade', { count: 'exact', head: true })
        .in('id_progresso', idsProgressos)
        .neq('status', 'Concluída')

      if (pendentesQuery.error) throw pendentesQuery.error
      atividadesPendentes = pendentesQuery.count ?? 0
    }
  }

  const [totalAtendimentos, atividadesRecentes] = await Promise.all([
    contar(
      supabase
        .from('sessoes_atendimento')
        .select('id_sessao', { count: 'exact', head: true })
        .eq('id_aluno', alunoId),
    ),
    carregarAtividadesAluno(supabase, alunoId),
  ])

  return {
    ...base,
    nomeExibicao: nome,
    stats: [
      {
        titulo: 'Matrículas ativas',
        valor: formatarNumero(matriculasAtivas),
        cor: COR_AZUL,
        icone: <SchoolRoundedIcon />,
      },
      {
        titulo: 'Disciplinas em andamento',
        valor: formatarNumero(disciplinasEmAndamento),
        cor: COR_LARANJA,
        icone: <MenuBookRoundedIcon />,
      },
      {
        titulo: 'Atividades pendentes',
        valor: formatarNumero(atividadesPendentes),
        cor: COR_VERMELHA,
        icone: <AssignmentTurnedInRoundedIcon />,
      },
      {
        titulo: 'Média geral',
        valor: formatarMedia(mediaGeral),
        cor: COR_VERDE,
        icone: <InsightsRoundedIcon />,
      },
    ],
    bannerTitulo: 'Resumo da sua vida escolar',
    bannerDescricao: `${formatarNumero(disciplinasConcluidas)} disciplinas concluídas, ${formatarNumero(totalAtendimentos)} atendimentos registrados e ${formatarNumero(atividadesPendentes)} atividades pendentes no momento.`,
    atividadesRecentes,
  }
}

const carregarDashboard = async (
  supabase: SupabaseClient,
  usuario: UsuarioDashboard,
): Promise<DashboardData> => {
  switch (usuario.papel) {
    case 'ADMIN':
      return carregarDashboardAdmin(supabase, usuario)
    case 'SECRETARIA':
      return carregarDashboardSecretaria(supabase, usuario)
    case 'PROFESSOR':
      return carregarDashboardProfessor(supabase, usuario)
    case 'COORDENACAO':
      return carregarDashboardCoordenacao(supabase, usuario)
    case 'DIRETOR':
      return carregarDashboardDirecao(supabase, usuario)
    case 'ALUNO':
      return carregarDashboardAluno(supabase, usuario)
    default:
      return criarDashboardPadrao(usuario.papel)
  }
}

const StatCard: React.FC<StatCardProps> = ({
  titulo,
  valor,
  tendencia,
  cor,
  icone,
}) => {
  const theme = useTheme()

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(0,0,0,0.15)',
          borderColor: alpha(cor, 0.5),
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(cor, 0.1),
              color: cor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icone}
          </Box>
          <IconButton size="small" sx={{ color: 'text.disabled' }}>
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
          {valor}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {titulo}
          </Typography>
          {tendencia ? (
            <Chip
              label={tendencia}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: alpha(cor, 0.1),
                color: cor,
                fontWeight: 700,
              }}
            />
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  )
}

const DashboardPage: React.FC = () => {
  const { usuario } = useAuth()
  const { supabase } = useSupabase()
  const theme = useTheme()
  const navigate = useNavigate()

  const papel = usuario?.papel
  const base = React.useMemo(() => criarDashboardPadrao(papel), [papel])
  const usarMonitorOperacional = React.useMemo(
    () => Boolean(papel && PAPEIS_COM_MONITOR_AO_VIVO.includes(papel)),
    [papel],
  )

  const {
    data: conteudo,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['dashboard-page', usuario?.id, usuario?.papel],
    enabled: !!usuario?.id && !!usuario?.papel && !!supabase,
    staleTime: usarMonitorOperacional ? 1000 * 15 : 1000 * 60,
    refetchInterval: usarMonitorOperacional ? 1000 * 15 : false,
    refetchOnWindowFocus: usarMonitorOperacional,
    queryFn: async () => {
      if (!usuario || !supabase) return base
      return carregarDashboard(supabase, usuario)
    },
    initialData: base,
  })

  const dataHoje = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const nomeCompleto = conteudo?.nomeExibicao || base.nomeExibicao || 'Usuário'
  const nomeCurto = primeiroNome(nomeCompleto)
  const atividades = conteudo?.atividadesRecentes ?? []

  const irPara = (path: string | null | undefined) => {
    if (!path) return
    navigate(path)
  }

  return (
    <Box sx={{ maxWidth: 1600, mx: 'auto', p: { xs: 0, md: 1 } }}>
      {error ? (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Não foi possível atualizar todos os indicadores da dashboard agora. Os dados exibidos podem estar parciais.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          mb: 4,
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ color: 'text.primary', mb: 0.5 }}
          >
            Olá, {nomeCurto}
          </Typography>

          <Typography variant="body1" color="text.primary" fontWeight={700}>
            {conteudo?.tituloPagina ?? base.tituloPagina}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {conteudo?.subtitulo ?? base.subtitulo}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textTransform: 'capitalize' }}
            >
              {dataHoje}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={
              isFetching ? <CircularProgress size={16} /> : <RefreshRoundedIcon />
            }
            onClick={() => {
              void refetch()
            }}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {isLoading || isFetching ? 'Atualizando dados' : 'Atualizar dados'}
          </Button>

          {conteudo?.mostrarBotaoPrincipal && conteudo.botaoPrincipalPath ? (
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => irPara(conteudo.botaoPrincipalPath)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                background:
                  'linear-gradient(45deg, #F7941D 30%, #FF8E53 90%)',
                color: 'white',
                boxShadow: '0 3px 5px 2px rgba(247, 148, 29, .3)',
              }}
            >
              {conteudo.textoBotaoPrincipal}
            </Button>
          ) : null}
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
          mb: 4,
        }}
      >
        {(conteudo?.stats ?? base.stats).map((stat, index) => (
          <StatCard key={`${stat.titulo}-${index}`} {...stat} />
        ))}
      </Box>

      {conteudo?.monitorOperacional ? (
        <MonitorOperacionalSection data={conteudo.monitorOperacional} />
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
        }}
      >
        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              background:
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #1b5e20 0%, #004d40 100%)'
                  : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
              color: theme.palette.mode === 'dark' ? '#fff' : '#1b5e20',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <SchoolRoundedIcon
              sx={{
                position: 'absolute',
                right: -20,
                bottom: -20,
                fontSize: 180,
                opacity: 0.1,
                transform: 'rotate(-15deg)',
              }}
            />

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {conteudo?.bannerTitulo ?? base.bannerTitulo}
              </Typography>
              <Typography
                variant="body2"
                sx={{ opacity: 0.9, maxWidth: 600, mb: 2 }}
              >
                {conteudo?.bannerDescricao ?? base.bannerDescricao}
              </Typography>
              {conteudo?.bannerBotaoPath ? (
                <Button
                  variant="contained"
                  size="small"
                  color={theme.palette.mode === 'dark' ? 'success' : 'primary'}
                  sx={{ borderRadius: 20, boxShadow: 'none' }}
                  onClick={() => irPara(conteudo.bannerBotaoPath)}
                >
                  {conteudo.bannerBotaoLabel}
                </Button>
              ) : null}
            </Box>
          </Paper>

          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Acesso rápido
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr 1fr',
                sm: '1fr 1fr 1fr',
              },
              gap: 2,
            }}
          >
            {(conteudo?.acessoRapido ?? base.acessoRapido).map(acao => (
              <Paper
                key={`${acao.label}-${acao.path}`}
                elevation={0}
                onClick={() => irPara(acao.path)}
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.04),
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="text.secondary"
                >
                  {acao.label}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>

        <Box>
          <Paper
            elevation={0}
            sx={{
              p: 0,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <Box
              sx={{
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: alpha(theme.palette.background.paper, 0.5),
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Atividade recente
              </Typography>
            </Box>

            {atividades.length ? (
              <Stack spacing={0}>
                {atividades.map((item, index) => (
                  <Box
                    key={item.id}
                    onClick={() => irPara(item.path)}
                    sx={{
                      p: 2,
                      display: 'flex',
                      gap: 2,
                      cursor: item.path ? 'pointer' : 'default',
                      borderBottom:
                        index < atividades.length - 1
                          ? `1px solid ${theme.palette.divider}`
                          : 'none',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.action.hover, 0.5),
                      },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: item.color,
                        fontSize: '0.8rem',
                      }}
                    >
                      {item.user.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" fontWeight={600}>
                        {item.action}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.user} • {item.time}
                      </Typography>
                    </Box>
                    {item.path ? (
                      <IconButton size="small">
                        <ArrowForwardIcon fontSize="small" />
                      </IconButton>
                    ) : null}
                  </Box>
                ))}
              </Stack>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nenhuma atividade recente encontrada para o seu perfil.
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                p: 2,
                borderTop: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Button
                fullWidth
                size="small"
                sx={{ textTransform: 'none' }}
                onClick={() => {
                  const destino = conteudo?.bannerBotaoPath || conteudo?.botaoPrincipalPath
                  irPara(destino)
                }}
              >
                Ver área principal
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  )
}

export { DashboardPage }
export default DashboardPage
