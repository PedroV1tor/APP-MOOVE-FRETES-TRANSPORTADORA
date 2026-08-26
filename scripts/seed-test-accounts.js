/**
 * Cria 3 contas de teste no banco novo (unificado): admin, motorista e
 * transportadora — com senha fixa, só para testar o painel e o app.
 *
 * Uso:
 *   SUPABASE_SERVICE_ROLE_KEY=xxxx node scripts/seed-test-accounts.js
 *
 * Requer (mesma convenção do create-admin-user.js):
 *   EXPO_PUBLIC_SUPABASE_URL   (já está em APP-MOOVE-FRETES-TRANSPORTADORA/.env)
 *   SUPABASE_SERVICE_ROLE_KEY  (Project Settings -> API -> service_role;
 *                               NUNCA prefixar com EXPO_PUBLIC_)
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

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltam variaveis de ambiente: EXPO_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = 'Teste123!';

const ACCOUNTS = [
  { key: 'admin', email: 'admin@moovefretes.test', name: 'Admin Teste', userType: 'transportadora', isAdmin: true },
  { key: 'motorista', email: 'motorista@moovefretes.test', name: 'Motorista Teste', userType: 'caminhoneiro', isAdmin: false },
  { key: 'transportadora', email: 'transportadora@moovefretes.test', name: 'Transportadora Teste', userType: 'transportadora', isAdmin: false },
];

async function getOrCreateUser(email) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });

  if (!createError) return created.user.id;

  if (!createError.message.includes('already been registered')) throw createError;

  const { data: list, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = list.users.find((u) => u.email === email);
  if (!existing) throw new Error(`Usuario ${email} ja existe mas nao foi encontrado na listagem.`);
  return existing.id;
}

async function main() {
  for (const account of ACCOUNTS) {
    const userId = await getOrCreateUser(account.email);

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, email: account.email, name: account.name, user_type: account.userType, is_admin: account.isAdmin },
        { onConflict: 'id' }
      );
    if (profileError) throw profileError;

    if (account.key === 'motorista') {
      const { error: driverError } = await supabase
        .from('drivers')
        .upsert({ user_id: userId, name: account.name, cnh_category: 'E' }, { onConflict: 'user_id' });
      if (driverError) throw driverError;
    }

    if (account.key === 'transportadora') {
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingCompany) {
        const { error: companyError } = await supabase
          .from('companies')
          .insert({ user_id: userId, company_name: account.name, company_type: 'transportadora' });
        if (companyError) throw companyError;
      }
    }

    console.log(`✔ ${account.key}: ${account.email} / ${PASSWORD} (id: ${userId})`);
  }

  console.log('\nPronto. Use essas credenciais para logar no painel e no app.');
}

main().catch((err) => {
  console.error('Falhou:', err.message || err);
  process.exit(1);
});
