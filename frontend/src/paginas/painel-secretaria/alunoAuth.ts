import type { SupabaseClient } from '@supabase/supabase-js'

type UsuarioPublicoBasico = {
  id: string
  name: string | null
  email: string | null
  cpf: string | null
  id_tipo_usuario: number | null
}

type CriarUsuarioAuthAlunoInput = {
  supabase: SupabaseClient
  nome: string
  emailDigitado: string | null
  cpf: string | null
  senha: string
}

type CriarUsuarioAuthAlunoResult =
  | {
      ok: true
      authUserId: string
      emailFinal: string
    }
  | {
      ok: false
      mensagem: string
    }

const normalizarTexto = (valor: string): string =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const normalizarEmail = (valor: string | null | undefined): string | null => {
  const email = String(valor ?? '')
    .trim()
    .toLowerCase()
  return email || null
}

const limparCpf = (valor: string | null | undefined): string => String(valor ?? '').replace(/\D+/g, '')

const formatarCpf = (cpfLimpo: string): string | null => {
  if (!/^\d{11}$/.test(cpfLimpo)) return null
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

const nomeTipoUsuario = (idTipoUsuario: number | null | undefined): string => {
  switch (idTipoUsuario) {
    case 1:
      return 'Diretor'
    case 2:
      return 'Professor'
    case 3:
      return 'Coordenação'
    case 4:
      return 'Secretaria'
    case 5:
      return 'Aluno'
    case 6:
      return 'Administrador'
    case 7:
      return 'Avaliador'
    default:
      return 'Usuário'
  }
}

const descreverUsuarioExistente = (usuario: UsuarioPublicoBasico): string => {
  const tipo = nomeTipoUsuario(usuario.id_tipo_usuario)
  const nome = String(usuario.name ?? '').trim()
  const email = String(usuario.email ?? '').trim()

  if (nome && email) return `${tipo} ${nome} (${email})`
  if (nome) return `${tipo} ${nome}`
  if (email) return `${tipo} (${email})`
  return tipo
}

const gerarEmailAutomatico = (nome: string, tentativa = 0): string => {
  const slug = String(nome ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  const primeiro = slug[0] ?? 'aluno'
  const ultimo = slug.length > 1 ? slug[slug.length - 1] : 'ceja'
  const sufixo = tentativa > 0 ? `_${tentativa + 1}` : ''

  return `${primeiro}_${ultimo}${sufixo}@ceja.com`
}

const ehErroAuthJaRegistrado = (mensagem: string | null | undefined): boolean => {
  const msg = normalizarTexto(String(mensagem ?? ''))
  return (
    msg.includes('already registered') ||
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('ja esta registrado') ||
    msg.includes('ja registrado')
  )
}

const buscarUsuarioPublicoPorEmail = async (
  supabase: SupabaseClient,
  email: string,
): Promise<UsuarioPublicoBasico | null> => {
  const emailNormalizado = normalizarEmail(email)
  if (!emailNormalizado) return null

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, name, email, cpf, id_tipo_usuario')
    .ilike('email', emailNormalizado)
    .limit(1)
    .maybeSingle<UsuarioPublicoBasico>()

  if (error) {
    console.error('Erro ao verificar e-mail existente em public.usuarios:', error)
    return null
  }

  return data ?? null
}

const buscarUsuarioPublicoPorCpf = async (
  supabase: SupabaseClient,
  cpf: string | null,
): Promise<UsuarioPublicoBasico | null> => {
  const cpfLimpo = limparCpf(cpf)
  if (!cpfLimpo) return null

  const valores = Array.from(new Set([cpfLimpo, formatarCpf(cpfLimpo)].filter(Boolean))) as string[]
  if (valores.length === 0) return null

  let query = supabase
    .from('usuarios')
    .select('id, name, email, cpf, id_tipo_usuario')
    .limit(1)

  query = valores.length === 1 ? query.eq('cpf', valores[0]) : query.in('cpf', valores)

  const { data, error } = await query.maybeSingle<UsuarioPublicoBasico>()

  if (error) {
    console.error('Erro ao verificar CPF existente em public.usuarios:', error)
    return null
  }

  return data ?? null
}

export const criarUsuarioAuthAluno = async ({
  supabase,
  nome,
  emailDigitado,
  cpf,
  senha,
}: CriarUsuarioAuthAlunoInput): Promise<CriarUsuarioAuthAlunoResult> => {
  const emailInformado = normalizarEmail(emailDigitado)
  const cpfLimpo = limparCpf(cpf)

  if (emailInformado) {
    const usuarioMesmoEmail = await buscarUsuarioPublicoPorEmail(supabase, emailInformado)
    if (usuarioMesmoEmail) {
      const descricao = descreverUsuarioExistente(usuarioMesmoEmail)
      return {
        ok: false,
        mensagem:
          usuarioMesmoEmail.id_tipo_usuario === 5
            ? `Já existe um aluno com este e-mail: ${descricao}. Abra o cadastro existente e adicione a nova matrícula nele.`
            : `O e-mail ${emailInformado} já está em uso por ${descricao}. Informe outro e-mail para o aluno.`,
      }
    }
  }

  if (cpfLimpo) {
    const usuarioMesmoCpf = await buscarUsuarioPublicoPorCpf(supabase, cpfLimpo)
    if (usuarioMesmoCpf) {
      const descricao = descreverUsuarioExistente(usuarioMesmoCpf)
      return {
        ok: false,
        mensagem:
          usuarioMesmoCpf.id_tipo_usuario === 5
            ? `Já existe um aluno com este CPF: ${descricao}. Abra o cadastro existente e inclua a matrícula nele, em vez de criar outro aluno.`
            : `O CPF informado já está vinculado a ${descricao}. Revise o cadastro antes de prosseguir.`,
      }
    }
  }

  const { data: sessAntesData } = await supabase.auth.getSession()
  const sessAntes = sessAntesData.session

  const maxTentativasEmailAutomatico = 20
  const candidatos = emailInformado
    ? [emailInformado]
    : Array.from({ length: maxTentativasEmailAutomatico }, (_, idx) => gerarEmailAutomatico(nome, idx))

  let ultimoErroMensagem: string | null = null

  for (const emailCandidato of candidatos) {
    if (!emailInformado) {
      const usuarioMesmoEmail = await buscarUsuarioPublicoPorEmail(supabase, emailCandidato)
      if (usuarioMesmoEmail) continue
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: emailCandidato,
      password: senha,
    })

    if (!signUpError && signUpData?.user) {
      if (sessAntes && signUpData.session) {
        const { error: setSessErr } = await supabase.auth.setSession({
          access_token: sessAntes.access_token,
          refresh_token: sessAntes.refresh_token,
        })
        if (setSessErr) {
          console.warn('Não foi possível restaurar a sessão anterior após signUp:', setSessErr)
        }
      }

      return {
        ok: true,
        authUserId: signUpData.user.id,
        emailFinal: emailCandidato,
      }
    }

    ultimoErroMensagem = signUpError?.message ?? null

    if (ehErroAuthJaRegistrado(ultimoErroMensagem)) {
      if (!emailInformado) continue

      const usuarioMesmoEmail = await buscarUsuarioPublicoPorEmail(supabase, emailCandidato)
      if (usuarioMesmoEmail) {
        const descricao = descreverUsuarioExistente(usuarioMesmoEmail)
        return {
          ok: false,
          mensagem:
            usuarioMesmoEmail.id_tipo_usuario === 5
              ? `Já existe um aluno com este e-mail: ${descricao}. Abra o cadastro existente e adicione a nova matrícula nele.`
              : `O e-mail ${emailCandidato} já está em uso por ${descricao}. Informe outro e-mail para o aluno.`,
        }
      }

      return {
        ok: false,
        mensagem: `O e-mail ${emailCandidato} já existe no Authentication do Supabase, mas não foi encontrado em public.usuarios. Isso normalmente indica um cadastro parcial anterior. Corrija esse usuário em Authentication > Users no Supabase ou informe outro e-mail.`,
      }
    }

    if (signUpError) {
      console.error(signUpError)
      return {
        ok: false,
        mensagem: `Erro ao criar usuário de autenticação do aluno: ${signUpError.message}`,
      }
    }
  }

  return {
    ok: false,
    mensagem: emailInformado
      ? `Não foi possível criar o acesso de ${emailInformado}. ${ultimoErroMensagem ?? 'Revise o cadastro e tente novamente.'}`
      : 'Não foi possível gerar um e-mail automático disponível para o aluno. Preencha um e-mail manualmente ou limpe usuários órfãos no Authentication do Supabase.',
  }
}
