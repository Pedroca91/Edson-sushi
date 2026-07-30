# Como configurar o painel de administrador do site Edson Sushi

O site foi construído para funcionar em qualquer hospedagem simples de arquivos (sem precisar de um servidor próprio). Para o painel de admin (`admin.html`) conseguir salvar as suas alterações — textos, preços, fotos, promoções — ele usa o **Supabase**, um serviço gratuito (banco de dados + login + fotos). Siga este passo a passo uma única vez.

## 1. Criar o projeto no Supabase

Você já criou o projeto (`Edson Sushi Site`, plano Free). Se precisar criar outro: [supabase.com/dashboard](https://supabase.com/dashboard) → "New project".

## 2. Criar as tabelas do banco de dados

No menu esquerdo do projeto, clique no ícone **SQL Editor** → **New query**. Cole o código abaixo e clique em **Run**:

```sql
-- Configurações gerais do site (textos, contato, horários, taxas...)
create table if not exists settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);

-- Categorias do cardápio (cada linha é uma categoria; os produtos ficam
-- guardados dentro da coluna "items")
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  cat text not null,
  icon text default 'bi-egg-fried',
  sub text default '',
  "order" int default 0,
  items jsonb not null default '[]'::jsonb
);

alter table settings enable row level security;
alter table categories enable row level security;

create policy "Leitura pública" on settings for select using (true);
create policy "Escrita autenticada" on settings for all to authenticated using (true) with check (true);

create policy "Leitura pública" on categories for select using (true);
create policy "Escrita autenticada" on categories for all to authenticated using (true) with check (true);
```

Isso cria as duas tabelas e as regras de acesso: qualquer visitante pode *ver* o cardápio (necessário pro site funcionar), mas só quem estiver logado no painel (você) pode *alterar* alguma coisa.

## 3. Criar o espaço para as fotos dos produtos

1. No menu esquerdo, clique em **Storage** → **New bucket**.
2. Nome do bucket: `product-images` (exatamente assim, minúsculo).
3. Ative a opção **Public bucket** (assim as fotos aparecem no site sem precisar de senha).
4. Clique em **Create bucket**.

Agora volte ao **SQL Editor** → **New query**, cole e rode:

```sql
create policy "Leitura pública das fotos"
on storage.objects for select
using ( bucket_id = 'product-images' );

create policy "Upload autenticado de fotos"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'product-images' );

create policy "Editar fotos (autenticado)"
on storage.objects for update
to authenticated
using ( bucket_id = 'product-images' );

create policy "Excluir fotos (autenticado)"
on storage.objects for delete
to authenticated
using ( bucket_id = 'product-images' );
```

## 4. Criar o seu login de administrador

Menu esquerdo → **Authentication** → aba **Users** → **Add user** → **Create new user**.

- Preencha e-mail e senha (essa é a chave de acesso ao painel `admin.html`).
- Marque **Auto Confirm User** para não precisar confirmar por e-mail.
- Clique em **Create user**.

## 5. Pegar as chaves de configuração e colar no site

1. Menu esquerdo → ícone de engrenagem **Project Settings** → **API**.
2. Copie o campo **Project URL**.
3. Copie o campo **anon public** (a chave longa que começa com `eyJ...`).
4. Abra o arquivo **`js/supabase-config.js`** (dentro da pasta do site, em `C:\edsonsushi\js\`) e substitua:
   - `SUPABASE_URL` pelo Project URL.
   - `SUPABASE_ANON_KEY` pela chave anon public.
5. Salve o arquivo e suba a pasta inteira (`C:\edsonsushi`) para a sua hospedagem no lugar da versão antiga.

## 6. Importar o cardápio atual para o Supabase

1. Acesse `seusite.com/admin.html` e entre com o e-mail/senha criados no passo 4.
2. No menu lateral, clique em **Importar dados**.
3. Clique no botão **Importar cardápio inicial para o Supabase** — isso copia todo o cardápio e as configurações que já estavam no site para o seu banco de dados.
4. Use esse botão **apenas uma vez** (ele duplica as categorias se usado de novo). Depois disso, toda edição é feita nas telas de "Configurações" e "Cardápio".

## 7. Usando o painel no dia a dia

- **Configurações**: textos da home, telefone, endereço, latitude/longitude (usada para calcular a taxa de entrega real por distância), pagamento aceito, faixas de taxa de entrega e horário de funcionamento.
- **Cardápio**: clique numa categoria para abrir/fechar a lista de produtos. Dá para renomear a categoria direto no campo de texto, excluir categorias, adicionar produtos novos, editar ou excluir produtos, e enviar uma foto diretamente do computador ao editar um produto (ela é enviada para o Storage do Supabase). O checkbox "Mostrar nos destaques da home" controla o carrossel de "pratos que mais saem" — sem precisar mexer em código.
- Todas as alterações aparecem no site imediatamente após salvar (o visitante só precisa atualizar a página).

## Dúvidas comuns

- **"Configure o Supabase antes de entrar"**: significa que o arquivo `js/supabase-config.js` ainda está com os valores de exemplo. Revise o passo 5.
- **E-mail/senha inválidos**: confirme que o usuário foi criado em Authentication → Users (passo 4) e que marcou "Auto Confirm User".
- **A foto não aparece depois de subir**: confira se o bucket `product-images` foi criado como **público** (passo 3) e se as 4 políticas de Storage foram executadas sem erro.
- **Erro ao salvar configurações/cardápio**: confira se as tabelas e políticas do passo 2 foram criadas sem erro (rode o SQL de novo, ele é seguro para repetir graças ao `if not exists`).
