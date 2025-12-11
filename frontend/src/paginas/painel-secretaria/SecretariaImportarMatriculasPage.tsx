// src/paginas/painel-secretaria/SecretariaImportarMatriculasPage.tsx

import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useNavigate } from 'react-router-dom';

import { useSupabase } from '../../contextos/SupabaseContext';
import { useNotificacaoContext } from '../../contextos/NotificacaoContext';

// IMPORTANTE: manter false no frontend (anon key não pode usar auth.admin).
// Quando for rodar um script de backend com service_role, pode reaproveitar a lógica.
const HABILITAR_CRIACAO_USUARIOS_AUTH = false;

// Tipo com TODAS as colunas relevantes do CSV (aluno.csv + PDF + campos gerados)
type MatriculaCsvRow = {
  id_aluno: string;
  id?: string;
  data_matricula?: string;
  num_inscricao_aluno?: string;
  num_am_aluno?: string;
  nome_aluno: string;
  nomeSocial_aluno?: string;
  num_cpf_aluno?: string;
  num_rg_aluno?: string;
  num_nis_aluno?: string;
  data_nasc_aluno?: string;
  nome_pai_aluno?: string;
  nome_mae_aluno?: string;
  logradouro_endereco_aluno?: string;
  numero_endereco_aluno?: string;
  bairro_endereco_aluno?: string;
  municipio_endereco_aluno?: string;
  nivel_escolar_aluno?: string;
  sexo_aluno?: string;
  raca_aluno?: string;
  foto_aluno?: string;
  facebook_aluno?: string;
  instagram_aluno?: string;
  email_aluno?: string;
  num_celular_aluno?: string;
  uso_transporte?: string;
  possui_necessidadeEspecial?: string;
  necessidadeEspecial_qual?: string;
  possui_restriAlimentar?: string;
  restriAlimentar_qual?: string;
  possui_programaSocial?: string;
  programaSocial_qual?: string;
  escola_origem?: string;
  situacao_aluno?: string;
  disciplinas_indicadas?: string;
  porque_voltouEstudos?: string;
  local_funcaoTrab?: string;
  repetiu_ano?: string;
  outras_escolasDesistiu?: string;
  porque_desistiu?: string;
  materias_dificeis?: string;
  quantidade_emCasa?: string;
  quem_saoParentes?: string;
  responsavel_estudos?: string;
  possui_filhos?: string;
  quantidade_filhos?: string;
  tomou_conhecimentoCeja?: string;
  observacao?: string;
  observacao_sasp?: string;
  marcar_aluno?: string;

  // campos derivados / novos
  id_nivel_ensino: string; // 1 = Fundamental, 2 = Médio
  turma_letra: string; // A–E
  id_turma: string;
  numero_inscricao: string;
  sige_id: string;
  ano_letivo: string;
  id_status_matricula: string;
  data_matricula_import?: string;
  tem_id_aluno?: string;

  // login / foto refinado
  cpf_raw?: string;
  cpf_numerico?: string;
  email_original?: string;
  email_final?: string;
  senha_inicial?: string;
};

type MatriculaInsert = {
  id_aluno: number;
  numero_inscricao: string;
  id_nivel_ensino: number;
  id_status_matricula: number;
  ano_letivo: number;
  data_matricula: string;
  id_turma: number;
};

type UsuarioCsvRow = {
  id_aluno: number;
  nome: string;
  email: string;
  senha: string;
  cpf?: string;
  foto_aluno?: string;
  data_nasc?: string;
  sexo?: string;
  raca?: string;
  celular?: string;
  logradouro?: string;
  numero_endereco?: string;
  bairro?: string;
  municipio?: string;
  facebook?: string;
  instagram?: string;
};

type AlunoUpsertRow = {
  id_aluno: number;
  nis?: string;
  nome_mae: string;
  nome_pai?: string;
  usa_transporte_escolar: boolean;
  possui_necessidade_especial: boolean;
  qual_necessidade_especial?: string;
  possui_restricao_alimentar: boolean;
  qual_restricao_alimentar?: string;
  possui_beneficio_governo: boolean;
  qual_beneficio_governo?: string;
  observacoes_gerais?: string;
};

