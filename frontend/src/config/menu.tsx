// src/config/menu.tsx
import React from 'react'

import DashboardIcon from '@mui/icons-material/Dashboard'
import SchoolIcon from '@mui/icons-material/School'
import PeopleIcon from '@mui/icons-material/People'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import AssessmentIcon from '@mui/icons-material/Assessment'
import DoorFrontIcon from '@mui/icons-material/DoorFront'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import ClassIcon from '@mui/icons-material/Class'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import DescriptionIcon from '@mui/icons-material/Description'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import ListAltIcon from '@mui/icons-material/ListAlt'
import PersonIcon from '@mui/icons-material/Person'

import type { PapelUsuario } from '../contextos/AuthContext'

export type ContextoPainel =
  | 'ADMIN'
  | 'SECRETARIA'
  | 'PROFESSOR'
  | 'COORDENACAO'
  | 'DIRECAO'
  | 'ALUNO'

export type ItemMenuConfig = {
  id: string
  rotulo: string
  caminho: string
  icone: React.ReactElement
}

/**
 * Menus por contexto de painel.
 *
 * - ADMIN: painel de administração geral, com acesso aos outros painéis.
 * - SECRETARIA: tudo que a Secretaria faz.
 * - PROFESSOR: atendimentos e acompanhamento de alunos.
 * - COORDENACAO: tudo da secretaria + SASP e acompanhamento.
 * - DIRECAO: igual à coordenação.
 * - ALUNO: visão do aluno (placeholders por enquanto).
 */
