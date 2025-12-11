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


type MatriculaCsvRow = {
  id_aluno: string;
  nome_aluno_pdf: string;
  data_nasc_pdf: string;
  nome_aluno_sistema: string;
  data_nasc_sistema: string;
  id_nivel_ensino: string;
  turma_letra: string;
  id_turma: string;
  numero_inscricao: string;
  sige_id: string;
  ano_letivo: string;
  id_status_matricula: string;
  data_matricula: string;
  tem_id_aluno?: string;
  foto_aluno?: string;
  cpf_raw?: string;
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
};

const CHUNK_SIZE_MATRICULAS = 200; // blocos de inserção na tabela matriculas
const CHUNK_SIZE_USUARIOS = 50; // blocos para criação de usuários Auth

const SecretariaImportarMatriculasPage: React.FC = () => {
  const { supabase } = useSupabase();
  const { notificar } = useNotificacaoContext();
  const navigate = useNavigate();

  const [csvRows, setCsvRows] = useState<MatriculaCsvRow[]>([]);
  const [linhasValidas, setLinhasValidas] = useState<MatriculaInsert[]>([]);
  const [usuariosCsv, setUsuariosCsv] = useState<UsuarioCsvRow[]>([]);
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

    try {
      const text = await file.text();
      const linhas = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (linhas.length < 2) {
        setErros(['Arquivo CSV vazio ou sem dados.']);
        return;
      }

      const [headerLine, ...dataLines] = linhas;
      const headers = headerLine.split(',').map((h) => h.trim());

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
      getIndex('nome_aluno_pdf', false);
      getIndex('turma_letra', false);

      // colunas para criação de usuário
      getIndex('foto_aluno', false);
      getIndex('cpf_raw', false);
      getIndex('email_final', false);
      getIndex('senha_inicial', false);

      if (erroCols.length > 0) {
        setErros(erroCols);
        return;
      }

      const rows: MatriculaCsvRow[] = [];
      const inserts: MatriculaInsert[] = [];
      const errosLinha: string[] = [];
      const usuariosMap = new Map<number, UsuarioCsvRow>();

      dataLines.forEach((linha, i) => {
        const partes = linha.split(',');
        if (partes.length < headers.length) {
          // linha quebrada → ignora
          return;
        }

        const raw: any = {};
        headers.forEach((h, idx) => {
          raw[h] = (partes[idx] ?? '').trim();
        });

        // ignora linhas onde não achou o aluno no processo de migração (tem_id_aluno = False)
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
        const anoLetivo = Number(raw.ano_letivo);
        const idStatus = Number(raw.id_status_matricula || 1);
        const numeroInscricao = String(raw.numero_inscricao || '').trim();
        const dataMatricula = String(
          raw.data_matricula || `${anoLetivo || 2025}-01-01`,
        ).trim();

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
        const cpfRaw = String(raw.cpf_raw || '').trim();
        const emailFinal = String(raw.email_final || '').trim().toLowerCase();
        const senhaInicial = String(raw.senha_inicial || '').trim();

        rows.push({
          id_aluno: raw.id_aluno,
          nome_aluno_pdf: raw.nome_aluno_pdf,
          data_nasc_pdf: raw.data_nasc_pdf,
          nome_aluno_sistema: raw.nome_aluno_sistema,
          data_nasc_sistema: raw.data_nasc_sistema,
          id_nivel_ensino: raw.id_nivel_ensino,
          turma_letra: raw.turma_letra,
          id_turma: raw.id_turma,
          numero_inscricao: raw.numero_inscricao,
          sige_id: raw.sige_id,
          ano_letivo: raw.ano_letivo,
          id_status_matricula: raw.id_status_matricula,
          data_matricula: raw.data_matricula,
          tem_id_aluno: raw.tem_id_aluno,
          foto_aluno: fotoAluno,
          cpf_raw: cpfRaw,
          email_final: emailFinal,
          senha_inicial: senhaInicial,
        });

        inserts.push({
          id_aluno: idAluno,
          id_nivel_ensino: idNivel,
          id_turma: idTurma,
          numero_inscricao: numeroInscricao,
          ano_letivo: anoLetivo,
          id_status_matricula: idStatus,
          data_matricula: dataMatricula,
        });

        // Preparar dados para criação de usuário (se tiver email e senha)
        if (emailFinal && senhaInicial && !usuariosMap.has(idAluno)) {
          const nomeAluno =
            String(raw.nome_aluno_sistema || raw.nome_aluno_pdf || '').trim();

          usuariosMap.set(idAluno, {
            id_aluno: idAluno,
            nome: nomeAluno || `Aluno ${idAluno}`,
            email: emailFinal,
            senha: senhaInicial,
            cpf: cpfRaw || undefined,
            foto_aluno: fotoAluno || undefined,
          });
        }

        if (emailFinal && !senhaInicial) {
          errosLinha.push(
            `Linha ${i + 2}: aluno "${raw.nome_aluno_sistema || raw.nome_aluno_pdf}" tem email_final mas está sem senha_inicial (CPF). Usuário de login não será criado automaticamente.`,
          );
        }
      });

      setCsvRows(rows);
      setLinhasValidas(inserts);
      setUsuariosCsv(Array.from(usuariosMap.values()));

      if (errosLinha.length > 0) {
        setErros(errosLinha);
      }

      notificar({
        tipo: 'info',
        mensagem: `Arquivo lido com sucesso: ${inserts.length} matrículas prontas para importação. Alunos com dados para criar usuário: ${usuariosMap.size}.`,
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
        mensagem: `Simulação: seriam inseridas ${linhasValidas.length} matrículas e, se o client tiver permissão, criados até ${totalUsuariosParaCriar} usuários de aluno (um por id_aluno com email/senha).`,
      });
      return;
    }

    setImportando(true);
    setErros([]);

    const errosAcumulados: string[] = [];
    let usuariosCriados = 0;

    try {
      // 1. Criação de usuários de login (se possível)
      if (usuariosCsv.length > 0) {
        const adminAuth = (supabase as any).auth?.admin;

        if (!adminAuth || typeof adminAuth.createUser !== 'function') {
          errosAcumulados.push(
            'Este cliente Supabase não possui acesso a supabase.auth.admin. As matrículas serão importadas normalmente, mas a criação automática de usuários de login NÃO será executada. Execute essa etapa em um backend com chave service_role ou função Edge.',
          );
        } else {
          // Descobrir quais alunos já têm user_id vinculado (se a tabela estiver populada)
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
            // Também filtrar por email já existente na tabela usuarios
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

                  // Inserir em public.usuarios
                  const { error: erroInsertUsuario } = await supabase
                    .from('usuarios')
                    .insert({
                      id: authUserId,
                      id_tipo_usuario: 5, // Aluno
                      name: u.nome,
                      email: u.email,
                      cpf: u.cpf ?? null,
                      foto_url: u.foto_aluno ?? null,
                    });

                  if (erroInsertUsuario) {
                    errosAcumulados.push(
                      `Usuário Auth criado (${u.email}), mas falhou ao inserir em public.usuarios: ${erroInsertUsuario.message}`,
                    );
                  }

                  // Atualizar alunos.user_id
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
      }

      // 2. Inserir matrículas
      for (let i = 0; i < linhasValidas.length; i += CHUNK_SIZE_MATRICULAS) {
        const chunk = linhasValidas.slice(i, i + CHUNK_SIZE_MATRICULAS);
        const { error } = await supabase.from('matriculas').insert(chunk);
        if (error) {
          throw error;
        }
      }

      const partesMensagem: string[] = [
        `Importação concluída: ${linhasValidas.length} matrículas criadas.`,
      ];
      if (usuariosCsv.length > 0) {
        partesMensagem.push(
          `Usuários de aluno criados: ${usuariosCriados} (veja avisos abaixo para possíveis duplicidades/erros).`,
        );
      }

      notificar({
        tipo: 'sucesso',
        mensagem: partesMensagem.join(' '),
      });

      if (errosAcumulados.length > 0) {
        setErros(errosAcumulados);
      }

      navigate('/secretaria/matriculas');
    } catch (error: any) {
      console.error(error);
      setErros((prev) => [
        ...prev,
        `Erro ao importar matrículas e/ou criar usuários: ${
          error?.message || String(error)
        }`,
      ]);
      notificar({
        tipo: 'erro',
        mensagem:
          'Falha ao importar matrículas e/ou criar usuários. Verifique os detalhes na tela.',
      });
    } finally {
      setImportando(false);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Importar matrículas
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Página temporária para importar em lote as matrículas de 2025 a partir
        do arquivo CSV gerado dos relatórios do SIGE. Somente serão importadas
        as linhas que já possuem aluno correspondente na migração
        (<code>tem_id_aluno = True</code>). Opcionalmente, também cria os
        usuários de login dos alunos (Auth + tabela&nbsp;
        <code>public.usuarios</code>) usando as colunas{' '}
        <code>email_final</code> e <code>senha_inicial</code>.
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
            Use o arquivo{' '}
            <strong>matriculas_import_2025_completo_fotos_usuarios.csv</strong>{' '}
            (colunas: id_aluno, id_nivel_ensino, id_turma, numero_inscricao,
            ano_letivo, id_status_matricula, data_matricula, tem_id_aluno,
            foto_aluno, cpf_raw, email_final, senha_inicial, etc.).
          </Typography>
        </Stack>
      </Paper>

      {linhasValidas.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Resumo das matrículas prontas para importar
          </Typography>

          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography variant="body2">
              Linhas válidas (com aluno encontrado):{' '}
              <strong>{linhasValidas.length}</strong>
            </Typography>
            <Typography variant="body2">
              Fundamental: <strong>{resumoPorNivel.fundamental}</strong> | Médio:{' '}
              <strong>{resumoPorNivel.medio}</strong>
            </Typography>
            <Typography variant="body2">
              Alunos com dados para criar usuário de login (id_aluno único com
              email_final + senha_inicial):{' '}
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
                : `Importar ${linhasValidas.length} matrículas`}
            </Button>
          </Stack>

          {importando && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress />
              <Typography variant="body2" color="text.secondary">
                Importando matrículas (e criando usuários, se possível) no
                Supabase...
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
                <TableCell>Nome (PDF)</TableCell>
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
                  <TableCell>{row.nome_aluno_pdf}</TableCell>
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