type FormularioSaspRow = {
  id_aluno: number;
  data_entrevista: string;
  escola_origem?: string;
  cidade_escola_origem?: string | null;
  disciplinas_indicadas_aproveitamento?: string | null;
  motivo_retorno_estudos?: string | null;
  trabalha: boolean;
  local_trabalho?: string | null;
  funcao_trabalho?: string | null;
  repetiu_ano: boolean;
  desistiu_estudar: boolean;
  motivos_desistencia?: string | null;
  escolas_desistiu?: string | null;
  materias_dificuldade?: string | null;
  relacao_tecnologia?: string | null;
  curso_superior_desejado?: string | null;
  atividade_cultural_interesse?: string | null;
  esporte_interesse?: string | null;
  pessoas_residencia?: number | null;
  parentes_moradia?: string | null;
  responsavel_pelos_estudos?: string | null;
  tem_filhos: boolean;
  quantos_filhos?: number | null;
  como_conheceu_ceja?: string | null;
  observacoes_sasp?: string | null;
};

const CHUNK_SIZE_MATRICULAS = 200;
const CHUNK_SIZE_USUARIOS = 50;
const CHUNK_SIZE_SASP = 200;

const toBool = (v?: string): boolean => {
  if (!v) return false;
  const s = v.toString().trim().toLowerCase();
  return ['1', 'true', 'sim', 'yes', 's', 'y'].includes(s);
};

const toIntOrNull = (v?: string): number | null => {
  if (!v) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const normalizarData = (v?: string): string | null => {
  if (!v) return null;
  const s = v.trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
};

// Parser de CSV que respeita campos entre aspas e vírgulas dentro do texto
const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // Duas aspas seguidas dentro de campo: "" -> "
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);

  return result;
};

