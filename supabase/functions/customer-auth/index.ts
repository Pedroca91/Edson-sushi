// Ponte entre o site (chave anon, sem backend proprio) e a tabela `customers`.
// A tabela nao tem nenhuma policy de RLS pra anon/authenticated - so essa
// function, rodando com a service_role key (nunca exposta ao navegador),
// consegue ler/escrever nela. Mantem o mesmo modelo de "login" do site
// (identificacao por celular, sem senha/OTP) so que agora persistido no
// banco em vez de localStorage.

import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function onlyDigits(s: unknown): string {
  return typeof s === "string" ? s.replace(/\D/g, "") : "";
}

function isValidCpf(raw: unknown): boolean {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10]);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const action = body.action;

  if (action === "lookup") {
    const phone = onlyDigits(body.phone);
    if (phone.length < 10) return json({ ok: false, error: "invalid_phone" }, 400);

    const { data, error } = await supabase
      .from("customers")
      .select("phone, name, email, cpf, cep, street, number, complement, neighborhood, city")
      .eq("phone", phone)
      .maybeSingle();

    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true, found: !!data, customer: data || null });
  }

  if (action === "upsert") {
    const phone = onlyDigits(body.phone);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const cpf = onlyDigits(body.cpf);

    if (phone.length < 10 || !name || !email) {
      return json({ ok: false, error: "missing_fields" }, 400);
    }
    if (cpf && !isValidCpf(cpf)) {
      return json({ ok: false, error: "invalid_cpf" }, 400);
    }

    const row = {
      phone,
      name,
      email,
      cpf: cpf || null,
      cep: onlyDigits(body.cep) || null,
      street: typeof body.street === "string" ? body.street.trim() : null,
      number: typeof body.number === "string" ? body.number.trim() : null,
      complement: typeof body.complement === "string" ? body.complement.trim() : null,
      neighborhood: typeof body.neighborhood === "string" ? body.neighborhood.trim() : null,
      city: typeof body.city === "string" ? body.city.trim() : null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("customers")
      .upsert(row, { onConflict: "phone" })
      .select("phone, name, email, cpf, cep, street, number, complement, neighborhood, city")
      .single();

    if (error) return json({ ok: false, error: error.message }, 500);

    // Cliente trocou o proprio celular (chave primaria): remove a linha antiga
    // pra nao deixar cadastro duplicado/orfao no banco.
    const previousPhone = onlyDigits(body.previousPhone);
    if (previousPhone && previousPhone !== phone) {
      await supabase.from("customers").delete().eq("phone", previousPhone);
    }

    return json({ ok: true, customer: data });
  }

  return json({ ok: false, error: "unknown_action" }, 400);
});
