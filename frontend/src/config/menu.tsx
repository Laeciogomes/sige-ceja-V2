// src/config/menu.tsx
import React from 'react'

import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import AssessmentIcon from '@mui/icons-material/Assessment'
import DoorFrontIcon from '@mui/icons-material/DoorFront'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'
import ClassIcon from '@mui/icons-material/Class'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import DescriptionIcon from '@mui/icons-material/Description'
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import ListAltIcon from '@mui/icons-material/ListAlt'

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
 */
export const menusPorContexto: Record<ContextoPainel, ItemMenuConfig[]> = {
  ADMIN: [
    {
      id: 'admin-dashboard',
      rotulo: 'Dashboard',
      caminho: '/',
      icone: <DashboardIcon />,
    },

    // SECRETARIA
    {
      id: 'sec-dashboard',
      rotulo: 'Secretaria / Dashboard',
      caminho: '/secretaria',
      icone: <DashboardIcon />,
    },
    {
      id: 'sec-usuarios',
      rotulo: 'Secretaria / Gerenciar usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
    },
    {
      id: 'sec-turmas',
      rotulo: 'Secretaria / Gerenciar turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
    },
    {
      id: 'sec-salas',
      rotulo: 'Secretaria / Gerenciar salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
    },
    {
      id: 'sec-disciplinas',
      rotulo: 'Secretaria / Gerenciar disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
    },
    {
      id: 'sec-protocolos',
      rotulo: 'Secretaria / Gerenciar protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
    },
    {
      id: 'sec-matriculas',
      rotulo: 'Secretaria / Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
    },
    {
      id: 'sec-renovacoes',
      rotulo: 'Secretaria / Renovar matrícula',
      caminho: '/secretaria/renovacoes',
      icone: <AutorenewIcon />,
    },

    // PROFESSOR
    {
      id: 'prof-dashboard',
      rotulo: 'Professor / Dashboard',
      caminho: '/professores',
      icone: <DashboardIcon />,
    },
    {
      id: 'prof-atendimentos',
      rotulo: 'Professor / Atendimentos',
      caminho: '/professores/atendimentos',
      icone: <MeetingRoomIcon />,
    },
    {
      id: 'prof-acompanhamento',
      rotulo: 'Professor / Acompanhamento de alunos',
      caminho: '/professores/acompanhamento',
      icone: <AssessmentIcon />,
    },

    // COORDENAÇÃO
    {
      id: 'coord-dashboard',
      rotulo: 'Coordenação / Dashboard',
      caminho: '/coordenacao',
      icone: <DashboardIcon />,
    },
    {
      id: 'coord-usuarios',
      rotulo: 'Coordenação / Gerenciar usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
    },
    {
      id: 'coord-turmas',
      rotulo: 'Coordenação / Gerenciar turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
    },
    {
      id: 'coord-salas',
      rotulo: 'Coordenação / Gerenciar salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
    },
    {
      id: 'coord-disciplinas',
      rotulo: 'Coordenação / Gerenciar disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
    },
    {
      id: 'coord-protocolos',
      rotulo: 'Coordenação / Gerenciar protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
    },
    {
      id: 'coord-matriculas',
      rotulo: 'Coordenação / Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
    },
    {
      id: 'coord-renovacoes',
      rotulo: 'Coordenação / Renovar matrícula',
      caminho: '/secretaria/renovacoes',
      icone: <AutorenewIcon />,
    },
    {
      id: 'coord-sasp',
      rotulo: 'Coordenação / SASP',
      caminho: '/coordenacao/sasp',
      icone: <ListAltIcon />,
    },
    {
      id: 'coord-acompanhamento',
      rotulo: 'Coordenação / Acompanhamento de alunos',
      caminho: '/coordenacao/acompanhamento',
      icone: <AssessmentIcon />,
    },

    // DIREÇÃO
    {
      id: 'dir-dashboard',
      rotulo: 'Direção / Dashboard',
      caminho: '/direcao',
      icone: <DashboardIcon />,
    },
    {
      id: 'dir-usuarios',
      rotulo: 'Direção / Gerenciar usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
    },
    {
      id: 'dir-turmas',
      rotulo: 'Direção / Gerenciar turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
    },
    {
      id: 'dir-salas',
      rotulo: 'Direção / Gerenciar salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
    },
    {
      id: 'dir-disciplinas',
      rotulo: 'Direção / Gerenciar disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
    },
    {
      id: 'dir-protocolos',
      rotulo: 'Direção / Gerenciar protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
    },
    {
      id: 'dir-matriculas',
      rotulo: 'Direção / Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
    },
    {
      id: 'dir-renovacoes',
      rotulo: 'Direção / Renovar matrícula',
      caminho: '/secretaria/renovacoes',
      icone: <AutorenewIcon />,
    },
    {
      id: 'dir-sasp',
      rotulo: 'Direção / SASP',
      caminho: '/direcao/sasp',
      icone: <ListAltIcon />,
    },
    {
      id: 'dir-acompanhamento',
      rotulo: 'Direção / Acompanhamento de alunos',
      caminho: '/direcao/acompanhamento',
      icone: <AssessmentIcon />,
    },

    // ALUNO
    {
      id: 'aluno-dashboard',
      rotulo: 'Aluno / Minha área',
      caminho: '/alunos',
      icone: <DashboardIcon />,
    },
    {
      id: 'aluno-matriculas',
      rotulo: 'Aluno / Minhas matrículas',
      caminho: '/alunos/matriculas',
      icone: <AssignmentIndIcon />,
    },
    {
      id: 'aluno-progresso',
      rotulo: 'Aluno / Meu progresso',
      caminho: '/alunos/progresso',
      icone: <AssessmentIcon />,
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
 * Para ADMIN, o painel muda conforme a rota (/secretaria, /professores, etc),
 * mas o menu mostrado é sempre o de ADMIN.
 */
export const obterContextoPainel = (
  papel: PapelUsuario | undefined,
  pathname: string,
): ContextoPainel => {
  const path = pathname.toLowerCase()

  // ADMIN sempre usa menu de ADMIN
  if ((papel as string) === 'ADMIN') {
    return 'ADMIN'
  }

  // Tenta inferir pela URL para outros papéis
  if (path.startsWith('/secretaria')) return 'SECRETARIA'
  if (path.startsWith('/professores')) return 'PROFESSOR'
  if (path.startsWith('/coordenacao')) return 'COORDENACAO'
  if (path.startsWith('/direcao')) return 'DIRECAO'
  if (path.startsWith('/alunos')) return 'ALUNO'

  // Fallback pelo papel do usuário
  switch (papel as string) {
    case 'SECRETARIA':
      return 'SECRETARIA'
    case 'PROFESSOR':
      return 'PROFESSOR'
    case 'COORDENACAO':
      return 'COORDENACAO'
    case 'DIRECAO':
    case 'DIRETOR':
      return 'DIRECAO'
    case 'ALUNO':
      return 'ALUNO'
    case 'ADMIN':
    default:
      return 'ADMIN'
  }
}