const SecretariaImportarMatriculasPage: React.FC = () => {
  const { supabase } = useSupabase();
  const { notificar } = useNotificacaoContext();
  const navigate = useNavigate();

  const [csvRows, setCsvRows] = useState<MatriculaCsvRow[]>([]);
  const [linhasValidas, setLinhasValidas] = useState<MatriculaInsert[]>([]);
  const [usuariosCsv, setUsuariosCsv] = useState<UsuarioCsvRow[]>([]);
  const [alunosUpsert, setAlunosUpsert] = useState<AlunoUpsertRow[]>([]);
  const [saspRows, setSaspRows] = useState<FormularioSaspRow[]>([]);
  const [carregandoCsv, setCarregandoCsv] = useState(false);
  const [importando, setImportando] = useState(false);
  const [somenteSimulacao, setSomenteSimulacao] = useState(true);
  const [erros, setErros] = useState<string[]>([]);

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    event,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setCarregandoCsv(true);
    setErros([]);
    setCsvRows([]);
    setLinhasValidas([]);
    setUsuariosCsv([]);
    setAlunosUpsert([]);
    setSaspRows([]);

    try {
      const text = await file.text();
      const rawLines = text.split(/\r?\n/);
      const linhas = rawLines.filter((l) => l.trim().length > 0);

      if (linhas.length < 2) {
        setErros(['Arquivo CSV vazio ou sem dados.']);
        return;
      }

      const headerCells = parseCsvLine(linhas[0]);
      const headers = headerCells.map((h) => h.trim());
      const dataLines = linhas.slice(1);

      const erroCols: string[] = [];
      const getIndex = (col: string, obrigatoria = true) => {
        const idx = headers.indexOf(col);
        if (idx === -1 && obrigatoria) {
          erroCols.push(`Coluna obrigatória "${col}" não encontrada no cabeçalho.`);
        }
        return idx;
      };

      // colunas mínimas para matrícula
      getIndex('id_aluno');
      getIndex('id_nivel_ensino');
      getIndex('id_turma');
      getIndex('numero_inscricao');
      getIndex('ano_letivo');
      getIndex('id_status_matricula');
      getIndex('data_matricula');

      // colunas de referência / exibição
      getIndex('nome_aluno', false);
      getIndex('turma_letra', false);

      // colunas para criação de usuário
      getIndex('email_final', false);
      getIndex('senha_inicial', false);
      getIndex('cpf_raw', false);
      getIndex('foto_aluno', false);

      if (erroCols.length > 0) {
        setErros(erroCols);
        return;
      }

      const rows: MatriculaCsvRow[] = [];
      const insertsMatriculas: MatriculaInsert[] = [];
      const errosLinha: string[] = [];
      const usuariosMap = new Map<number, UsuarioCsvRow>();
      const alunosMap = new Map<number, AlunoUpsertRow>();
      const alunosRawMap = new Map<number, MatriculaCsvRow>();

      dataLines.forEach((linha, i) => {
        const partes = parseCsvLine(linha);
        if (partes.length === 0) return;

        const raw: any = {};
        headers.forEach((h, idx) => {
          raw[h] = (partes[idx] ?? '').trim();
        });

        const temId = (raw.tem_id_aluno ?? '').toString().toLowerCase();
        if (temId === 'false' || temId === '0') {
          return;
        }

        if (!raw.id_aluno) {
          errosLinha.push(
            `Linha ${i + 2}: sem id_aluno (provavelmente aluno não encontrado na migração).`,
          );
          return;
        }

        const idAluno = Number(raw.id_aluno);
        const idNivel = Number(raw.id_nivel_ensino);
        const idTurma = Number(raw.id_turma);
        const anoLetivo = Number(raw.ano_letivo || '2025');
        const idStatus = Number(raw.id_status_matricula || 1);
        const numeroInscricao = String(
          raw.numero_inscricao || raw.num_inscricao_aluno || '',
        ).trim();
        const dataMatricula =
          normalizarData(raw.data_matricula) ||
          normalizarData(raw.data_matricula_import) ||
          `${anoLetivo || 2025}-01-01`;

        if (
          Number.isNaN(idAluno) ||
          Number.isNaN(idNivel) ||
          Number.isNaN(idTurma) ||
          Number.isNaN(anoLetivo) ||
          Number.isNaN(idStatus)
        ) {
          errosLinha.push(
            `Linha ${i + 2}: dados numéricos inválidos (id_aluno=${raw.id_aluno}, id_turma=${raw.id_turma}, ano_letivo=${raw.ano_letivo}).`,
          );
          return;
        }

        const fotoAluno = String(raw.foto_aluno || '').trim();
        const cpfRaw = String(raw.cpf_raw || raw.num_cpf_aluno || '').trim();
        const emailFinal = String(
          raw.email_final || raw.email_aluno || '',
        )
          .trim()
          .toLowerCase();
        const senhaInicialRaw = String(raw.senha_inicial || '').trim();
        const celular = String(raw.num_celular_aluno || '').trim();

        const rowObj: MatriculaCsvRow = {
          ...raw,
          id_aluno: raw.id_aluno,
          id_nivel_ensino: raw.id_nivel_ensino,
          turma_letra: raw.turma_letra,
          id_turma: raw.id_turma,
          numero_inscricao: numeroInscricao,
          sige_id: raw.sige_id,
          ano_letivo: String(anoLetivo),
          id_status_matricula: String(idStatus),
          data_matricula: dataMatricula,
          foto_aluno: fotoAluno,
          cpf_raw: cpfRaw,
          email_final: emailFinal,
          senha_inicial: senhaInicialRaw,
        };

        rows.push(rowObj);

        insertsMatriculas.push({
          id_aluno: idAluno,
          id_nivel_ensino: idNivel,
          id_turma: idTurma,
          numero_inscricao: numeroInscricao,
          ano_letivo: anoLetivo,
          id_status_matricula: idStatus,
          data_matricula: dataMatricula!,
        });

        if (!alunosRawMap.has(idAluno)) {
          alunosRawMap.set(idAluno, rowObj);
        }

        const usaTransporte = toBool(raw.uso_transporte);
        const possuiNecEsp = toBool(raw.possui_necessidadeEspecial);
        const possuiRestAli = toBool(raw.possui_restriAlimentar);
        const possuiProgSoc = toBool(raw.possui_programaSocial);

        if (!alunosMap.has(idAluno)) {
          const alunoUp: AlunoUpsertRow = {
            id_aluno: idAluno,
            nis: raw.num_nis_aluno || undefined,
            nome_mae: raw.nome_mae_aluno || 'Não informado',
            nome_pai: raw.nome_pai_aluno || undefined,
            usa_transporte_escolar: usaTransporte,
            possui_necessidade_especial: possuiNecEsp,
            qual_necessidade_especial: raw.necessidadeEspecial_qual || undefined,
            possui_restricao_alimentar: possuiRestAli,
            qual_restricao_alimentar: raw.restriAlimentar_qual || undefined,
            possui_beneficio_governo: possuiProgSoc,
            qual_beneficio_governo: raw.programaSocial_qual || undefined,
            observacoes_gerais: raw.observacao || undefined,
          };
          alunosMap.set(idAluno, alunoUp);
        }

        let senhaParaUsuario = senhaInicialRaw;
        if (!senhaParaUsuario && emailFinal) {
          const base =
            numeroInscricao || String(raw.sige_id || '') || String(raw.id_aluno || '');
          if (base) {
            senhaParaUsuario = `${base}@ceja`;
            errosLinha.push(
              `Linha ${i + 2}: aluno "${raw.nome_aluno}" está sem senha_inicial (CPF). Será usada a senha gerada "${senhaParaUsuario}".`,
            );
          } else {
            errosLinha.push(
              `Linha ${i + 2}: aluno "${raw.nome_aluno}" tem email_final mas está sem senha_inicial e sem número de matrícula/SIGE. Usuário de login não será criado automaticamente.`,
            );
          }
        }

        if (emailFinal && senhaParaUsuario && !usuariosMap.has(idAluno)) {
          const nomeAluno = String(raw.nome_aluno || '').trim();
          usuariosMap.set(idAluno, {
            id_aluno: idAluno,
            nome: nomeAluno || `Aluno ${idAluno}`,
            email: emailFinal,
            senha: senhaParaUsuario,
            cpf: cpfRaw || undefined,
            foto_aluno: fotoAluno || undefined,
            data_nasc: normalizarData(raw.data_nasc_aluno) || undefined,
            sexo: raw.sexo_aluno || undefined,
            raca: raw.raca_aluno || undefined,
            celular: celular || undefined,
            logradouro: raw.logradouro_endereco_aluno || undefined,
            numero_endereco: raw.numero_endereco_aluno || undefined,
            bairro: raw.bairro_endereco_aluno || undefined,
            municipio: raw.municipio_endereco_aluno || undefined,
            facebook: raw.facebook_aluno || undefined,
            instagram: raw.instagram_aluno || undefined,
          });
        }
      });

      const saspMap = new Map<number, FormularioSaspRow>();
      alunosRawMap.forEach((row, idAluno) => {
        const dataEnt =
          normalizarData(row.data_matricula) ||
          normalizarData(row.data_matricula_import) ||
          `${row.ano_letivo || '2025'}-01-01`;

        const trabalha = !!row.local_funcaoTrab && row.local_funcaoTrab.trim() !== '';
        const repetiu = toBool(row.repetiu_ano);
        const temFilhos = toBool(row.possui_filhos);
        const desistiu = row.porque_desistiu || row.outras_escolasDesistiu ? true : false;

        const extraObs: string[] = [];
        if (row.situacao_aluno) {
          extraObs.push(`Situação aluno (origem): ${row.situacao_aluno}`);
        }
        if (row.marcar_aluno) {
          extraObs.push(`Marcar aluno: ${row.marcar_aluno}`);
        }
        if (row.num_am_aluno) {
          extraObs.push(`Número AM aluno: ${row.num_am_aluno}`);
        }

        const observacoesSasp = [
          row.observacao_sasp || '',
          extraObs.join(' | '),
        ]
          .filter(Boolean)
          .join(' | ');

        const sasp: FormularioSaspRow = {
          id_aluno: idAluno,
          data_entrevista: dataEnt!,
          escola_origem: row.escola_origem || undefined,
          cidade_escola_origem: null,
          disciplinas_indicadas_aproveitamento:
            row.disciplinas_indicadas || null,
          motivo_retorno_estudos: row.porque_voltouEstudos || null,
          trabalha,
          local_trabalho: row.local_funcaoTrab || null,
          funcao_trabalho: null,
          repetiu_ano: repetiu,
          desistiu_estudar: desistiu,
          motivos_desistencia: row.porque_desistiu || null,
          escolas_desistiu: row.outras_escolasDesistiu || null,
          materias_dificuldade: row.materias_dificeis || null,
          relacao_tecnologia: null,
          curso_superior_desejado: null,
          atividade_cultural_interesse: null,
          esporte_interesse: null,
          pessoas_residencia: toIntOrNull(row.quantidade_emCasa),
          parentes_moradia: row.quem_saoParentes || null,
          responsavel_pelos_estudos: row.responsavel_estudos || null,
          tem_filhos: temFilhos,
          quantos_filhos: toIntOrNull(row.quantidade_filhos),
          como_conheceu_ceja: row.tomou_conhecimentoCeja || null,
          observacoes_sasp: observacoesSasp || null,
        };

        saspMap.set(idAluno, sasp);
      });

      setCsvRows(rows);
      setLinhasValidas(insertsMatriculas);
      setUsuariosCsv(Array.from(usuariosMap.values()));
      setAlunosUpsert(Array.from(alunosMap.values()));
      setSaspRows(Array.from(saspMap.values()));

      if (errosLinha.length > 0) {
        setErros(errosLinha);
      }

      notificar({
        tipo: 'info',
        mensagem: `Arquivo lido com sucesso: ${insertsMatriculas.length} matrículas prontas para importação. Alunos únicos: ${
          alunosMap.size
        }. Usuários com dados de login: ${usuariosMap.size}.`,
      });
    } catch (error: any) {
      console.error(error);
      setErros([`Erro ao ler arquivo: ${error?.message || String(error)}`]);
      notificar({
        tipo: 'erro',
        mensagem: 'Falha ao ler o arquivo CSV de matrículas.',
      });
    } finally {
      setCarregandoCsv(false);
    }
  };

  const resumoPorNivel = useMemo(() => {
    let fundamental = 0;
    let medio = 0;

    linhasValidas.forEach((l) => {
      if (l.id_nivel_ensino === 1) fundamental += 1;
      if (l.id_nivel_ensino === 2) medio += 1;
    });

    return { fundamental, medio };
  }, [linhasValidas]);

  const resumoPorTurma = useMemo(() => {
    const mapa = new Map<string, number>();
    csvRows.forEach((row) => {
      const chave = `${row.id_nivel_ensino}-${row.turma_letra}`;
      mapa.set(chave, (mapa.get(chave) || 0) + 1);
    });

    const itens: { chave: string; nivel: string; turma: string; total: number }[] =
      [];
    mapa.forEach((total, key) => {
      const [nivelStr, letra] = key.split('-');
      const nivelId = Number(nivelStr);
      const nivel =
        nivelId === 1
          ? 'Fundamental'
          : nivelId === 2
          ? 'Médio'
          : `Nível ${nivelId}`;
      itens.push({ chave: key, nivel, turma: letra, total });
    });

    itens.sort((a, b) =>
      a.nivel === b.nivel
        ? a.turma.localeCompare(b.turma)
        : a.nivel.localeCompare(b.nivel),
    );

    return itens;
  }, [csvRows]);

  const totalUsuariosParaCriar = useMemo(
    () => usuariosCsv.length,
    [usuariosCsv],
  );

  const totalAlunosParaUpsert = useMemo(
    () => alunosUpsert.length,
    [alunosUpsert],
  );

  const totalSaspParaInserir = useMemo(
    () => saspRows.length,
    [saspRows],
  );

  const handleImportar = async () => {
    if (!supabase) {
      notificar({
        tipo: 'erro',
        mensagem: 'Cliente Supabase não encontrado no contexto.',
      });
      return;
    }

    if (linhasValidas.length === 0) {
      notificar({
        tipo: 'aviso',
        mensagem: 'Nenhuma linha válida para importar.',
      });
      return;
    }

    if (somenteSimulacao) {
      notificar({
        tipo: 'info',
        mensagem: `Simulação: seriam inseridas ${linhasValidas.length} matrículas, atualização de ${totalAlunosParaUpsert} alunos na tabela 'alunos', inserção de até ${totalSaspParaInserir} registros em 'formulario_sasp' e criação de até ${totalUsuariosParaCriar} usuários de login (se habilitado no backend).`,
      });
      return;
    }

    setImportando(true);
    setErros([]);

    const errosAcumulados: string[] = [];
    let usuariosCriados = 0;

    try {
      // 0. Atualizar ALUNOS (sem mexer em id_aluno, que é identity)
      if (alunosUpsert.length > 0) {
        for (const a of alunosUpsert) {
          const { id_aluno, ...resto } = a;

          const { error: erroUpdateAluno } = await supabase
            .from('alunos')
            .update(resto)
            .eq('id_aluno', id_aluno);

          if (erroUpdateAluno) {
            errosAcumulados.push(
              `Falha ao atualizar dados do aluno id_aluno=${id_aluno} na tabela 'alunos': ${erroUpdateAluno.message}`,
            );
          }
        }
      }

      // 1. Criação de usuários de login (DISPARO OPCIONAL)
      if (usuariosCsv.length > 0 && HABILITAR_CRIACAO_USUARIOS_AUTH) {
        const adminAuth = (supabase as any).auth?.admin;

        if (!adminAuth || typeof adminAuth.createUser !== 'function') {
          errosAcumulados.push(
            'O cliente Supabase atual não possui acesso a supabase.auth.admin.createUser. Verifique se está usando a service_role key em ambiente seguro.',
          );
        } else {
          const idsAlunos = Array.from(
            new Set(usuariosCsv.map((u) => u.id_aluno)),
          );

          let idsSemUsuario = new Set<number>(idsAlunos);

          const { data: alunosExistentes, error: erroAlunos } = await supabase
            .from('alunos')
            .select('id_aluno, user_id')
            .in('id_aluno', idsAlunos);

          if (erroAlunos) {
            errosAcumulados.push(
              `Falha ao consultar tabela 'alunos' para checar usuários já existentes: ${erroAlunos.message}`,
            );
          } else if (alunosExistentes && alunosExistentes.length > 0) {
            const idsQueJaTemUsuario = new Set<number>(
              alunosExistentes
                .filter((a: any) => a.user_id)
                .map((a: any) => Number(a.id_aluno)),
            );
            idsSemUsuario = new Set(
              idsAlunos.filter((id) => !idsQueJaTemUsuario.has(id)),
            );
          }

          const candidatos = usuariosCsv.filter((u) =>
            idsSemUsuario.has(u.id_aluno),
          );

          if (candidatos.length > 0) {
            const emailsCandidatos = candidatos.map((u) => u.email);
            const { data: usuariosExistentes, error: erroUsuariosExistentes } =
              await supabase
                .from('usuarios')
                .select('id, email')
                .in('email', emailsCandidatos);

            const emailsJaCadastrados = new Set<string>();
            if (!erroUsuariosExistentes && usuariosExistentes) {
              usuariosExistentes.forEach((u: any) => {
                if (u.email) {
                  emailsJaCadastrados.add(String(u.email).toLowerCase());
                }
              });
            }

            const usuariosParaCriar = candidatos.filter(
              (u) => !emailsJaCadastrados.has(u.email.toLowerCase()),
            );

            for (let i = 0; i < usuariosParaCriar.length; i += CHUNK_SIZE_USUARIOS) {
              const chunk = usuariosParaCriar.slice(i, i + CHUNK_SIZE_USUARIOS);

              for (const u of chunk) {
                try {
                  const { data, error } = await adminAuth.createUser({
                    email: u.email,
                    password: u.senha,
                    email_confirm: true,
                    user_metadata: {
                      nome: u.nome,
                      origem: 'importacao_matriculas_2025',
                    },
                  });

                  if (error || !data?.user) {
                    errosAcumulados.push(
                      `Falha ao criar usuário Auth para aluno ${u.nome} (${u.email}): ${
                        error?.message ?? 'sem detalhes'
                      }`,
                    );
                    continue;
                  }

                  const authUserId = data.user.id;

                  const { error: erroInsertUsuario } = await supabase
                    .from('usuarios')
                    .insert({
                      id: authUserId,
                      id_tipo_usuario: 5,
                      name: u.nome,
                      email: u.email,
                      cpf: u.cpf ?? null,
                      data_nascimento: u.data_nasc ?? null,
                      sexo: u.sexo ?? null,
                      raca: u.raca ?? null,
                      celular: u.celular ?? null,
                      logradouro: u.logradouro ?? null,
                      numero_endereco: u.numero_endereco ?? null,
                      bairro: u.bairro ?? null,
                      municipio: u.municipio ?? null,
                      facebook_url: u.facebook ?? null,
                      instagram_url: u.instagram ?? null,
                      foto_url: u.foto_aluno ?? null,
                    });

                  if (erroInsertUsuario) {
                    errosAcumulados.push(
                      `Usuário Auth criado (${u.email}), mas falhou ao inserir em public.usuarios: ${erroInsertUsuario.message}`,
                    );
                  }

                  const { error: erroUpdateAluno } = await supabase
                    .from('alunos')
                    .update({ user_id: authUserId })
                    .eq('id_aluno', u.id_aluno);

                  if (erroUpdateAluno) {
                    errosAcumulados.push(
                      `Usuário criado para ${u.email}, mas não foi possível atualizar alunos.id_aluno=${u.id_aluno}: ${erroUpdateAluno.message}`,
                    );
                  }

                  usuariosCriados += 1;
                } catch (err: any) {
                  errosAcumulados.push(
                    `Erro inesperado ao criar usuário para ${u.email}: ${
                      err?.message || String(err)
                    }`,
                  );
                }
              }
            }
          }
        }
      } else if (usuariosCsv.length > 0 && !HABILITAR_CRIACAO_USUARIOS_AUTH) {
        errosAcumulados.push(
          `Foram detectados ${usuariosCsv.length} alunos com dados de login (email_final/senha), ` +
            `mas a criação de usuários Auth está desabilitada no frontend (requer service_role). ` +
            `Execute um script de backend com a mesma planilha para criar esses logins em segurança.`,
        );
      }

      // 2. Inserir FORMULARIO_SASP (um por aluno, se ainda não existir)
      if (saspRows.length > 0) {
        const idsAlunosSasp = Array.from(
          new Set(saspRows.map((s) => s.id_aluno)),
        );

        const { data: saspExistentes, error: erroSaspExistentes } = await supabase
          .from('formulario_sasp')
          .select('id_aluno')
          .in('id_aluno', idsAlunosSasp);

        const idsJaTemSasp = new Set<number>();
        if (!erroSaspExistentes && saspExistentes) {
          saspExistentes.forEach((s: any) => {
            idsJaTemSasp.add(Number(s.id_aluno));
          });
        }

        const saspParaInserir = saspRows.filter(
          (s) => !idsJaTemSasp.has(s.id_aluno),
        );

        for (let i = 0; i < saspParaInserir.length; i += CHUNK_SIZE_SASP) {
          const chunk = saspParaInserir.slice(i, i + CHUNK_SIZE_SASP);
          const { error: erroInsertSasp } = await supabase
            .from('formulario_sasp')
            .insert(chunk);
          if (erroInsertSasp) {
            errosAcumulados.push(
              `Falha ao inserir parte dos formulários SASP: ${erroInsertSasp.message}`,
            );
            break;
          }
        }
      }

      // 3. Inserir MATRÍCULAS
      for (let i = 0; i < linhasValidas.length; i += CHUNK_SIZE_MATRICULAS) {
        const chunk = linhasValidas.slice(i, i + CHUNK_SIZE_MATRICULAS);
        const { error } = await supabase.from('matriculas').insert(chunk);
        if (error) {
          throw error;
        }
      }

      const partesMensagem: string[] = [
        `Importação concluída: ${linhasValidas.length} matrículas criadas.`,
        `Alunos atualizados na tabela 'alunos': ${totalAlunosParaUpsert}.`,
        `Formulários SASP inseridos (novos): até ${totalSaspParaInserir}.`,
      ];
      if (usuariosCsv.length > 0) {
        partesMensagem.push(
          HABILITAR_CRIACAO_USUARIOS_AUTH
            ? `Usuários de aluno criados: ${usuariosCriados} (veja avisos abaixo para senhas geradas ou erros).`
            : `Usuários de aluno NÃO foram criados pelo frontend (veja aviso abaixo sobre service_role/script backend).`,
        );
      }

      notificar({
        tipo: 'sucesso',
        mensagem: partesMensagem.join(' '),
      });

      if (errosAcumulados.length > 0) {
        setErros((prev) => [...prev, ...errosAcumulados]);
      }

      navigate('/secretaria/matriculas');
    } catch (error: any) {
      console.error(error);
      setErros((prev) => [
        ...prev,
        `Erro ao importar tudo (alunos, SASP e matrículas): ${
          error?.message || String(error)
        }`,
      ]);
      notificar({
        tipo: 'erro',
        mensagem:
          'Falha ao importar. Veja os detalhes dos erros na parte inferior da página.',
      });
    } finally {
      setImportando(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Importar matrículas + alunos + SASP
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Esta página importa em lote:
        <br />
        • Atualização dos dados de aluno na tabela <code>alunos</code> (NIS, mãe/pai,
        transporte, necessidades, benefícios, observações);
        <br />
        • Questionário completo em <code>formulario_sasp</code>;
        <br />
        • Matrículas 2025 em <code>matriculas</code> com a turma vinda dos PDFs.
        <br />
        • Opcionalmente, criação de usuários de login (Auth + <code>usuarios</code>)
        usando <code>email_final</code> e <code>senha_inicial</code> ou{' '}
        <code>{'<numero_inscricao>@ceja'}</code> quando o CPF não estiver disponível
        (essa parte exige service_role e está desabilitada no frontend por segurança).
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              component="label"
            >
              Selecionar arquivo CSV
              <input
                type="file"
                hidden
                accept=".csv,text/csv"
                onChange={handleFileChange}
              />
            </Button>

            {carregandoCsv && (
              <Box sx={{ flex: 1 }}>
                <LinearProgress />
              </Box>
            )}
          </Stack>

          <Typography variant="body2" color="text.secondary">
            Use o arquivo <strong>matriculas_import_2025_full_import.csv</strong>{' '}
            (aluno.csv + PDFs + colunas de usuário/senha/foto) que geramos para
            essa etapa.
          </Typography>
        </Stack>
      </Paper>

      {linhasValidas.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumo do que será importado
          </Typography>

          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography variant="body2">
              Matrículas (linhas válidas):{' '}
              <strong>{linhasValidas.length}</strong>
            </Typography>
            <Typography variant="body2">
              Fundamental:{' '}
              <strong>{resumoPorNivel.fundamental}</strong> | Médio:{' '}
              <strong>{resumoPorNivel.medio}</strong>
            </Typography>
            <Typography variant="body2">
              Alunos únicos (para atualizar em <code>alunos</code>):{' '}
              <strong>{totalAlunosParaUpsert}</strong>
            </Typography>
            <Typography variant="body2">
              Formulários SASP (um por aluno):{' '}
              <strong>{totalSaspParaInserir}</strong>
            </Typography>
            <Typography variant="body2">
              Alunos com dados para criar usuário de login:{' '}
              <strong>{totalUsuariosParaCriar}</strong>
            </Typography>
          </Stack>

          {resumoPorTurma.length > 0 && (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Por turma:
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nível</TableCell>
                    <TableCell>Turma</TableCell>
                    <TableCell align="right">Qtde de matrículas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resumoPorTurma.map((t) => (
                    <TableRow key={t.chave}>
                      <TableCell>{t.nivel}</TableCell>
                      <TableCell>{t.turma}</TableCell>
                      <TableCell align="right">{t.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Checkbox
                checked={somenteSimulacao}
                onChange={(e) => setSomenteSimulacao(e.target.checked)}
              />
              <Typography variant="body2">
                Somente simular (não gravar no banco)
              </Typography>
            </Stack>

            <Button
              variant="contained"
              color={somenteSimulacao ? 'warning' : 'primary'}
              startIcon={
                somenteSimulacao ? <WarningAmberIcon /> : <DoneAllIcon />
              }
              disabled={importando}
              onClick={handleImportar}
            >
              {somenteSimulacao
                ? 'Simular importação'
                : `Importar tudo (${linhasValidas.length} matrículas)`}
            </Button>
          </Stack>

          {importando && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary">
                Importando alunos, SASP e matrículas no Supabase...
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {csvRows.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Amostra das primeiras linhas do arquivo
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>id_aluno</TableCell>
                <TableCell>Nome</TableCell>
                <TableCell>Turma</TableCell>
                <TableCell>Nível</TableCell>
                <TableCell>Nº inscrição</TableCell>
                <TableCell>Email final</TableCell>
                <TableCell>Foto (arquivo)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {csvRows.slice(0, 15).map((row, index) => (
                <TableRow key={`${row.id_aluno}-${index}`}>
                  <TableCell>{row.id_aluno}</TableCell>
                  <TableCell>{row.nome_aluno}</TableCell>
                  <TableCell>{row.turma_letra}</TableCell>
                  <TableCell>
                    {row.id_nivel_ensino === '1'
                      ? 'Fundamental'
                      : row.id_nivel_ensino === '2'
                      ? 'Médio'
                      : row.id_nivel_ensino}
                  </TableCell>
                  <TableCell>{row.numero_inscricao}</TableCell>
                  <TableCell>{row.email_final}</TableCell>
                  <TableCell>{row.foto_aluno}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {erros.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 3,
            borderColor: 'error.main',
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        >
          <Typography variant="subtitle1" color="error" gutterBottom>
            Avisos / Erros encontrados
          </Typography>
          <Stack spacing={0.5}>
            {erros.map((e, i) => (
              <Typography key={i} variant="body2" color="error">
                • {e}
              </Typography>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default SecretariaImportarMatriculasPage;
