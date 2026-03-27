export type TipoRegistroPonto = 'Entrada' | 'Saida'

export interface PontoRegistroRow {
  id_ponto: number
  user_id: string
  data_referencia: string
  tipo_registro: TipoRegistroPonto
  registrado_em: string
  latitude: number | null
  longitude: number | null
  precisao_metros: number | null
  observacao: string | null
  origem: string | null
  created_at?: string
  updated_at?: string
}

export interface UsuarioPontoRow {
  id: string
  name: string
  email: string
  id_tipo_usuario: number
  status: string
}

export interface EspelhoPontoDia {
  data: string
  diaSemana: string
  entrada: string
  saida: string
  status: 'Completo' | 'Parcial' | 'Sem registro' | 'Fim de semana'
  observacao: string
}

export interface LocalizacaoPonto {
  latitude: number | null
  longitude: number | null
  precisao_metros: number | null
}
