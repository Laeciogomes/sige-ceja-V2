// frontend/src/config/menu.ts
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

export type ItemMenuConfig = {
  rotulo: string
  caminho: string
  icone: React.ReactElement
}

export const itensMenu: ItemMenuConfig[] = [
  { rotulo: 'Dashboard', caminho: '/', icone: <DashboardIcon /> },
  { rotulo: 'Secretaria', caminho: '/secretaria', icone: <SchoolIcon /> },
  { rotulo: 'Professores', caminho: '/professores', icone: <PeopleIcon /> },
  { rotulo: 'Coordenação', caminho: '/coordenacao', icone: <AccountTreeIcon /> },
  { rotulo: 'Direção', caminho: '/direcao', icone: <AdminPanelSettingsIcon /> },
  { rotulo: 'Administração', caminho: '/administracao', icone: <SettingsIcon /> },
  { rotulo: 'Alunos', caminho: '/alunos', icone: <SchoolIcon /> },
  { rotulo: 'Salas de Atendimento', caminho: '/salas', icone: <DoorFrontIcon /> },
  { rotulo: 'Atendimentos', caminho: '/atendimentos', icone: <MeetingRoomIcon /> },
  { rotulo: 'Relatórios', caminho: '/relatorios', icone: <AssessmentIcon /> },
  { rotulo: 'Configurações', caminho: '/config', icone: <SettingsIcon /> },
]
