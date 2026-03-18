import { useCallback, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

import {
  Autocomplete,
  Box,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'

import AvatarAlunoPainel from './AvatarAlunoPainel'
import {
  buscarAlunosParaPainel,
  nomeNivelEnsinoCurto,
  type AlunoBuscaOption,
} from '../utils'

type Props = {
  supabase: SupabaseClient | null
  valor: AlunoBuscaOption | null
  onChange: (value: AlunoBuscaOption | null) => void
}

export default function AlunoSeletorAdmin({ supabase, valor, onChange }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<AlunoBuscaOption[]>([])

  const carregar = useCallback(
    async (termo: string) => {
      if (!supabase || termo.trim().length < 2) {
        setOptions([])
        return
      }
      setLoading(true)
      try {
        const data = await buscarAlunosParaPainel(supabase, termo)
        setOptions(data)
      } finally {
        setLoading(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    const termo = inputValue.trim()
    if (termo.length < 2) {
      setOptions([])
      return
    }

    const timer = window.setTimeout(() => {
      void carregar(termo)
    }, 280)

    return () => window.clearTimeout(timer)
  }, [carregar, inputValue])

  return (
    <Paper variant="outlined" sx={{ p: 2.25, borderRadius: 3 }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <SearchIcon color="action" />
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Visão do aluno
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Pesquise por nome ou RA para abrir o painel completo do estudante.
            </Typography>
          </Box>
        </Stack>

        <Autocomplete
          value={valor}
          options={options}
          loading={loading}
          inputValue={inputValue}
          onInputChange={(_event, newValue) => setInputValue(newValue)}
          onChange={(_event, newValue) => onChange(newValue)}
          isOptionEqualToValue={(option, current) => option.id_aluno === current.id_aluno}
          getOptionLabel={option => `${option.nome}${option.numero_inscricao ? ` • RA ${option.numero_inscricao}` : ''}`}
          noOptionsText={inputValue.trim().length < 2 ? 'Digite pelo menos 2 caracteres.' : 'Nenhum aluno encontrado.'}
          renderInput={params => (
            <TextField
              {...params}
              label="Buscar aluno"
              placeholder="Nome ou matrícula (RA)"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loading ? <CircularProgress size={18} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={`aluno-${option.id_aluno}`}>
              <Stack direction="row" spacing={1.25} alignItems="center" sx={{ py: 0.5 }}>
                <AvatarAlunoPainel
                  supabase={supabase}
                  idAluno={option.id_aluno}
                  nome={option.nome}
                  fotoUrl={option.foto_url}
                  sx={{ width: 38, height: 38 }}
                />
                <Box>
                  <Typography fontWeight={700}>{option.nome}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    RA {option.numero_inscricao || '-'} • {nomeNivelEnsinoCurto(option.id_nivel_ensino ?? null)}
                    {option.ano_letivo ? ` • ${option.ano_letivo}` : ''}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        />
      </Stack>
    </Paper>
  )
}