export const menusPorContexto: Record<ContextoPainel, ItemMenuConfig[]> = {
  ADMIN: [
    {
      id: 'admin-dashboard',
      rotulo: 'Dashboard',
      caminho: '/',
      icone: <DashboardIcon />,
    },
    {
      id: 'admin-secretaria',
      rotulo: 'Painel Secretaria',
      caminho: '/secretaria',
      icone: <SchoolIcon />,
    },
    {
      id: 'admin-professores',
      rotulo: 'Painel Professores',
      caminho: '/professores',
      icone: <PeopleIcon />,
    },
    {
      id: 'admin-coordenacao',
      rotulo: 'Painel Coordenação',
      caminho: '/coordenacao',
      icone: <AccountTreeIcon />,
    },
    {
      id: 'admin-direcao',
      rotulo: 'Painel Direção',
      caminho: '/direcao',
      icone: <AdminPanelSettingsIcon />,
    },
    {
      id: 'admin-alunos',
      rotulo: 'Painel Alunos',
      caminho: '/alunos',
      icone: <PersonIcon />,
    },
  ],

  SECRETARIA: [
    {
      id: 'sec-dashboard',
      rotulo: 'Dashboard',
      caminho: '/secretaria',
      icone: <DashboardIcon />,
    },
    {
      id: 'sec-usuarios',
      rotulo: 'Gerenciar usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
    },
    {
      id: 'sec-turmas',
      rotulo: 'Gerenciar turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
    },
    {
      id: 'sec-salas',
      rotulo: 'Gerenciar salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
    },
    {
      id: 'sec-disciplinas',
      rotulo: 'Gerenciar disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
    },
    {
      id: 'sec-protocolos',
      rotulo: 'Gerenciar protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
    },
    {
      id: 'sec-matriculas',
      rotulo: 'Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
    },
    {
      id: 'sec-renovacoes',
      rotulo: 'Renovar matrícula',
      caminho: '/secretaria/renovacoes',
      icone: <AutorenewIcon />,
    },
  ],

  PROFESSOR: [
    {
      id: 'prof-dashboard',
      rotulo: 'Dashboard',
      caminho: '/professores',
      icone: <DashboardIcon />,
    },
    {
      id: 'prof-atendimentos',
      rotulo: 'Atendimentos',
      caminho: '/professores/atendimentos',
      icone: <MeetingRoomIcon />,
    },
    {
      id: 'prof-acompanhamento',
      rotulo: 'Acompanhamento de alunos',
      caminho: '/professores/acompanhamento',
      icone: <AssessmentIcon />,
    },
  ],

  COORDENACAO: [
    {
      id: 'coord-dashboard',
      rotulo: 'Dashboard',
      caminho: '/coordenacao',
      icone: <DashboardIcon />,
    },
    // Tudo da Secretaria (reutilizando as rotas /secretaria/...)
    {
      id: 'coord-usuarios',
      rotulo: 'Gerenciar usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
    },
    {
      id: 'coord-turmas',
      rotulo: 'Gerenciar turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
    },
    {
      id: 'coord-salas',
      rotulo: 'Gerenciar salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
    },
    {
      id: 'coord-disciplinas',
      rotulo: 'Gerenciar disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
    },
    {
      id: 'coord-protocolos',
      rotulo: 'Gerenciar protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
    },
    {
      id: 'coord-matriculas',
      rotulo: 'Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
    },
    {
      id: 'coord-renovacoes',
      rotulo: 'Renovar matrícula',
      caminho: '/secretaria/renovacoes',
      icone: <AutorenewIcon />,
    },
    // Extra da Coordenação
    {
      id: 'coord-sasp',
      rotulo: 'SASP',
      caminho: '/coordenacao/sasp',
      icone: <ListAltIcon />,
    },
    {
      id: 'coord-acompanhamento',
      rotulo: 'Acompanhamento de alunos',
      caminho: '/coordenacao/acompanhamento',
      icone: <AssessmentIcon />,
    },
  ],

  DIRECAO: [
    {
      id: 'dir-dashboard',
      rotulo: 'Dashboard',
      caminho: '/direcao',
      icone: <DashboardIcon />,
    },
    // Tudo da Secretaria
    {
      id: 'dir-usuarios',
      rotulo: 'Gerenciar usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
    },
    {
      id: 'dir-turmas',
      rotulo: 'Gerenciar turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
    },
    {
      id: 'dir-salas',
      rotulo: 'Gerenciar salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
    },
    {
      id: 'dir-disciplinas',
      rotulo: 'Gerenciar disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
    },
    {
      id: 'dir-protocolos',
      rotulo: 'Gerenciar protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
    },
    {
      id: 'dir-matriculas',
      rotulo: 'Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
    },
    {
      id: 'dir-renovacoes',
      rotulo: 'Renovar matrícula',
      caminho: '/secretaria/renovacoes',
      icone: <AutorenewIcon />,
    },
    // Extra da Direção (igual à coordenação)
    {
      id: 'dir-sasp',
      rotulo: 'SASP',
      caminho: '/direcao/sasp',
      icone: <ListAltIcon />,
    },
    {
      id: 'dir-acompanhamento',
      rotulo: 'Acompanhamento de alunos',
      caminho: '/direcao/acompanhamento',
      icone: <AssessmentIcon />,
    },
  ],

  ALUNO: [
    {
      id: 'aluno-dashboard',
      rotulo: 'Minha área',
      caminho: '/alunos',
      icone: <DashboardIcon />,
    },
    {
      id: 'aluno-matriculas',
      rotulo: 'Minhas matrículas',
      caminho: '/alunos/matriculas',
      icone: <AssignmentIndIcon />,
    },
    {
      id: 'aluno-progresso',
      rotulo: 'Meu progresso',
      caminho: '/alunos/progresso',
      icone: <AssessmentIcon />,
    },
  ],
}

/**
 * Descobre qual painel está ativo com base na rota atual e no papel.
 * Para ADMIN, o painel muda conforme a rota (/secretaria, /professores, etc).
 */
export const obterContextoPainel = (
  papel: PapelUsuario | undefined,
  pathname: string,
): ContextoPainel => {
  const path = pathname.toLowerCase()

  if (path.startsWith('/secretaria')) return 'SECRETARIA'
  if (path.startsWith('/professores')) return 'PROFESSOR'
  if (path.startsWith('/coordenacao')) return 'COORDENACAO'
  if (path.startsWith('/direcao')) return 'DIRECAO'
  if (path.startsWith('/alunos')) return 'ALUNO'

  // Se a rota não indica claramente o painel, usamos o papel do usuário
  switch (papel) {
    case 'SECRETARIA':
      return 'SECRETARIA'
    case 'PROFESSOR':
      return 'PROFESSOR'
    case 'COORDENACAO':
      return 'COORDENACAO'
    case 'DIRETOR':
      return 'DIRECAO'
    case 'ALUNO':
      return 'ALUNO'
    case 'ADMIN':
    default:
      return 'ADMIN'
  }
}
