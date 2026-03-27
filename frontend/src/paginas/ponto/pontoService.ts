import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  LocalizacaoPonto,
  PontoRegistroRow,
  UsuarioPontoRow,
} from './pontoTypes'
import {
  TIPOS_FUNCIONARIO_IDS,
  determinarProximoTipoRegistro,
  obterDataLocalISO,
} from './pontoUtils'

export const usuarioEhFuncionario = (idTipoUsuario?: number | null): boolean =>
  Boolean(idTipoUsuario && TIPOS_FUNCIONARIO_IDS.includes(idTipoUsuario))

export const carregarUsuarioAtualPonto = async (
  supabase: SupabaseClient,
): Promise<UsuarioPontoRow> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) throw authError
  if (!user) throw new Error('Sessão não encontrada.')

  const { data, error } = await supabase
    .from('usuarios')
    .select('id, name, email, id_tipo_usuario, status')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data as UsuarioPontoRow
}

export const carregarFuncionariosPonto = async (
  supabase: SupabaseClient,
): Promise<UsuarioPontoRow[]> => {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, name, email, id_tipo_usuario, status')
    .in('id_tipo_usuario', TIPOS_FUNCIONARIO_IDS)
    .eq('status', 'Ativo')
    .order('name', { ascending: true })

  if (error) throw error
  return (data ?? []) as UsuarioPontoRow[]
}

export const carregarRegistrosHoje = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<PontoRegistroRow[]> => {
  const hoje = obterDataLocalISO()

  const { data, error } = await supabase
    .from('ponto_registros')
    .select(
      'id_ponto, user_id, data_referencia, tipo_registro, registrado_em, latitude, longitude, precisao_metros, observacao, origem, created_at, updated_at',
    )
    .eq('user_id', userId)
    .eq('data_referencia', hoje)
    .order('registrado_em', { ascending: true })

  if (error) throw error
  return (data ?? []) as PontoRegistroRow[]
}

export const carregarUltimosRegistros = async (
  supabase: SupabaseClient,
  userId: string,
  limite = 15,
): Promise<PontoRegistroRow[]> => {
  const { data, error } = await supabase
    .from('ponto_registros')
    .select(
      'id_ponto, user_id, data_referencia, tipo_registro, registrado_em, latitude, longitude, precisao_metros, observacao, origem, created_at, updated_at',
    )
    .eq('user_id', userId)
    .order('registrado_em', { ascending: false })
    .limit(limite)

  if (error) throw error
  return (data ?? []) as PontoRegistroRow[]
}

export const carregarRegistrosPeriodo = async (
  supabase: SupabaseClient,
  args: { userId: string; dataInicio: string; dataFim: string },
): Promise<PontoRegistroRow[]> => {
  const { userId, dataInicio, dataFim } = args

  const { data, error } = await supabase
    .from('ponto_registros')
    .select(
      'id_ponto, user_id, data_referencia, tipo_registro, registrado_em, latitude, longitude, precisao_metros, observacao, origem, created_at, updated_at',
    )
    .eq('user_id', userId)
    .gte('data_referencia', dataInicio)
    .lte('data_referencia', dataFim)
    .order('data_referencia', { ascending: true })
    .order('registrado_em', { ascending: true })

  if (error) throw error
  return (data ?? []) as PontoRegistroRow[]
}

export const registrarPontoFuncionario = async (
  supabase: SupabaseClient,
  args: {
    userId: string
    observacao?: string
    localizacao?: LocalizacaoPonto
  },
): Promise<PontoRegistroRow> => {
  const { userId, observacao, localizacao } = args
  const dataHoje = obterDataLocalISO()
  const registrosHoje = await carregarRegistrosHoje(supabase, userId)
  const proximoTipo = determinarProximoTipoRegistro(registrosHoje)

  if (!proximoTipo) {
    throw new Error('O ponto de hoje já possui entrada e saída registradas.')
  }

  const { data, error } = await supabase
    .from('ponto_registros')
    .insert({
      user_id: userId,
      data_referencia: dataHoje,
      tipo_registro: proximoTipo,
      registrado_em: new Date().toISOString(),
      latitude: localizacao?.latitude ?? null,
      longitude: localizacao?.longitude ?? null,
      precisao_metros: localizacao?.precisao_metros ?? null,
      observacao: observacao?.trim() || null,
      origem: 'SIGE-CEJA Web',
    })
    .select(
      'id_ponto, user_id, data_referencia, tipo_registro, registrado_em, latitude, longitude, precisao_metros, observacao, origem, created_at, updated_at',
    )
    .single()

  if (error) throw error
  return data as PontoRegistroRow
}
