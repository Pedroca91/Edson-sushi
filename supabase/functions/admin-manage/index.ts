// Acoes administrativas que exigem service_role (nunca exposto ao navegador):
// hoje, so criar o login de acesso da loja (usuario store_admin). Quem chama
// precisa estar autenticado E ser super_admin (checado aqui no servidor, nao
// confia em nada que vem do cliente alem do JWT da sessao).

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ ok: false, error: "unauthorized" }, 401);

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ ok: false, error: "unauthorized" }, 401);

  const { data: roleRow } = await supabaseAdmin
    .from("admin_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!roleRow || roleRow.role !== "super_admin") {
    return json({ ok: false, error: "Só o super admin pode fazer isso." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (body.action === "createStoreAdmin") {
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || password.length < 8) {
      return json({ ok: false, error: "E-mail inválido ou senha com menos de 8 caracteres." }, 400);
    }

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) return json({ ok: false, error: createErr.message }, 400);

    const { error: roleErr } = await supabaseAdmin
      .from("admin_roles")
      .insert({ user_id: created.user.id, role: "store_admin" });
    if (roleErr) return json({ ok: false, error: roleErr.message }, 400);

    return json({ ok: true, userId: created.user.id });
  }

  return json({ ok: false, error: "unknown_action" }, 400);
});
