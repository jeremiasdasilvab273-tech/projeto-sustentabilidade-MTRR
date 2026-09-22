# Dashboard de Conformidade Ambiental

Sistema completo (Next.js 14 + Supabase) para gestão de conformidade ambiental em resíduos: cadastro de lotes,
cálculo automático de risco por prazo legal, pendências críticas, upload de documentos (licenças/comprovantes) e
exportação de relatórios em CSV/PDF.

## O que o sistema resolve

- **Rastreabilidade de resíduos**: cada lote tem classe, unidade geradora, MTR (Manifesto de Transporte de
  Resíduos), peso e destinação final.
- **Conformidade por prazo, não por opinião**: o status "pendência crítica" / "vence em breve" / "regularizado"
  é calculado automaticamente a partir do prazo legal de destinação (`deadline_date`), não é um rótulo manual —
  isso é feito pela view `lots_with_risk` no banco.
- **Evidência documental**: licenças e comprovantes ficam anexados e vinculados a lotes específicos, num bucket
  privado (só usuários autenticados da empresa acessam).
- **Auditoria/relatório**: exportação de relatório de conformidade filtrado por período, em CSV ou PDF.

## Estrutura

```text
app/
├── login/                  # Tela de login (Supabase Auth)
├── dashboard/
│   ├── page.tsx            # Dashboard com dados reais e filtro por período
│   ├── dashboard-actions.tsx
│   ├── actions.ts          # Server Actions: criar lote, regularizar, registrar documento, logout
│   ├── novo-lote/          # Cadastro de lote
│   ├── pendencias/         # Pendências críticas + regularizar
│   └── documentos/         # Upload e listagem de documentos
├── api/reports/compliance/ # Exportação real de relatório (CSV/PDF)
lib/supabase/                # Clientes Supabase (browser, server) + tipos
middleware.ts                 # Protege /dashboard, mantém sessão atualizada
supabase/schema.sql            # Schema completo do banco (rode no Supabase)
```

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (ou use um que já existe).
2. Vá em **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e execute.
   Isso cria as tabelas `lots` e `documents`, a view `lots_with_risk` (regra de cálculo de risco), as políticas
   de RLS, o bucket de Storage `documents` e alguns lotes de exemplo.
3. Crie o primeiro usuário: **Authentication → Users → Add user** (defina e-mail e senha; marque
   "Auto Confirm User" para não precisar de confirmação por e-mail).
4. Copie a URL e a chave `anon` do projeto em **Project Settings → API**.

## 2. Rodar localmente

```bash
cp .env.example .env.local
# edite .env.local com a URL e a anon key do seu projeto

npm install
npm run dev
```

Acesse `http://localhost:3000` — você será redirecionado para `/login`. Entre com o usuário criado no passo
anterior.

## 3. Deploy na Vercel

1. Suba este código para um repositório Git (GitHub/GitLab/Bitbucket).
2. Na Vercel: **Add New → Project**, importe o repositório.
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (os mesmos valores do `.env.local`)
4. Deploy. Pronto — o domínio da Vercel já serve o sistema completo, com login, banco e storage reais.

## Funcionalidades já implementadas (não são mockup)

- **Login/logout** real via Supabase Auth, com rotas protegidas por middleware.
- **Cadastrar novo lote** (`/dashboard/novo-lote`): grava no banco, gera código automático.
- **Pendências críticas** (`/dashboard/pendencias`): lista lotes vencidos/vencendo e permite marcar como
  regularizado.
- **Documentos** (`/dashboard/documentos`): upload real de arquivo (PDF/imagem) para o Storage do Supabase,
  vínculo opcional com um lote, listagem com link de download seguro (assinado, válido por 10 minutos).
- **Filtro por período**: reflete na URL e refaz a consulta ao banco.
- **Exportar relatório**: gera CSV e PDF de verdade com os lotes do período filtrado.
- **Cards de resumo**: pendências críticas, em andamento e regularizados são contagens reais, não números fixos.

## Próximos passos sugeridos (não implementados)

Escopo deixado de fora nesta primeira versão — avise se quiser que eu implemente:
- Papéis de usuário (ex.: operador só lê, admin cadastra/edita/exclui).
- Edição e exclusão de lotes já cadastrados.
- Paginação da tabela de lotes (hoje mostra até 50 mais recentes por período).
- Notificações automáticas (e-mail) quando um lote entra em pendência crítica.
- Geração automática de tipos TypeScript a partir do schema real via
  `npx supabase gen types typescript --project-id SEU_PROJETO > lib/supabase/types-generated.ts`
  (recomendado assim que o schema evoluir, para manter os tipos sempre sincronizados com o banco).
