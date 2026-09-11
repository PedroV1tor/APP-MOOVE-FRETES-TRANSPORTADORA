/**
 * Helpers de validação/máscara para o cadastro (motorista e transportadora).
 * Porta as mesmas regras do painel web (UnifiedRegistration.tsx + utils/formatters.ts)
 * para manter os dois cadastros consistentes.
 */

export function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

// ── Máscaras ────────────────────────────────────────────────────────────

export function maskCPF(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length > 9) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  if (d.length > 6) return d.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (d.length > 3) return d.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  return d;
}

export function maskCNPJ(value: string): string {
  const d = onlyDigits(value).slice(0, 14);
  if (d.length > 12) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, '$1.$2.$3/$4-$5');
  if (d.length > 8) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, '$1.$2.$3/$4');
  if (d.length > 5) return d.replace(/(\d{2})(\d{3})(\d{1,3})/, '$1.$2.$3');
  if (d.length > 2) return d.replace(/(\d{2})(\d{1,3})/, '$1.$2');
  return d;
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length > 6) return d.replace(/(\d{2})(\d{4,5})(\d{0,4})/, (_m, a, b, c) => c ? `(${a}) ${b}-${c}` : `(${a}) ${b}`);
  if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return d;
}

export function maskCEP(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length > 5) return `${d.slice(0, 5)}-${d.slice(5)}`;
  return d;
}

export function maskRG(value: string): string {
  return value.slice(0, 15);
}

export function maskPlate(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
}

/** DD/MM/AAAA enquanto digita, só dígitos por baixo (mesmo padrão do CreateFreightScreen). */
export function maskDateBr(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
  if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return d;
}

// ── Conversão de data ──────────────────────────────────────────────────

/** "DD/MM/AAAA" -> "AAAA-MM-DD" (ISO), ou null se inválida/incompleta. */
export function brDateToISO(value: string): string | null {
  const m = (value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const day = parseInt(dd, 10);
  const month = parseInt(mm, 10);
  const year = parseInt(yyyy, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null;
  // valida dia real do mês (ex: 31/02 não existe)
  const d = new Date(year, month - 1, day);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return `${yyyy}-${mm}-${dd}`;
}

export function isAdultBr(value: string, minAge = 18): boolean {
  const iso = brDateToISO(value);
  if (!iso) return false;
  const birth = new Date(`${iso}T00:00:00`);
  const today = new Date();
  if (birth > today) return false;
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age >= minAge;
}

export function isNotExpiredBr(value: string): boolean {
  const iso = brDateToISO(value);
  if (!iso) return false;
  const d = new Date(`${iso}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

// ── Validação de dígito verificador ───────────────────────────────────

export function validateCPF(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d.charAt(i)) * (10 - i);
  let rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(d.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d.charAt(i)) * (11 - i);
  rem = (sum * 10) % 11;
  if (rem === 10 || rem === 11) rem = 0;
  if (rem !== parseInt(d.charAt(10))) return false;

  return true;
}

export function validateCNPJ(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;

  let size = d.length - 2;
  let numbers = d.substring(0, size);
  const digits = d.substring(size);
  let sum = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;

  size += 1;
  numbers = d.substring(0, size);
  sum = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(1))) return false;

  return true;
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Placa Mercosul (AAA9A99) ou padrão antigo (AAA9999). */
export function isValidPlate(value: string): boolean {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(cleaned);
}

export function inRange(value: string, min: number, max: number): boolean {
  const len = (value || '').trim().length;
  return len >= min && len <= max;
}

export function isValidYear(value: string): boolean {
  return /^(19[5-9]\d|20\d{2})$/.test((value || '').trim());
}

// ── Senha ───────────────────────────────────────────────────────────────

export interface PasswordStrength {
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  isStrong: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return {
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    isStrong: hasMinLength && hasUpperCase && hasLowerCase && hasNumber,
  };
}

// ── CEP lookup (ViaCEP — mesma API usada no painel) ──────────────────────

export interface CepAddress {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function lookupCEP(cep: string): Promise<CepAddress | null> {
  const cleaned = onlyDigits(cep);
  if (cleaned.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
    const data = await response.json();
    if (data?.erro) return null;
    return data as CepAddress;
  } catch {
    return null;
  }
}

// ── CNPJ lookup (BrasilAPI — mesma fonte usada no painel) ────────────────

export interface CnpjCompanyData {
  razao_social: string;
  nome_fantasia?: string;
  logradouro: string;
  numero: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  telefone?: string;
  email?: string;
  situacao: string;
}

/**
 * Consulta dados públicos da Receita Federal via BrasilAPI (sem chave).
 * Retorna null se o CNPJ não existir na base ou o serviço estiver fora do ar
 * — nesse caso o usuário simplesmente preenche os campos manualmente.
 */
export async function lookupCNPJ(cnpj: string): Promise<CnpjCompanyData | null> {
  const cleaned = onlyDigits(cnpj);
  if (!validateCNPJ(cleaned)) return null;

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleaned}`);
    if (!response.ok) return null;
    const data = await response.json();

    return {
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || undefined,
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      cep: data.cep ? maskCEP(String(data.cep)) : '',
      telefone: data.ddd_telefone_1 || undefined,
      email: data.email || undefined,
      situacao: data.descricao_situacao_cadastral || '',
    };
  } catch {
    return null;
  }
}

// ── Listas fixas (mesmas do painel) ───────────────────────────────────

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

export const CNH_CATEGORIES = ['A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE'];

export const REPRESENTATIVE_ROLES = ['Sócio', 'Diretor', 'Procurador', 'Administrador', 'Proprietário'];

export const VEHICLE_TYPE_OPTIONS = [
  '3/4', 'Fiorino', 'Toco', 'VLC', 'Bitruck', 'Truck',
  'Bitrem', 'Carreta', 'Carreta LS', 'Rodotrem', 'Vanderleia',
];

export const BODY_TYPE_OPTIONS = [
  'Baú', 'Baú Frigorífico', 'Baú Refrigerado', 'Sider',
  'Caçamba', 'Grade Baixa', 'Graneleiro', 'Plataforma', 'Prancha',
  'Apenas Cavalo', 'Bug Porta Container', 'Cavaqueira', 'Cegonheiro', 'Gaiola', 'Hopper', 'Munck', 'Silo', 'Tanque',
];
