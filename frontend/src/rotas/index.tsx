// src/rotas/index.tsx

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { RootLayout } from '../layouts/RootLayout'
import { LoginPage } from '../paginas/Autenticacao/LoginPage'
import { NovaSenhaPage } from '../paginas/Autenticacao/NovaSenhaPage'

// ATENÇÃO: Dashboard agora está na pasta painel-administracao
import { DashboardPage } from '../paginas/painel-administracao/DashboardPage'

import { PaginaSimples } from '../paginas/PaginaSimples'
import PerfilPage from '../paginas/Perfil/PerfilPage'
import ConfiguracoesPage from '../paginas/Configuracoes/ConfiguracoesPage'
import { useAuth } from '../contextos/AuthContext'
import { RotaPorPapel } from '../componentes/navegacao/RotaPorPapel'

// ATENÇÃO: páginas de Secretaria agora estão em painel-secretaria
import SecretariaLayout from '../paginas/painel-secretaria/SecretariaLayout'
import SecretariaUsuariosPage from '../paginas/painel-secretaria/SecretariaUsuariosPage'
import SecretariaTurmasPage from '../paginas/painel-secretaria/SecretariaTurmasPage'
import SecretariaMatriculasPage from '../paginas/painel-secretaria/SecretariaMatriculasPage'
import SecretariaRelatoriosFichasPage from '../paginas/painel-secretaria/SecretariaRelatoriosFichasPage'


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
        {/* Dashboard geral (pode futuramente renderizar dashboards diferentes por papel) */}
        <Route index element={<DashboardPage />} />

        {/* SECRETARIA – Secretaria, Coordenação, Direção e Admin têm acesso */}
        <Route
          path="secretaria"
          element={
            <RotaPorPapel
              papeisPermitidos={[
                'SECRETARIA',
                'ADMIN',
                'COORDENACAO',
                'DIRETOR',
              ]}
            >
              <SecretariaLayout />
            </RotaPorPapel>
          }
        >
          {/* Por enquanto, mantém Matrículas como página padrão */}
          <Route index element={<Navigate to="matriculas" replace />} />
          <Route path="usuarios" element={<SecretariaUsuariosPage />} />
          <Route path="turmas" element={<SecretariaTurmasPage />} />
          <Route
            path="salas"
            element={<PaginaSimples titulo="Gerenciar salas" />}
          />
          <Route
            path="disciplinas"
            element={<PaginaSimples titulo="Gerenciar disciplinas" />}
          />
          {/* Usando a tela de relatórios/fichas como placeholder para protocolos */}
          <Route
            path="protocolos"
            element={<SecretariaRelatoriosFichasPage />}
          />
          <Route path="matriculas" element={<SecretariaMatriculasPage />} />
          <Route
            path="renovacoes"
            element={<PaginaSimples titulo="Renovar matrícula" />}
          />
        </Route>

        {/* PROFESSORES – painel do professor */}
        <Route
          path="professores"
          element={
            <RotaPorPapel papeisPermitidos={['PROFESSOR', 'ADMIN']}>
              <PaginaSimples titulo="Painel do Professor" />
            </RotaPorPapel>
          }
        />
        <Route
          path="professores/atendimentos"
          element={
            <RotaPorPapel papeisPermitidos={['PROFESSOR', 'ADMIN']}>
              <PaginaSimples titulo="Atendimentos" />
            </RotaPorPapel>
          }
        />
        <Route
          path="professores/acompanhamento"
          element={
            <RotaPorPapel papeisPermitidos={['PROFESSOR', 'ADMIN']}>
              <PaginaSimples titulo="Acompanhamento de alunos" />
            </RotaPorPapel>
          }
        />

        {/* COORDENAÇÃO – tudo da secretaria + SASP e acompanhamento */}
        <Route
          path="coordenacao"
          element={
            <RotaPorPapel papeisPermitidos={['COORDENACAO', 'DIRETOR', 'ADMIN']}>
              <PaginaSimples titulo="Painel da Coordenação" />
            </RotaPorPapel>
          }
        />
        <Route
          path="coordenacao/sasp"
          element={
            <RotaPorPapel papeisPermitidos={['COORDENACAO', 'DIRETOR', 'ADMIN']}>
              <PaginaSimples titulo="SASP" />
            </RotaPorPapel>
          }
        />
        <Route
          path="coordenacao/acompanhamento"
          element={
            <RotaPorPapel papeisPermitidos={['COORDENACAO', 'DIRETOR', 'ADMIN']}>
              <PaginaSimples titulo="Acompanhamento de alunos" />
            </RotaPorPapel>
          }
        />

        {/* DIREÇÃO – igual à coordenação */}
        <Route
          path="direcao"
          element={
            <RotaPorPapel papeisPermitidos={['DIRETOR', 'ADMIN']}>
              <PaginaSimples titulo="Painel da Direção" />
            </RotaPorPapel>
          }
        />
        <Route
          path="direcao/sasp"
          element={
            <RotaPorPapel papeisPermitidos={['DIRETOR', 'ADMIN']}>
              <PaginaSimples titulo="SASP" />
            </RotaPorPapel>
          }
        />
        <Route
          path="direcao/acompanhamento"
          element={
            <RotaPorPapel papeisPermitidos={['DIRETOR', 'ADMIN']}>
              <PaginaSimples titulo="Acompanhamento de alunos" />
            </RotaPorPapel>
          }
        />

        {/* ALUNOS – painel do aluno (placeholders) */}
        <Route
          path="alunos"
          element={
            <RotaPorPapel papeisPermitidos={['ALUNO', 'ADMIN']}>
              <PaginaSimples titulo="Painel do Aluno" />
            </RotaPorPapel>
          }
        />
        <Route
          path="alunos/matriculas"
          element={
            <RotaPorPapel papeisPermitidos={['ALUNO', 'ADMIN']}>
              <PaginaSimples titulo="Minhas matrículas" />
            </RotaPorPapel>
          }
        />
        <Route
          path="alunos/progresso"
          element={
            <RotaPorPapel papeisPermitidos={['ALUNO', 'ADMIN']}>
              <PaginaSimples titulo="Meu progresso" />
            </RotaPorPapel>
          }
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
