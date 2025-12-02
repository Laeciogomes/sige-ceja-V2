// src/rotas/index.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

import { RootLayout } from '../layouts/RootLayout'
import { LoginPage } from '../paginas/Autenticacao/LoginPage'
import { NovaSenhaPage } from '../paginas/Autenticacao/NovaSenhaPage'
import { DashboardPage } from '../paginas/Dashboard/DashboardPage'
import { PaginaSimples } from '../paginas/PaginaSimples'
import PerfilPage from '../paginas/Perfil/PerfilPage'
import ConfiguracoesPage from '../paginas/Configuracoes/ConfiguracoesPage'
import { useAuth } from '../contextos/AuthContext'
import { RotaPorPapel } from '../componentes/navegacao/RotaPorPapel'

import SecretariaLayout from '../paginas/Secretaria/SecretariaLayout'
import SecretariaUsuariosPage from '../paginas/Secretaria/SecretariaUsuariosPage'
import SecretariaTurmasPage from '../paginas/Secretaria/SecretariaTurmasPage'
import SecretariaMatriculasPage from '../paginas/Secretaria/SecretariaMatriculasPage'
import SecretariaRelatoriosFichasPage from '../paginas/Secretaria/SecretariaRelatoriosFichasPage'

export const AppRoutes: React.FC = () => {
  const { usuario, carregando } = useAuth()
  const autenticado = !!usuario

  if (carregando) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Routes>
      {/* LOGIN */}
      <Route
        path="/login"
        element={autenticado ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* ROTA PÚBLICA PARA REDEFINIÇÃO DE SENHA (link do e-mail do Supabase) */}
      <Route path="/nova-senha" element={<NovaSenhaPage />} />

      {/* ROTAS PROTEGIDAS (PRECISAM DE USUÁRIO AUTENTICADO) */}
      <Route
        path="/"
        element={
          autenticado ? <RootLayout /> : <Navigate to="/login" replace />
        }
      >
        {/* Dashboard geral */}
        <Route index element={<DashboardPage />} />

        {/* SECRETARIA – apenas SECRETARIA e ADMIN */}
        <Route
          path="secretaria"
          element={
            <RotaPorPapel papeisPermitidos={['SECRETARIA', 'ADMIN']}>
              <SecretariaLayout />
            </RotaPorPapel>
          }
        >
          {/* Ao acessar /secretaria, cai em Matrículas por padrão */}
          <Route index element={<Navigate to="matriculas" replace />} />
          <Route path="usuarios" element={<SecretariaUsuariosPage />} />
          <Route path="turmas" element={<SecretariaTurmasPage />} />
          <Route path="matriculas" element={<SecretariaMatriculasPage />} />
          <Route
            path="relatorios-fichas"
            element={<SecretariaRelatoriosFichasPage />}
          />
        </Route>

        {/* Outras áreas ainda em construção */}
        <Route
          path="professores"
          element={<PaginaSimples titulo="Professores" />}
        />
        <Route
          path="coordenacao"
          element={<PaginaSimples titulo="Coordenação" />}
        />
        <Route path="direcao" element={<PaginaSimples titulo="Direção" />} />
        <Route
          path="administracao"
          element={<PaginaSimples titulo="Administração" />}
        />
        <Route path="alunos" element={<PaginaSimples titulo="Alunos" />} />
        <Route
          path="salas"
          element={<PaginaSimples titulo="Salas de Atendimento" />}
        />
        <Route
          path="atendimentos"
          element={<PaginaSimples titulo="Atendimentos" />}
        />
        <Route
          path="relatorios"
          element={<PaginaSimples titulo="Relatórios" />}
        />

        {/* CONFIGURAÇÕES (página completa de ajustes do usuário) */}
        <Route path="config" element={<ConfiguracoesPage />} />

        {/* PERFIL DO USUÁRIO */}
        <Route path="perfil" element={<PerfilPage />} />
      </Route>

      {/* QUALQUER OUTRA ROTA: REDIRECIONA CONFORME AUTENTICAÇÃO */}
      <Route
        path="*"
        element={
          autenticado ? (
            <Navigate to="/" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}
