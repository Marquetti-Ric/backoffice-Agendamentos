# Backoffice de agendamentos

Sistema white-label de agendamentos para spas e clínicas de bem-estar. Cada empresa tem os próprios dados, logo, cores e equipe. O Vivarium Spa é o primeiro cliente.

## Stack (gratuita)

- **Supabase**: banco Postgres, login por e-mail e senha, regras de acesso por linha (RLS).
- **GitHub Pages**: site estático, publicado a cada push na `main` pelo workflow `.github/workflows/pages.yml`.
- Sem build: HTML, CSS e JavaScript puros. A biblioteca do Supabase fica em `vendor/`.

## Perfis

| Perfil | O que faz |
|---|---|
| Administrador da plataforma | Cria empresas, define plano e status, configura o app de cada uma, entra em qualquer empresa. |
| Dono | Tudo na própria empresa, inclusive promover outros donos. |
| Gestor | Agenda, cadastros, marca, ajustes e equipe. |
| Recepção | Agenda, reservas e clientes. |
| Profissional | Vê só os próprios atendimentos e muda o status deles. |

O isolamento entre empresas é feito no banco (`supabase/migrations/001_inicial.sql`), não só na tela.

## Primeira instalação

1. Crie um projeto no Supabase e rode `supabase/migrations/001_inicial.sql` no SQL Editor.
2. Em Authentication > URL Configuration, coloque o endereço do GitHub Pages em *Site URL* e em *Redirect URLs*.
3. Preencha `config.js` com a *Project URL* e a chave *anon public* do projeto.
4. Abra o site, crie sua conta e clique em **Sou o dono da plataforma**. Só a primeira pessoa consegue fazer isso.
5. Em **Empresas**, crie a primeira empresa e informe o e-mail do dono. O dono cria a conta com esse e-mail e já entra nela.

Sem `config.js` preenchido, o site abre em modo demonstração, com dados de exemplo só no navegador.

## Arquivos

- `index.html`: estrutura e estilos.
- `js/app.js`: telas (Hoje, Agenda, Reservas, Clientes, Serviços, Profissionais, Marca, Ajustes, App).
- `js/nuvem.js`: login, perfis, troca de empresa, sincronização com o banco, Equipe e Plataforma.
- `js/whatsapp.js`: mensagens prontas de confirmação e lembrete pelo WhatsApp.
- `apps/`: APK Android do app do cliente.
