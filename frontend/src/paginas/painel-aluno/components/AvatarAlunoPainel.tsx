import { useEffect, useMemo, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import { Avatar, type SxProps, type Theme } from '@mui/material'

import { obterIniciais, resolverFotoAlunoPainel } from '../utils'

type Props = {
  supabase: SupabaseClient | null
  idAluno?: number | null
  nome: string
  fotoUrl?: string | null
  sx?: SxProps<Theme>
}

export default function AvatarAlunoPainel({
  supabase,
  idAluno,
  nome,
  fotoUrl,
  sx,
}: Props) {
  const [src, setSrc] = useState<string | undefined>(undefined)

  const iniciais = useMemo(() => obterIniciais(nome), [nome])

  useEffect(() => {
    let ativo = true
    setSrc(undefined)
    void resolverFotoAlunoPainel(supabase, idAluno, fotoUrl).then(url => {
      if (ativo) setSrc(url)
    })
    return () => {
      ativo = false
    }
  }, [supabase, idAluno, fotoUrl])

  return (
    <Avatar
      src={src}
      alt={nome}
      imgProps={{ loading: 'lazy', crossOrigin: 'anonymous', referrerPolicy: 'no-referrer' }}
      onError={() => {
        if (src) setSrc(undefined)
      }}
      sx={sx}
    >
      {iniciais}
    </Avatar>
  )
}
