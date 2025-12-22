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
import ListAltIcon from '@mui/icons-material/ListAlt'
import CategoryIcon from '@mui/icons-material/Category'

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
  grupo?: string // Usado para os cabeçalhos de seção
}

/**
 * Menus por contexto de painel.
 * IMPORTANTE: O primeiro item de cada lista é tratado como o "Dashboard" principal
 * na BarraLateral e ganha destaque visual separado.
 */
export const menusPorContexto: Record<ContextoPainel, ItemMenuConfig[]> = {
  /**
   * ADMIN
   */
  ADMIN: [
    // 1. Dashboard (Topo)
    {
      id: 'admin-dashboard',
      rotulo: 'Visão Geral',
      caminho: '/admin',
      icone: <DashboardIcon />,
    },

    // --- SECRETARIA: ADMINISTRATIVO ---
    {
      id: 'admin-sec-usuarios',
      rotulo: 'Usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
      grupo: 'Administrativo',
    },
    {
      id: 'admin-sec-turmas',
      rotulo: 'Turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
      grupo: 'Administrativo',
    },
    {
      id: 'admin-sec-salas',
      rotulo: 'Salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
      grupo: 'Administrativo',
    },
    {
      id: 'admin-sec-areas',
      rotulo: 'Áreas de conhecimento',
      caminho: '/secretaria/areas-conhecimento',
      icone: <CategoryIcon />,
      grupo: 'Administrativo',
    },
    {
      id: 'admin-sec-disciplinas',
      rotulo: 'Disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
      grupo: 'Administrativo',
    },
    {
      id: 'admin-sec-protocolos',
      rotulo: 'Protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
      grupo: 'Administrativo',
    },

    // --- SECRETARIA: ACADÊMICO ---
    {
      id: 'admin-sec-matriculas',
      rotulo: 'Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
      grupo: 'Acadêmico',
    },

    // --- SECRETARIA: RELATÓRIOS ---
    {
      id: 'admin-sec-relatorios-fichas',
      rotulo: 'Relatórios e fichas',
      caminho: '/secretaria/relatorios-fichas',
      icone: <DescriptionIcon />,
      grupo: 'Relatórios',
    },

    // --- PEDAGÓGICO ---
    {
      id: 'admin-ped-atendimentos',
      rotulo: 'Atendimentos',
      caminho: '/professores/atendimentos',
      icone: <MeetingRoomIcon />,
      grupo: 'Pedagógico',
    },
    {
      id: 'admin-ped-acompanhamento',
      rotulo: 'Acompanhamento',
      caminho: '/coordenacao/acompanhamento',
      icone: <AssessmentIcon />,
      grupo: 'Pedagógico',
    },
    {
      id: 'admin-ped-sasp',
      rotulo: 'SASP',
      caminho: '/coordenacao/sasp',
      icone: <ListAltIcon />,
      grupo: 'Pedagógico',
    },

    // --- VISÃO ALUNO ---
    {
      id: 'admin-aluno-matriculas',
      rotulo: 'Matrículas (Aluno)',
      caminho: '/alunos/matriculas',
      icone: <AssignmentIndIcon />,
      grupo: 'Visão Aluno',
    },
    {
      id: 'admin-aluno-progresso',
      rotulo: 'Progresso (Aluno)',
      caminho: '/alunos/progresso',
      icone: <AssessmentIcon />,
      grupo: 'Visão Aluno',
    },
  ],

  /**
   * SECRETARIA
   */
  SECRETARIA: [
    {
      id: 'sec-dashboard',
      rotulo: 'Dashboard',
      caminho: '/secretaria',
      icone: <DashboardIcon />,
    },
    {
      id: 'sec-usuarios',
      rotulo: 'Usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
      grupo: 'Gestão',
    },
    {
      id: 'sec-turmas',
      rotulo: 'Turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
      grupo: 'Gestão',
    },
    {
      id: 'sec-salas',
      rotulo: 'Salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
      grupo: 'Gestão',
    },
    {
      id: 'sec-areas',
      rotulo: 'Áreas de conhecimento',
      caminho: '/secretaria/areas-conhecimento',
      icone: <CategoryIcon />,
      grupo: 'Gestão',
    },
    {
      id: 'sec-disciplinas',
      rotulo: 'Disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
      grupo: 'Gestão',
    },
    {
      id: 'sec-protocolos',
      rotulo: 'Protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
      grupo: 'Atendimento',
    },
    {
      id: 'sec-matriculas',
      rotulo: 'Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
      grupo: 'Atendimento',
    },
    {
      id: 'sec-relatorios-fichas',
      rotulo: 'Relatórios e fichas',
      caminho: '/secretaria/relatorios-fichas',
      icone: <DescriptionIcon />,
      grupo: 'Relatórios',
    },
  ],

  /**
   * PROFESSOR
   */
  PROFESSOR: [
    {
      id: 'prof-dashboard',
      rotulo: 'Dashboard',
      caminho: '/professores',
      icone: <DashboardIcon />,
    },
    {
      id: 'prof-atendimentos',
      rotulo: 'Meus Atendimentos',
      caminho: '/professores/atendimentos',
      icone: <MeetingRoomIcon />,
      grupo: 'Pedagógico',
    },
    {
      id: 'prof-acompanhamento',
      rotulo: 'Acompanhamento',
      caminho: '/professores/acompanhamento',
      icone: <AssessmentIcon />,
      grupo: 'Pedagógico',
    },
  ],

  /**
   * COORDENAÇÃO
   */
  COORDENACAO: [
    {
      id: 'coord-dashboard',
      rotulo: 'Dashboard',
      caminho: '/coordenacao',
      icone: <DashboardIcon />,
    },
    {
      id: 'coord-usuarios',
      rotulo: 'Usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
      grupo: 'Administração',
    },
    {
      id: 'coord-turmas',
      rotulo: 'Turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
      grupo: 'Administração',
    },
    {
      id: 'coord-salas',
      rotulo: 'Salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
      grupo: 'Administração',
    },
    {
      id: 'coord-areas',
      rotulo: 'Áreas de conhecimento',
      caminho: '/secretaria/areas-conhecimento',
      icone: <CategoryIcon />,
      grupo: 'Administração',
    },
    {
      id: 'coord-disciplinas',
      rotulo: 'Disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
      grupo: 'Administração',
    },
    {
      id: 'coord-protocolos',
      rotulo: 'Protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
      grupo: 'Secretaria',
    },
    {
      id: 'coord-matriculas',
      rotulo: 'Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
      grupo: 'Secretaria',
    },
    {
      id: 'coord-relatorios-fichas',
      rotulo: 'Relatórios e fichas',
      caminho: '/secretaria/relatorios-fichas',
      icone: <DescriptionIcon />,
      grupo: 'Secretaria',
    },
    {
      id: 'coord-sasp',
      rotulo: 'SASP',
      caminho: '/coordenacao/sasp',
      icone: <ListAltIcon />,
      grupo: 'Pedagógico',
    },
    {
      id: 'coord-acompanhamento',
      rotulo: 'Acompanhamento',
      caminho: '/coordenacao/acompanhamento',
      icone: <AssessmentIcon />,
      grupo: 'Pedagógico',
    },
  ],

  /**
   * DIREÇÃO
   */
  DIRECAO: [
    {
      id: 'dir-dashboard',
      rotulo: 'Dashboard',
      caminho: '/direcao',
      icone: <DashboardIcon />,
    },
    {
      id: 'dir-usuarios',
      rotulo: 'Usuários',
      caminho: '/secretaria/usuarios',
      icone: <PeopleIcon />,
      grupo: 'Gestão Escolar',
    },
    {
      id: 'dir-turmas',
      rotulo: 'Turmas',
      caminho: '/secretaria/turmas',
      icone: <ClassIcon />,
      grupo: 'Gestão Escolar',
    },
    {
      id: 'dir-salas',
      rotulo: 'Salas',
      caminho: '/secretaria/salas',
      icone: <DoorFrontIcon />,
      grupo: 'Gestão Escolar',
    },
    {
      id: 'dir-areas',
      rotulo: 'Áreas de conhecimento',
      caminho: '/secretaria/areas-conhecimento',
      icone: <CategoryIcon />,
      grupo: 'Gestão Escolar',
    },
    {
      id: 'dir-disciplinas',
      rotulo: 'Disciplinas',
      caminho: '/secretaria/disciplinas',
      icone: <MenuBookIcon />,
      grupo: 'Gestão Escolar',
    },
    {
      id: 'dir-protocolos',
      rotulo: 'Protocolos',
      caminho: '/secretaria/protocolos',
      icone: <DescriptionIcon />,
      grupo: 'Secretaria',
    },
    {
      id: 'dir-matriculas',
      rotulo: 'Matrículas',
      caminho: '/secretaria/matriculas',
      icone: <AssignmentIndIcon />,
      grupo: 'Secretaria',
    },
    {
      id: 'dir-relatorios-fichas',
      rotulo: 'Relatórios e fichas',
      caminho: '/secretaria/relatorios-fichas',
      icone: <DescriptionIcon />,
      grupo: 'Secretaria',
    },
    {
      id: 'dir-sasp',
      rotulo: 'SASP',
      caminho: '/direcao/sasp',
      icone: <ListAltIcon />,
      grupo: 'Pedagógico',
    },
    {
      id: 'dir-acompanhamento',
      rotulo: 'Acompanhamento',
      caminho: '/direcao/acompanhamento',
      icone: <AssessmentIcon />,
      grupo: 'Pedagógico',
    },
  ],

  /**
   * ALUNO
   */
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
      grupo: 'Secretaria',
    },
    {
      id: 'aluno-progresso',
      rotulo: 'Meu progresso',
      caminho: '/alunos/progresso',
      icone: <AssessmentIcon />,
      grupo: 'Acadêmico',
    },
  ],
}

/**
 * Lógica para descobrir qual painel está ativo com base na rota e papel.
 */
export const obterContextoPainel = (
  papel: PapelUsuario | undefined,
  pathname: string,
): ContextoPainel => {
  const path = pathname.toLowerCase()

  if ((papel as string) === 'ADMIN') {
    return 'ADMIN'
  }

  if (path.startsWith('/secretaria')) return 'SECRETARIA'
  if (path.startsWith('/professores')) return 'PROFESSOR'
  if (path.startsWith('/coordenacao')) return 'COORDENACAO'
  if (path.startsWith('/direcao')) return 'DIRECAO'
  if (path.startsWith('/alunos')) return 'ALUNO'

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
