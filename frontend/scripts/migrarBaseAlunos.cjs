// scripts/migrarBaseAlunos.cjs

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const dotenv = require('dotenv');

// carrega .env.migracao na mesma pasta do script
dotenv.config({
  path: path.resolve(__dirname, '.env.migracao'),
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CSV_PATH =
  process.env.CSV_PATH || path.resolve(__dirname, 'matriculas_import_2025_full_import.csv');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.migracao');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const toBool = (v) => {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return ['1', 'true', 'sim', 'yes', 's', 'y'].includes(s);
};

const toIntOrNull = (v) => {
  if (!v) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const normalizarData = (v) => {
  if (!v) return null;
  const s = String(v).trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
};

async function main() {
  console.log('Lendo CSV:', CSV_PATH);
  const csvContent = fs.readFileSync(path.resolve(CSV_PATH), 'utf8');

  const registros = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
  });

  console.log(`Total de linhas no CSV: ${registros.length}`);

  let totalSucesso = 0;
  let totalErros = 0;

  for (let idx = 0; idx < registros.length; idx++) {
    const row = registros[idx];
    const linha = idx + 2; // cabeçalho = 1

    try {
      const nomeAluno =
        (row['nome_aluno'] || '').trim() ||
        (row['nome_aluno_sistema'] || '').trim();

      if (!nomeAluno) {
        console.warn(`Linha ${linha}: sem nome_aluno, ignorando...`);
        continue;
      }

      const emailFinal = (row['email_final'] || row['email_aluno'] || '')
        .trim()
        .toLowerCase();

      let senhaInicial = (row['senha_inicial'] || '').trim();
      const numeroInscricao =
        (row['numero_inscricao'] || row['num_inscricao_aluno'] || '').trim();

      if (!senhaInicial && numeroInscricao) {
        senhaInicial = `${numeroInscricao}@ceja`;
      }

      const cpfRaw = (row['cpf_raw'] || row['num_cpf_aluno'] || '').trim();

      let authUserId = null;

      // 1) Criar usuário Auth + usuarios (se tiver email e senha)
      if (emailFinal && senhaInicial) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: emailFinal,
          password: senhaInicial,
          email_confirm: true,
          user_metadata: {
            nome: nomeAluno,
            origem: 'migracao_script_base',
          },
        });

        if (error || !data?.user) {
          console.error(
            `Linha ${linha}: falha ao criar usuário Auth para "${nomeAluno}" (${emailFinal}): ${
              error?.message ?? 'sem detalhes'
            }`,
          );
        } else {
          authUserId = data.user.id;

          const dataNasc =
            normalizarData(row['data_nasc_aluno']) ||
            normalizarData(row['data_nasc_sistema']) ||
            normalizarData(row['data_nasc_pdf']);

          const { error: erroUsuario } = await supabase.from('usuarios').insert({
            id: authUserId,
            id_tipo_usuario: 5,
            name: nomeAluno,
            email: emailFinal,
            cpf: cpfRaw || null,
            data_nascimento: dataNasc || null,
            sexo: row['sexo_aluno'] || null,
            raca: row['raca_aluno'] || null,
            celular: row['num_celular_aluno'] || null,
            logradouro: row['logradouro_endereco_aluno'] || null,
            numero_endereco: row['numero_endereco_aluno'] || null,
            bairro: row['bairro_endereco_aluno'] || null,
            municipio: row['municipio_endereco_aluno'] || null,
            facebook_url: row['facebook_aluno'] || null,
            instagram_url: row['instagram_aluno'] || null,
            foto_url: row['foto_aluno'] || null,
          });

          if (erroUsuario) {
            console.error(
              `Linha ${linha}: usuário Auth criado (${emailFinal}), mas falhou ao inserir em public.usuarios: ${erroUsuario.message}`,
            );
          }
        }
      } else {
        console.warn(
          `Linha ${linha}: sem email_final ou senha_inicial; não será criado usuário de login para "${nomeAluno}".`,
        );
      }

      if (!authUserId) {
        // Se user_id for NOT NULL em alunos, isso vai dar erro.
        // Ajuste o schema se quiser permitir null temporariamente.
        console.warn(
          `Linha ${linha}: authUserId nulo. Se alunos.user_id for NOT NULL, este insert pode falhar.`,
        );
      }

      // 2) Inserir em alunos
      const usaTransporte = toBool(row['uso_transporte']);
      const possuiNecEsp = toBool(row['possui_necessidadeEspecial']);
      const possuiRestAli = toBool(row['possui_restriAlimentar']);
      const possuiProgSoc = toBool(row['possui_programaSocial']);

      const { data: alunosInserted, error: erroAluno } = await supabase
        .from('alunos')
        .insert({
          user_id: authUserId, // pode ser null se schema permitir
          nis: row['num_nis_aluno'] || null,
          nome_mae: row['nome_mae_aluno'] || 'Não informado',
          nome_pai: row['nome_pai_aluno'] || null,
          usa_transporte_escolar: usaTransporte,
          possui_necessidade_especial: possuiNecEsp,
          qual_necessidade_especial: row['necessidadeEspecial_qual'] || null,
          possui_restricao_alimentar: possuiRestAli,
          qual_restricao_alimentar: row['restriAlimentar_qual'] || null,
          possui_beneficio_governo: possuiProgSoc,
          qual_beneficio_governo: row['programaSocial_qual'] || null,
          observacoes_gerais: row['observacao'] || null,
        })
        .select('id_aluno');

      if (erroAluno || !alunosInserted || alunosInserted.length === 0) {
        console.error(
          `Linha ${linha}: falha ao inserir aluno para "${nomeAluno}": ${
            erroAluno?.message ?? 'sem detalhes'
          }`,
        );
        totalErros++;
        continue;
      }

      const idAlunoReal = alunosInserted[0].id_aluno;

      // 3) Inserir formulario_sasp
      const dataEnt =
        normalizarData(row['data_matricula']) ||
        normalizarData(row['data_matricula_import']) ||
        `${row['ano_letivo'] || '2025'}-01-01`;

      const trabalha =
        !!row['local_funcaoTrab'] && row['local_funcaoTrab'].trim() !== '';
      const repetiu = toBool(row['repetiu_ano']);
      const temFilhos = toBool(row['possui_filhos']);
      const desistiu =
        !!row['porque_desistiu'] || !!row['outras_escolasDesistiu'];

      const extraObs = [];
      if (row['situacao_aluno']) {
        extraObs.push(`Situação aluno (origem): ${row['situacao_aluno']}`);
      }
      if (row['marcar_aluno']) {
        extraObs.push(`Marcar aluno: ${row['marcar_aluno']}`);
      }
      if (row['num_am_aluno']) {
        extraObs.push(`Número AM aluno: ${row['num_am_aluno']}`);
      }

      const observacoesSasp = [
        row['observacao_sasp'] || '',
        extraObs.join(' | '),
      ]
        .filter(Boolean)
        .join(' | ');

      const { error: erroSasp } = await supabase.from('formulario_sasp').insert({
        id_aluno: idAlunoReal,
        data_entrevista: dataEnt,
        escola_origem: row['escola_origem'] || null,
        cidade_escola_origem: null,
        disciplinas_indicadas_aproveitamento:
          row['disciplinas_indicadas'] || null,
        motivo_retorno_estudos: row['porque_voltouEstudos'] || null,
        trabalha,
        local_trabalho: row['local_funcaoTrab'] || null,
        funcao_trabalho: null,
        repetiu_ano: repetiu,
        desistiu_estudar: desistiu,
        motivos_desistencia: row['porque_desistiu'] || null,
        escolas_desistiu: row['outras_escolasDesistiu'] || null,
        materias_dificuldade: row['materias_dificeis'] || null,
        relacao_tecnologia: null,
        curso_superior_desejado: null,
        atividade_cultural_interesse: null,
        esporte_interesse: null,
        pessoas_residencia: toIntOrNull(row['quantidade_emCasa']),
        parentes_moradia: row['quem_saoParentes'] || null,
        responsavel_pelos_estudos: row['responsavel_estudos'] || null,
        tem_filhos: temFilhos,
        quantos_filhos: toIntOrNull(row['quantidade_filhos']),
        como_conheceu_ceja: row['tomou_conhecimentoCeja'] || null,
        observacoes_sasp: observacoesSasp || null,
      });

      if (erroSasp) {
        console.error(
          `Linha ${linha}: falha ao inserir formulario_sasp para id_aluno=${idAlunoReal}: ${erroSasp.message}`,
        );
      }

      // 4) Inserir matrícula
      const idNivelEnsino = Number(row['id_nivel_ensino'] || '0');
      const idTurma = Number(row['id_turma'] || '0');
      const anoLetivo = Number(row['ano_letivo'] || '2025');
      const idStatus = Number(row['id_status_matricula'] || '1');
      const dataMatricula =
        normalizarData(row['data_matricula']) ||
        normalizarData(row['data_matricula_import']) ||
        `${anoLetivo}-01-01`;

      const { error: erroMatricula } = await supabase.from('matriculas').insert({
        id_aluno: idAlunoReal,
        id_nivel_ensino: idNivelEnsino,
        id_turma: idTurma,
        numero_inscricao:
          row['numero_inscricao'] || row['num_inscricao_aluno'] || '0',
        ano_letivo: anoLetivo,
        id_status_matricula: idStatus,
        data_matricula: dataMatricula,
      });

      if (erroMatricula) {
        console.error(
          `Linha ${linha}: falha ao inserir matricula para id_aluno=${idAlunoReal}: ${erroMatricula.message}`,
        );
      }

      totalSucesso++;
      if (totalSucesso % 50 === 0) {
        console.log(`... ${totalSucesso} alunos processados com sucesso`);
      }
    } catch (err) {
      totalErros++;
      console.error(
        `Erro inesperado na linha ${linha}:`,
        err && err.message ? err.message : err,
      );
    }
  }

  console.log('--- MIGRAÇÃO FINALIZADA ---');
  console.log(`Sucesso: ${totalSucesso}`);
  console.log(`Erros: ${totalErros}`);
}

main().catch((e) => {
  console.error('Erro fatal na migração:', e);
});
