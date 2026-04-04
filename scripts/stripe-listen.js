#!/usr/bin/env node
/**
 * Inicia o Stripe CLI listener lendo STRIPE_SECRET_KEY do .env.local
 * e usando o caminho correto do executável no Windows.
 */
const { spawn } = require("child_process");
const { readFileSync, existsSync } = require("fs");
const { join } = require("path");

// ── Lê .env.local manualmente ─────────────────────────────────────────────────
function readEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌ .env.local não encontrado.");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf-8").split("\n");
  const env = {};
  for (const line of lines) {
    const match = line.match(/^([^#=]+)=["']?(.+?)["']?\s*$/);
    if (match) env[match[1].trim()] = match[2].trim();
  }
  return env;
}

// ── Localiza o binário do Stripe CLI ─────────────────────────────────────────
function findStripeBin() {
  const candidates = [
    // Winget install path
    join(
      process.env.LOCALAPPDATA || "",
      "Microsoft/WinGet/Packages/Stripe.StripeCli_Microsoft.Winget.Source_8wekyb3d8bbwe/stripe.exe"
    ),
    // Scoop
    join(process.env.USERPROFILE || "", "scoop/shims/stripe.exe"),
    // PATH (funciona após reiniciar o shell)
    "stripe",
  ];

  for (const bin of candidates) {
    if (bin === "stripe" || existsSync(bin)) return bin;
  }

  console.error("❌ Stripe CLI não encontrado. Instale com: winget install Stripe.StripeCLI");
  process.exit(1);
}

// ── Main ──────────────────────────────────────────────────────────────────────
const env = readEnvLocal();
const apiKey = env["STRIPE_SECRET_KEY"];

if (!apiKey) {
  console.error("❌ STRIPE_SECRET_KEY não definida no .env.local");
  process.exit(1);
}

const stripeBin = findStripeBin();

console.log("🟡 [Stripe] Iniciando listener...\n");

const proc = spawn(
  stripeBin,
  ["listen", "--api-key", apiKey, "--forward-to", "localhost:3000/api/webhooks/stripe"],
  { stdio: "inherit", shell: false }
);

proc.on("error", (err) => {
  console.error("❌ Erro ao iniciar Stripe CLI:", err.message);
  process.exit(1);
});

proc.on("exit", (code) => {
  if (code !== 0 && code !== null) process.exit(code);
});
