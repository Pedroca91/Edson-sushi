/* ============================================
   CONFIGURAÇÃO DO SUPABASE
   ============================================

   Este é o ÚNICO arquivo que você precisa editar para ligar o painel
   de admin e o site ao seu banco de dados.

   COMO PREENCHER (passo a passo completo em COMO-CONFIGURAR-O-PAINEL-ADMIN.md):
   1. No seu projeto em https://supabase.com/dashboard, vá em
      "Project Settings" (ícone de engrenagem) > "API".
   2. Copie o "Project URL" e a chave "anon public".
   3. Cole os dois valores abaixo, no lugar de "COLE-AQUI...".

   Enquanto isso não for preenchido, o site funciona normalmente usando
   os dados padrão de js/menu-data.js (mas o painel de admin não vai
   conseguir salvar nada, já que não há banco de dados configurado).
   ============================================ */

const SUPABASE_URL = "https://edbrinewbnvuzvdrgulv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_5J8Tm936NxLSNgCGDsNz-A_053nfne4";

const SUPABASE_IS_CONFIGURED = SUPABASE_URL && !SUPABASE_URL.startsWith("COLE-AQUI");

let supabaseClient = null;
if (SUPABASE_IS_CONFIGURED && window.supabase) {
  try {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.warn('Falha ao iniciar o Supabase:', e);
  }
}
