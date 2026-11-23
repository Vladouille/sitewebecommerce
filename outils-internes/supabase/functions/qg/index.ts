// QG des associés : fonction serveur unique (Supabase Edge Function, Deno).
// - Vérifie le code commun (secret QG_CODE) à CHAQUE requête : sans lui, rien n'est lu ni écrit.
// - Lit et écrit la table qg_items avec la clé de service (la clé publique n'a aucun droit).
// - Appelle l'API Claude pour l'analyse des idées (secret ANTHROPIC_API_KEY, jamais envoyé à la page).
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const CODE = Deno.env.get("QG_CODE") ?? "";
const ORIGIN = Deno.env.get("QG_ALLOWED_ORIGIN") ?? "*";
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);
const anthropic = new Anthropic(); // lit ANTHROPIC_API_KEY

const COLS = new Set(["tasks", "calls", "ideas", "comments", "goals", "config"]);
const ID_RE = /^[A-Za-z0-9_\-.~:@+]{1,200}$/;
const cors = {
  "Access-Control-Allow-Origin": ORIGIN,
  "Access-Control-Allow-Headers": "content-type, x-qg-code, authorization, apikey, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });
}
function sameCode(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

const crit = {
  type: "object",
  properties: { note: { type: "number" }, raison: { type: "string" } },
  required: ["note", "raison"],
  additionalProperties: false,
};
const strList = { type: "array", items: { type: "string" } };
const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    criteres: {
      type: "object",
      properties: { marche: crit, execution: crit, premierEuro: crit, marge: crit, concurrence: crit },
      required: ["marche", "execution", "premierEuro", "marge", "concurrence"],
      additionalProperties: false,
    },
    avantages: strList,
    risques: strList,
    erreurs: strList,
    methode: {
      type: "object",
      properties: {
        cible: { type: "string" },
        offre: { type: "string" },
        prix: { type: "string" },
        canal: { type: "string" },
        plan30: strList,
        estimation: {
          type: "object",
          properties: {
            ca3mois: { type: "number" },
            hypotheses: strList,
            calcul: { type: "string" },
            coutsDepart: { type: "number" },
            coutsDetail: { type: "string" },
            seuil: { type: "string" },
          },
          required: ["ca3mois", "hypotheses", "calcul", "coutsDepart", "coutsDetail", "seuil"],
          additionalProperties: false,
        },
      },
      required: ["cible", "offre", "prix", "canal", "plan30", "estimation"],
      additionalProperties: false,
    },
    verdict: { type: "string", enum: ["Foncer", "Tester petit", "Abandonner"] },
    verdictPhrase: { type: "string" },
  },
  required: ["criteres", "avantages", "risques", "erreurs", "methode", "verdict", "verdictPhrase"],
  additionalProperties: false,
};

async function analyse(prompt: string): Promise<Response> {
  if (!prompt || prompt.length > 12000) return json({ code: "prompt_too_large" }, 400);
  try {
    // deno-lint-ignore no-explicit-any
    const params: any = {
      model: "claude-opus-5-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // si le modèle refuse, l'API relance sur un modèle de secours
      output_config: { effort: "medium", format: { type: "json_schema", schema: ANALYSIS_SCHEMA } },
      messages: [{ role: "user", content: prompt }],
    };
    const msg = await anthropic.beta.messages.create(params);
    if (msg.stop_reason === "refusal") return json({ code: "refused" }, 422);
    if (msg.stop_reason === "max_tokens") return json({ code: "invalid_json" }, 502);
    let text = "";
    for (const block of msg.content) if (block.type === "text") text += block.text;
    try {
      return json({ result: JSON.parse(text) });
    } catch {
      return json({ code: "invalid_json" }, 502);
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return json({ code: "api_key", message: "Clé API Anthropic invalide ou absente." }, 500);
    if (e instanceof Anthropic.RateLimitError) return json({ code: "rate_limited" }, 429);
    if (e instanceof Anthropic.BadRequestError) {
      console.error("Anthropic 400:", e.message);
      const credit = /credit|balance/i.test(e.message);
      return json({ code: credit ? "no_credit" : "upstream_error", message: e.message }, 502);
    }
    if (e instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", e.status, e.message);
      return json({ code: "upstream_error" }, 502);
    }
    throw e;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ code: "method_not_allowed" }, 405);
  if (CODE.length < 8) return json({ code: "not_configured", message: "Secret QG_CODE manquant ou trop court (8 caractères minimum)." }, 500);
  if (!sameCode(req.headers.get("x-qg-code") ?? "", CODE)) {
    await new Promise((r) => setTimeout(r, 800)); // ralentit les essais au hasard
    return json({ code: "bad_code" }, 401);
  }
  // deno-lint-ignore no-explicit-any
  let body: any;
  try { body = await req.json(); } catch { return json({ code: "invalid_argument" }, 400); }
  const op = body?.op;
  try {
    if (op === "ping") return json({ ok: true });
    if (op === "list") {
      const { data, error } = await supabase.from("qg_items").select("col,id,data").limit(20000);
      if (error) throw error;
      return json({ items: data });
    }
    if (op === "set" || op === "update" || op === "delete") {
      if (!COLS.has(body.col) || typeof body.id !== "string" || !ID_RE.test(body.id)) return json({ code: "invalid_argument" }, 400);
      if (op === "delete") {
        const { error } = await supabase.from("qg_items").delete().eq("col", body.col).eq("id", body.id);
        if (error) throw error;
        return json({ ok: true });
      }
      const data = body.data;
      if (!data || typeof data !== "object" || Array.isArray(data)) return json({ code: "invalid_argument" }, 400);
      if (JSON.stringify(data).length > 250000) return json({ code: "invalid_argument", message: "Élément trop volumineux." }, 400);
      if (op === "set") {
        const { error } = await supabase.from("qg_items").upsert({ col: body.col, id: body.id, data, updated_at: new Date().toISOString() });
        if (error) throw error;
        return json({ ok: true });
      }
      const { data: found, error } = await supabase.rpc("qg_merge", { p_col: body.col, p_id: body.id, p_patch: data });
      if (error) throw error;
      if (!found) return json({ code: "missing" }, 404);
      return json({ ok: true });
    }
    if (op === "analyse") return await analyse(String(body.prompt ?? ""));
    return json({ code: "invalid_argument" }, 400);
  } catch (e) {
    console.error(e);
    return json({ code: "unavailable" }, 503);
  }
});
