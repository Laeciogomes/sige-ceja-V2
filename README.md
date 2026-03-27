markdown
# SIGE-CEJA V2

Sistema de Gestão Educacional para o Centro de Educação de Jovens e Adultos (CEJA).

## 📋 Sobre o Projeto

O SIGE-CEJA V2 é um sistema web para gestão de centros de educação de jovens e adultos, desenvolvido para otimizar processos administrativos e pedagógicos. O sistema oferece diferentes níveis de acesso (Administração, Coordenação, Professor e Secretaria) com funcionalidades específicas para cada perfil.

## 🚀 Status do Projeto

🟡 Em desenvolvimento - Estrutura base implementada, páginas em construção.

## ✨ Funcionalidades

### Painel Administração
- Dashboard com métricas gerais
- Gestão de usuários e permissões
- Relatórios consolidados
- Configurações do sistema

### Painel Coordenação
- Gestão de turmas
- Acompanhamento de professores
- Relatórios pedagógicos
- Monitoramento de alunos

### Painel Professor
- Visualização de turmas
- Diário de classe
- Lançamento de notas e faltas
- Planejamento de aulas

### Painel Secretaria
- Matrícula de alunos
- Histórico escolar
- Emissão de certificados
- Comunicação com responsáveis

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 19 + TypeScript + Vite
- **UI Library:** Material UI (MUI)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **State Management:** TanStack Query
- **Routing:** React Router DOM
- **PDF Generation:** jsPDF
- **CSV Handling:** PapaParse

## 📦 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase

## 🔧 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/Laeciogomes/sige-ceja-V2.git
cd sige-ceja-V2

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. **Execute o projeto**
```bash
npm run dev
```

5. **Acesse no navegador**
```
http://localhost:5173
```

## 📁 Estrutura do Projeto

```
frontend/src/
├── paginas/              # Páginas da aplicação
│   ├── Autenticacao/     # Login, registro, recuperação
│   ├── Configuracoes/    # Configurações do sistema
│   ├── Perfil/           # Perfil do usuário
│   ├── painel-administracao/
│   ├── painel-coordenacao/
│   ├── painel-professor/
│   └── painel-secretaria/
├── componentes/          # Componentes reutilizáveis
│   ├── autenticacao/
│   ├── layout/
│   └── navegacao/
├── contextos/            # Context API
│   ├── AuthContext.tsx
│   ├── NotificacaoContext.tsx
│   ├── SupabaseContext.tsx
│   └── TemaContext.tsx
├── rotas/                # Configuração de rotas
├── hooks/                # Custom hooks
├── layouts/              # Layout templates
├── temas/               # Temas visuais
├── utils/               # Funções utilitárias
├── config/              # Configurações
└── assets/             # Recursos estáticos
```

## 🔐 Variáveis de Ambiente

| Variável | Descrição 

## 👥 Perfis de Usuário

| Perfil | Descrição 
| **Professor** | Diário de classe, notas, faltas e planejamento |

## 🗄️ Banco de Dados

O projeto utiliza o Supabase como backend, que oferece:
- PostgreSQL como banco de dados relacional
- Autenticação integrada
- Storage para arquivos
- API REST automática
- Real-time subscriptions

## 🧪 Scripts Disponíveis

```bash
npm run dev       # Executa em desenvolvimento
npm run build     # Gera build de produção
npm run preview    # Visualiza build de produção
npm run lint       # Verifica problemas de código
```

## 📝 Roadmap

- [ ] Completar páginas de todos os painéis
- [ ] Implementar testes unitários
- [ ] Adicionar testes de integração
- [ ] Implementar PWA para funcionamento offline
- [ ] Otimizar performance com lazy loading
- [ ] Documentar componentes com Storybook

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📧 Contato

**Autor:** Laécio Gomes  
**GitHub:** [@Laeciogomes](https://github.com/Laeciogomes)  
**Repositório:** [sige-ceja-V2](https://github.com/Laeciogomes/sige-ceja-V2)

---

Desenvolvido com ❤️ para a gestão educacional do CEJA.
```