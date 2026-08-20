/**
 * Creates (or promotes) an admin user.
 *
 * Usage:
 *   node scripts/create-admin-user.js <email> <password> [name] [user_type]
 *
 * Requires these env vars. It's fine to add SUPABASE_SERVICE_ROLE_KEY to the
 * project's .env (that file is gitignored and not committed) as long as it
 * is NOT prefixed with EXPO_PUBLIC_ — that prefix is what Expo bundles into
 * the mobile app, and the service_role key must never ship on-device.
 *   EXPO_PUBLIC_SUPABASE_URL      (already in .env)
 *   SUPABASE_SERVICE_ROLE_KEY     (Project Settings -> API -> service_role)
 *
 * Example:
 *   SUPABASE_SERVICE_ROLE_KEY=xxxx node scripts/create-admin-user.js admin@empresa.com "SenhaForte123!" "Admin"
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadDotEnvFallback() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadDotEnvFallback();

const [, , email, password, name = 'Admin', userType = 'transportadora'] = process.argv;

if (!email || !password) {
  console.error('Uso: node scripts/create-admin-user.js <email> <senha> [nome] [user_type]');
  process.exit(1);
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltam variaveis de ambiente: EXPO_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  let userId;
  if (createError) {
    if (!createError.message.includes('already been registered')) {
      throw createError;
    }
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;
    const existing = list.users.find((u) => u.email === email);
    if (!existing) throw new Error('Usuario ja existe mas nao foi encontrado na listagem.');
    userId = existing.id;
    console.log(`Usuario ja existia (${email}), promovendo a admin.`);
  } else {
    userId = created.user.id;
    console.log(`Usuario criado (${email}).`);
  }

  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, name, user_type: userType, is_admin: true }, { onConflict: 'id' });

  if (upsertError) throw upsertError;

  console.log(`Perfil admin pronto para ${email} (id: ${userId}).`);
}

main().catch((err) => {
  console.error('Falhou:', err.message || err);
  process.exit(1);
});
