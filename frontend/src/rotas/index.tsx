import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import { RootLayout } from '../layouts/RootLayout'
import { LoginPage } from '../paginas/Autenticacao/LoginPage'
import { NovaSenhaPage } from '../paginas/Autenticacao/NovaSenhaPage'

// Dashboard principal (admin)
import { DashboardPage } from '../paginas/painel-administracao/DashboardPage'

import { PaginaSimples } from '../paginas/PaginaSimples'
import AlunoMatriculasPage from '../paginas/painel-aluno/AlunoMatriculasPage'
import AlunoProgressoPage from '../paginas/painel-aluno/AlunoProgressoPage'
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
import SecretariaHistoricoPage from '../paginas/painel-secretaria/SecretariaHistoricoPage'

// Professor
import ProfessorAtendimentosPage from '../paginas/painel-professor/ProfessorAtendimentosPage'
import AcompanhamentoPage from '../paginas/painel-professor/AcompanhamentoPage'

// SASP (Coordenação/Direção)
import SaspPage from '../paginas/painel-coordenacao/SaspPage'

// ✅ Ficha (rota igual ao ZIP: /fichas/:id_progresso)
import FichaAcompanhamentoPage from '../paginas/painel-professor/FichaAcompanhamentoPage'

export const AppRoutes: React.FC = () => {
  // Inclui "carregando" para evitar redirecionar enquanto a sessão está sendo restaurada
  const { usuario, carregando } = useAuth() as {
    usuario: any
    carregando?: boolean
  }

  const autenticado = !!usuario

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

      {/* ROTAS PROTEGIDAS */}
      <Route
        path="/"
        element={autenticado ? <RootLayout /> : <Navigate to="/login" replace />}
      >
        {/* Dashboard geral */}
        <Route index element={<DashboardPage />} />

        {/* SECRETARIA */}
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
          <Route index element={<Navigate to="matriculas" replace />} />
          <Route path="usuarios" element={<SecretariaUsuariosPage />} />
          <Route path="turmas" element={<SecretariaTurmasPage />} />
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
          <Route
            path="relatorios-fichas"
            element={<SecretariaRelatoriosFichasPage />}
          />
          <Route path="historico" element={<SecretariaHistoricoPage />} />
        </Route>

        {/* PROFESSORES */}
        <Route
          path="professores"
          element={
            <RotaPorPapel papeisPermitidos={['PROFESSOR', 'ADMIN']}>
              <DashboardPage />
            </RotaPorPapel>
          }
        />

        <Route
          path="professores/atendimentos"
          element={
            <RotaPorPapel papeisPermitidos={['PROFESSOR', 'ADMIN']}>
              <ProfessorAtendimentosPage />
            </RotaPorPapel>
          }
        />

        <Route
          path="professores/acompanhamento"
          element={
            <RotaPorPapel papeisPermitidos={['PROFESSOR', 'ADMIN']}>
              <AcompanhamentoPage />
            </RotaPorPapel>
          }
        />

        {/* ✅ FICHA (igual ZIP) */}
        <Route
          path="fichas/:id_progresso"
          element={
            <RotaPorPapel
              papeisPermitidos={[
                'PROFESSOR',
                'ADMIN',
                'COORDENACAO',
                'DIRETOR',
                'SECRETARIA',
              ]}
            >
              <FichaAcompanhamentoPage />
            </RotaPorPapel>
          }
        />

        {/* COORDENAÇÃO */}
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
              <SaspPage />
            </RotaPorPapel>
          }
        />
        <Route
          path="coordenacao/acompanhamento"
          element={
            <RotaPorPapel papeisPermitidos={['COORDENACAO', 'DIRETOR', 'ADMIN']}>
              <AcompanhamentoPage />
            </RotaPorPapel>
          }
        />

        {/* DIREÇÃO */}
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
              <SaspPage />
            </RotaPorPapel>
          }
        />
        <Route
          path="direcao/acompanhamento"
          element={
            <RotaPorPapel papeisPermitidos={['DIRETOR', 'ADMIN']}>
              <AcompanhamentoPage />
            </RotaPorPapel>
          }
        />

        {/* ALUNOS */}
        <Route
          path="alunos"
          element={
            <RotaPorPapel papeisPermitidos={['ALUNO', 'ADMIN']}>
              <Navigate to="/alunos/matriculas" replace />
            </RotaPorPapel>
          }
        />
        <Route
          path="alunos/matriculas"
          element={
            <RotaPorPapel papeisPermitidos={['ALUNO', 'ADMIN']}>
              <AlunoMatriculasPage />
            </RotaPorPapel>
          }
        />
        <Route
          path="alunos/progresso"
          element={
            <RotaPorPapel papeisPermitidos={['ALUNO', 'ADMIN']}>
              <AlunoProgressoPage />
            </RotaPorPapel>
          }
        />

        {/* PERFIL E CONFIG */}
        <Route path="perfil" element={<PerfilPage />} />
        <Route path="config" element={<ConfiguracoesPage />} />

        {/* CORINGA */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* CORINGA FORA */}
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
