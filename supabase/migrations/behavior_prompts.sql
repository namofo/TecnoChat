-- 1. Crear extensiones necesarias
create extension if not exists vector;
create extension if not exists http;

-- 2. Crear la tabla behavior_prompts
create table if not exists behavior_prompts (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id),
    chatbot_id uuid not null,
    prompt_text text not null,
    embedding vector(1536),
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()),
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Crear índices
create index if not exists idx_behavior_prompts_user_id on behavior_prompts(user_id);
create index if not exists idx_behavior_prompts_chatbot_id on behavior_prompts(chatbot_id);
create index if not exists idx_behavior_prompts_embedding on behavior_prompts using ivfflat (embedding vector_cosine_ops);

-- 4. Configurar RLS
alter table behavior_prompts enable row level security;

-- 5. Crear políticas de seguridad
create policy "Users can view their own behavior_prompts"
  on behavior_prompts
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own behavior_prompts"
  on behavior_prompts
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own behavior_prompts"
  on behavior_prompts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own behavior_prompts"
  on behavior_prompts
  for delete
  using (auth.uid() = user_id);

-- 6. Dar permisos
grant usage on schema public to postgres, authenticated;
grant all on behavior_prompts to postgres, authenticated;