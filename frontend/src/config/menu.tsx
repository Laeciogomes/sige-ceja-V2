// frontend/src/config/menu.tsx
import React from 'react'

import DashboardIcon from '@mui/icons-material/Dashboard'
import SchoolIcon from '@mui/icons-material/School'
import PeopleIcon from '@mui/icons-material/People'
import AccountTreeIcon from '@mui/icons-material/AccountTree'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import AssessmentIcon from '@mui/icons-material/Assessment'
import SettingsIcon from '@mui/icons-material/Settings'
import DoorFrontIcon from '@mui/icons-material/DoorFront'
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom'

import type { PapelUsuario } from '../contextos/AuthContext'

export type ItemMenuConfig = {
  rotulo: string
  caminho: string
  icone: React.ReactElement
  /**
   * Se informado, o item só aparece para os papéis listados.
   * Se omitido, o item aparece para qualquer usuário autenticado.
   */
  papeisPermitidos?: PapelUsuario[]
}

export const itensMenu: ItemMenuConfig[] = [
  { rotulo: 'Dashboard', caminho: '/', icone: <DashboardIcon /> },
  {
    rotulo: 'Secretaria',
    caminho: '/secretaria',
    icone: <SchoolIcon />,
    papeisPermitidos: ['SECRETARIA', 'ADMIN'],
  },
  { rotulo: 'Professores', caminho: '/professores', icone: <PeopleIcon /> },
  {
    rotulo: 'Coordenação',
    caminho: '/coordenacao',
    icone: <AccountTreeIcon />,
  },
  {
    rotulo: 'Direção',
    caminho: '/direcao',
    icone: <AdminPanelSettingsIcon />,
  },
  {
    rotulo: 'Administração',
    caminho: '/administracao',
    icone: <SettingsIcon />,
  },
  { rotulo: 'Alunos', caminho: '/alunos', icone: <SchoolIcon /> },
  {
    rotulo: 'Salas de Atendimento',
    caminho: '/salas',
    icone: <DoorFrontIcon />,
  },
  {
    rotulo: 'Atendimentos',
    caminho: '/atendimentos',
    icone: <MeetingRoomIcon />,
  },
  { rotulo: 'Relatórios', caminho: '/relatorios', icone: <AssessmentIcon /> },
  // >>> OBS: "Configurações" fica só no menu do usuário (BarraSuperior).
]
