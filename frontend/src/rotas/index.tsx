import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { RootLayout } from '../layouts/RootLayout'
import { LoginPage } from '../paginas/Autenticacao/LoginPage'
import { NovaSenhaPage } from '../paginas/Autenticacao/NovaSenhaPage'

import { DashboardPage } from '../paginas/painel-administracao/DashboardPage'
import { PaginaSimples } from '../paginas/PaginaSimples'
import PerfilPage from '../paginas/Perfil/PerfilPage'
import ConfiguracoesPage from '../paginas/Configuracoes/ConfiguracoesPage'

import AlunoMatriculasPage from '../paginas/painel-aluno/AlunoMatriculasPage'
import AlunoProgressoPage from '../paginas/painel-aluno/AlunoProgressoPage'
import AlunoInicioPage from '../paginas/painel-aluno/AlunoInicioPage'

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
import SecretariaPontoMensalPage from '../paginas/painel-secretaria/SecretariaPontoMensalPage'

import ProfessorAtendimentosPage from '../paginas/painel-professor/ProfessorAtendimentosPage'
import AcompanhamentoPage from '../paginas/painel-professor/AcompanhamentoPage'
import FichaAcompanhamentoPage from '../paginas/painel-professor/FichaAcompanhamentoPage'

import SaspPage from '../paginas/painel-coordenacao/SaspPage'

import PontoFuncionarioPage from '../paginas/ponto/PontoFuncionarioPage'

import { useAuth } from '../contextos/AuthContext'
import { RotaPorPapel } from '../componentes/navegacao/RotaPorPapel'

export const AppRoutes: React.FC = () => {
  const { usuario, carregando } = useAuth() as {
    usuario: { papel?: string } | null
    carregando?: boolean
  }

  const autenticado = !!usuario

  if (carregando) {
    return <PaginaSimples titulo="Carregando sessão, aguarde..." />
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={autenticado ? <Navigate to="/" replace /> : <LoginPage />}
      />

      <Route path="/nova-senha" element={<NovaSenhaPage />} />

      <Route
        path="/"
        element={autenticado ? <RootLayout /> : <Navigate to="/login" replace />}
      >
        <Route index element={<DashboardPage />} />

        <Route
          path="secretaria"
          element={
            <RotaPorPapel
              papeisPermitidos={['SECRETARIA', 'ADMIN', 'COORDENACAO', 'DIRETOR']}
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
          <Route
            path="ponto-mensal"
            element={
              <RotaPorPapel papeisPermitidos={['SECRETARIA', 'DIRETOR', 'ADMIN']}>
                <SecretariaPontoMensalPage />
              </RotaPorPapel>
            }
          />
        </Route>

        <Route
          path="ponto"
          element={
            <RotaPorPapel
              papeisPermitidos={[
                'PROFESSOR',
                'SECRETARIA',
                'COORDENACAO',
                'DIRETOR',
                'ADMIN',
                'AVALIADOR',
              ]}
            >
              <PontoFuncionarioPage />
            </RotaPorPapel>
          }
        />

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

        <Route
          path="coordenacao"
          element={
            <RotaPorPapel papeisPermitidos={['COORDENACAO', 'DIRETOR', 'ADMIN']}>
              <DashboardPage />
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

        <Route
          path="direcao"
          element={
            <RotaPorPapel papeisPermitidos={['DIRETOR', 'ADMIN']}>
              <DashboardPage />
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

        <Route
          path="alunos"
          element={
            <RotaPorPapel papeisPermitidos={['ALUNO', 'ADMIN']}>
              <AlunoInicioPage />
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

        <Route path="perfil" element={<PerfilPage />} />
        <Route path="config" element={<ConfiguracoesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      <Route
        path="*"
        element={
          autenticado ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

export default AppRoutes
