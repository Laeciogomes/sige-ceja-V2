// src/rotas/index.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import RootLayout from '../layouts/RootLayout'
import { LoginPage } from '../paginas/Autenticacao/LoginPage'
import { NovaSenhaPage } from '../paginas/Autenticacao/NovaSenhaPage'
import { DashboardPage } from '../paginas/Dashboard/DashboardPage'
import { PaginaSimples } from '../paginas/PaginaSimples'
import PerfilPage from '../paginas/Perfil/PerfilPage'
import { useAuth } from '../contextos/AuthContext'

export const AppRoutes: React.FC = () => {
  const { usuario } = useAuth()
  const autenticado = !!usuario

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
        <Route index element={<DashboardPage />} />
        <Route
          path="secretaria"
          element={<PaginaSimples titulo="Secretaria" />}
        />
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
        <Route
          path="config"
          element={<PaginaSimples titulo="Configurações" />}
        />

        {/* NOVA ROTA: PERFIL DO USUÁRIO */}
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
