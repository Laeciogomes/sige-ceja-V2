// src/rotas/index.tsx

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { RootLayout } from '../layouts/RootLayout'
import { LoginPage } from '../paginas/Autenticacao/LoginPage'
import { NovaSenhaPage } from '../paginas/Autenticacao/NovaSenhaPage'

// Dashboard principal (admin)
import { DashboardPage } from '../paginas/painel-administracao/DashboardPage'

import { PaginaSimples } from '../paginas/PaginaSimples'
import PerfilPage from '../paginas/Perfil/PerfilPage'
import ConfiguracoesPage from '../paginas/Configuracoes/ConfiguracoesPage'
import { useAuth } from '../contextos/AuthContext'
import { RotaPorPapel } from '../componentes/navegacao/RotaPorPapel'

// Páginas da Secretaria
import SecretariaLayout from '../paginas/painel-secretaria/SecretariaLayout'
import SecretariaUsuariosPage from '../paginas/painel-secretaria/SecretariaUsuariosPage'
import SecretariaTurmasPage from '../paginas/painel-secretaria/SecretariaTurmasPage'
import SecretariaMatriculasPage from '../paginas/painel-secretaria/SecretariaMatriculasPage'
import SecretariaDisciplinasPage from '../paginas/painel-secretaria/SecretariaDisciplinasPage'
import SecretariaAreasConhecimentoPage from '../paginas/painel-secretaria/SecretariaAreasConhecimentoPage'
import SecretariaSalasPage from '../paginas/painel-secretaria/SecretariaSalasPage'
import SecretariaProtocolosPage from '../paginas/painel-secretaria/SecretariaProtocolosPage'
import SecretariaTurmaAlunosPage from '../paginas/painel-secretaria/SecretariaTurmaAlunosPage'
import SecretariaRelatoriosFichasPage from '../paginas/painel-secretaria/SecretariaRelatoriosFichasPage'
import SecretariaImportarMatriculasPage from '../paginas/painel-secretaria/SecretariaImportarMatriculasPage'

export const AppRoutes: React.FC = () => {
  // Inclui "carregando" para evitar redirecionar enquanto a sessão está sendo restaurada
  const { usuario, carregando } = useAuth() as {
    usuario: any
    carregando?: boolean
  }

  const autenticado = !!usuario

  // Enquanto a autenticação estiver carregando, não monta as rotas protegidas
  // Isso evita que um F5 em /perfil ou /config volte para "/"
  if (carregando) {
    return <PaginaSimples titulo="Carregando sessão, aguarde..." />
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
          {/* NOVA ROTA: alunos da turma */}
          <Route
            path="turmas/:turmaId/alunos"
            element={<SecretariaTurmaAlunosPage />}
          />
          <Route path="salas" element={<SecretariaSalasPage />} />
          <Route
            path="areas-conhecimento"
            element={<SecretariaAreasConhecimentoPage />}
          />
          <Route path="disciplinas" element={<SecretariaDisciplinasPage />} />
          <Route path="protocolos" element={<SecretariaProtocolosPage />} />
          <Route path="matriculas" element={<SecretariaMatriculasPage />} />
          {/* ROTA TEMPORÁRIA: importar matrículas em lote (2025) */}
          <Route
            path="matriculas/importar"
            element={<SecretariaImportarMatriculasPage />}
          />
          <Route
            path="renovacoes"
            element={<PaginaSimples titulo="Renovar matrícula" />}
          />
          <Route
            path="relatorios-fichas"
            element={<SecretariaRelatoriosFichasPage />}
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

        {/* DIREÇÃO – visão macro + SASP e acompanhamento */}
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

        {/* ALUNOS – painel do aluno */}
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

        {/* PERFIL E CONFIGURAÇÕES (acesso para qualquer usuário logado) */}
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="config" element={<ConfiguracoesPage />} />

        {/* ROTA CORINGA DENTRO DO LAYOUT – se chegar aqui, vai para Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* ROTA CORINGA FORA DO LAYOUT – se não autenticado, joga para login */}
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
