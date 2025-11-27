// src/rotas/index.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { RootLayout } from '../layouts/RootLayout'
import { LoginPage } from '../paginas/Autenticacao/LoginPage'
import { NovaSenhaPage } from '../paginas/Autenticacao/NovaSenhaPage'
import { DashboardPage } from '../paginas/Dashboard/DashboardPage'
import { PaginaSimples } from '../paginas/PaginaSimples'
import { useAuth } from '../contextos/AuthContext'

export const AppRoutes: React.FC = () => {
  const { usuario } = useAuth()
  const autenticado = !!usuario

  return (
    <Routes>
      {/* Login separado do layout principal */}
      <Route
        path="/login"
        element={
          autenticado ? <Navigate to="/" replace /> : <LoginPage />
        }
      />

      {/* ROTA DE REDEFINIÇÃO DE SENHA (pública) */}
      <Route
        path="/nova-senha"
        element={<NovaSenhaPage />}
      />

      {/* Rotas protegidas pelo layout principal */}
      <Route
        path="/"
        element={
          autenticado ? <RootLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<DashboardPage />} />

        <Route path="secretaria" element={<PaginaSimples titulo="Secretaria" />} />
        <Route path="professores" element={<PaginaSimples titulo="Professores" />} />
        <Route path="coordenacao" element={<PaginaSimples titulo="Coordenação" />} />
        <Route path="direcao" element={<PaginaSimples titulo="Direção" />} />
        <Route path="administracao" element={<PaginaSimples titulo="Administração" />} />
        <Route path="alunos" element={<PaginaSimples titulo="Alunos" />} />
        <Route path="salas" element={<PaginaSimples titulo="Salas de Atendimento" />} />
        <Route path="atendimentos" element={<PaginaSimples titulo="Atendimentos" />} />
        <Route path="relatorios" element={<PaginaSimples titulo="Relatórios" />} />
        <Route path="config" element={<PaginaSimples titulo="Configurações" />} />
      </Route>

      {/* Rota desconhecida */}
      <Route
        path="*"
        element={
          autenticado
            ? <Navigate to="/" replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}
