import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../utils/constants';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidCnpj(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += Number(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
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

export function SignUpScreen({ navigation }: any) {
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1: Conta
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Empresa
  const [companyName, setCompanyName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function formatCnpj(text: string) {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 14) cleaned = cleaned.slice(0, 14);
    if (cleaned.length > 12) {
      return `${cleaned.slice(0,2)}.${cleaned.slice(2,5)}.${cleaned.slice(5,8)}/${cleaned.slice(8,12)}-${cleaned.slice(12)}`;
    }
    if (cleaned.length > 8) {
      return `${cleaned.slice(0,2)}.${cleaned.slice(2,5)}.${cleaned.slice(5,8)}/${cleaned.slice(8)}`;
    }
    if (cleaned.length > 5) {
      return `${cleaned.slice(0,2)}.${cleaned.slice(2,5)}.${cleaned.slice(5)}`;
    }
    if (cleaned.length > 2) {
      return `${cleaned.slice(0,2)}.${cleaned.slice(2)}`;
    }
    return cleaned;
  }

  function formatPhoneMask(text: string) {
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 11) cleaned = cleaned.slice(0, 11);
    if (cleaned.length > 6) {
      return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length > 2) {
      return `(${cleaned.slice(0,2)}) ${cleaned.slice(2)}`;
    }
    return cleaned;
  }

  function validateStep1(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Informe seu nome completo.';
    if (!email.trim()) errs.email = 'Informe seu e-mail.';
    else if (!EMAIL_REGEX.test(email.trim())) errs.email = 'E-mail inválido.';
    if (!password) errs.password = 'Informe sua senha.';
    else if (password.length < 6) errs.password = 'Mínimo 6 caracteres.';
    if (password !== confirmPassword) errs.confirmPassword = 'As senhas não coincidem.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2(): boolean {
    const errs: Record<string, string> = {};
    if (!companyName.trim()) errs.companyName = 'Informe a razão social.';
    if (!cnpj.trim()) errs.cnpj = 'Informe o CNPJ.';
    else if (!isValidCnpj(cnpj)) errs.cnpj = 'CNPJ inválido.';
    if (!phone.trim()) errs.phone = 'Informe o telefone.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateStep1()) setStep(2);
  }

  async function handleSignUp() {
    if (!validateStep2()) return;

    setLoading(true);
    try {
      // 1. Criar conta — os dados em `options.data` viram raw_user_meta_data
      // e são lidos pelo trigger handle_new_user() (0010_handle_new_user_trigger.sql),
      // que cria profiles/companies no insert do auth.users, sem depender de
      // sessão autenticada (não existe sessão ainda antes da confirmação de e-mail).
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name.trim(),
            phone: phone.replace(/\D/g, ''),
            user_type: 'transportadora',
            company_name: companyName.trim(),
            cnpj: cnpj.replace(/\D/g, '') || null,
            city: city.trim() || null,
            state: state.trim().toUpperCase() || null,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          Alert.alert('Erro', 'Este e-mail já está cadastrado. Tente fazer login.');
        } else {
          Alert.alert('Erro', authError.message);
        }
        return;
      }

      const userId = authData.user?.id;
      if (!userId) throw new Error('Falha ao criar conta');

      // 2. Fallback: se já existir sessão (ex: confirmação de e-mail desligada
      // no projeto), garante que os dados fiquem atualizados mesmo se o
      // trigger não rodar por algum motivo. Não bloqueia o cadastro se falhar
      // (o trigger é a fonte confiável), mas loga pra facilitar debug.
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: userId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.replace(/\D/g, ''),
        user_type: 'transportadora',
      });
      if (profileError) console.warn('[SignUp] Fallback profile upsert falhou (esperado sem sessão ainda):', profileError.message);

      const { error: companyError } = await supabase.from('companies').upsert({
        user_id: userId,
        company_name: companyName.trim(),
        company_type: 'transportadora',
        cnpj: cnpj.replace(/\D/g, '') || null,
        phone: phone.replace(/\D/g, ''),
        email: email.trim().toLowerCase(),
        address: city || state ? { city: city.trim(), state: state.trim().toUpperCase() } : null,
      }, { onConflict: 'user_id' });
      if (companyError) console.warn('[SignUp] Fallback company upsert falhou (esperado sem sessão ainda):', companyError.message);

      Alert.alert(
        'Conta Criada! 🎉',
        'Sua conta foi criada com sucesso. Verifique seu e-mail para confirmar o cadastro.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Falha ao criar conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.mainArea}>
          <Image source={require('../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />

          {/* Progress indicator */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          </View>

          <View style={styles.form}>
            <Text style={styles.welcome}>
              {step === 1 ? 'Criar Conta' : 'Dados da Empresa'}
            </Text>
            <Text style={styles.stepInfo}>
              {step === 1 ? 'Passo 1 de 2 — Informações pessoais' : 'Passo 2 de 2 — Informações da empresa'}
            </Text>

            {step === 1 ? (
              <>
                <InputField
                  label="Nome Completo"
                  icon="person-outline"
                  value={name}
                  onChangeText={v => { setName(v); if (errors.name) setErrors(e => ({...e, name: ''})); }}
                  placeholder="Seu nome completo"
                  error={errors.name}
                />
                <InputField
                  label="E-mail"
                  icon="mail-outline"
                  value={email}
                  onChangeText={v => { setEmail(v); if (errors.email) setErrors(e => ({...e, email: ''})); }}
                  placeholder="seu@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email}
                />
                <InputField
                  label="Senha"
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={v => { setPassword(v); if (errors.password) setErrors(e => ({...e, password: ''})); }}
                  placeholder="Mínimo 6 caracteres"
                  secureTextEntry={!showPassword}
                  error={errors.password}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  }
                />
                <InputField
                  label="Confirmar Senha"
                  icon="lock-closed-outline"
                  value={confirmPassword}
                  onChangeText={v => { setConfirmPassword(v); if (errors.confirmPassword) setErrors(e => ({...e, confirmPassword: ''})); }}
                  placeholder="Repita a senha"
                  secureTextEntry={!showPassword}
                  error={errors.confirmPassword}
                />

                <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>Próximo</Text>
                  <Ionicons name="arrow-forward" size={18} color="#fff" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <InputField
                  label="Razão Social / Nome da Empresa"
                  icon="business-outline"
                  value={companyName}
                  onChangeText={v => { setCompanyName(v); if (errors.companyName) setErrors(e => ({...e, companyName: ''})); }}
                  placeholder="Nome da empresa"
                  error={errors.companyName}
                />
                <InputField
                  label="CNPJ"
                  icon="card-outline"
                  value={cnpj}
                  onChangeText={v => setCnpj(formatCnpj(v))}
                  placeholder="00.000.000/0000-00"
                  keyboardType="numeric"
                  optional
                />
                <InputField
                  label="Telefone"
                  icon="call-outline"
                  value={phone}
                  onChangeText={v => { setPhone(formatPhoneMask(v)); if (errors.phone) setErrors(e => ({...e, phone: ''})); }}
                  placeholder="(00) 00000-0000"
                  keyboardType="phone-pad"
                  error={errors.phone}
                />

                <View style={styles.row}>
                  <View style={{ flex: 2, marginRight: 8 }}>
                    <InputField
                      label="Cidade"
                      icon="location-outline"
                      value={city}
                      onChangeText={setCity}
                      placeholder="Cidade"
                      optional
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <InputField
                      label="UF"
                      icon="map-outline"
                      value={state}
                      onChangeText={setState}
                      placeholder="SP"
                      maxLength={2}
                      autoCapitalize="characters"
                      optional
                    />
                  </View>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep(1)}>
                    <Ionicons name="arrow-back" size={18} color={COLORS.primary} />
                    <Text style={styles.secondaryBtnText}>Voltar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 2 }, loading && styles.primaryBtnDisabled]}
                    onPress={handleSignUp}
                    disabled={loading}
                    activeOpacity={0.85}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={styles.primaryBtnText}>Criar Conta</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.goBack()}>
              <Text style={styles.loginLinkText}>Já tem uma conta? <Text style={{ fontWeight: '700', color: COLORS.primary }}>Entrar</Text></Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer} numberOfLines={1} adjustsFontSizeToFit>
          © 2026 • Desenvolvido por Amplie Marketing. Todos os direitos reservados.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── InputField ──────────────────────────────────────────────────────────

function InputField({ label, icon, value, onChangeText, placeholder, keyboardType, secureTextEntry, autoCapitalize, maxLength, error, rightIcon, optional }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}
        {optional && <Text style={{ color: COLORS.textLight, fontWeight: '400' }}> (opcional)</Text>}
      </Text>
      <View style={[styles.inputWrapper, !!error && styles.inputWrapperError]}>
        <Ionicons name={icon} size={18} color={error ? COLORS.danger : COLORS.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize || 'sentences'}
          autoCorrect={false}
          maxLength={maxLength}
        />
        {rightIcon}
      </View>
      {!!error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  logoImage: {
    width: 220,
    height: 52,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  progressDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: COLORS.border,
    borderWidth: 2, borderColor: COLORS.border,
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressLine: {
    width: 80, height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 1.5,
  },
  progressLineActive: {
    backgroundColor: COLORS.primary,
  },
  form: {
    gap: 14,
    alignSelf: 'stretch',
  },
  welcome: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
  },
  stepInfo: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  inputGroup: { gap: 5 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    height: 48,
  },
  inputWrapperError: { borderColor: COLORS.danger },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  eyeBtn: { padding: 4 },
  fieldError: { fontSize: 12, color: COLORS.danger, marginTop: 1 },
  row: { flexDirection: 'row' },
  btnRow: { flexDirection: 'row', gap: 10 },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    flex: 1,
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  loginLink: {
    alignSelf: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footer: {
    textAlign: 'center',
    fontSize: 9,
    color: 'rgba(0,0,0,0.35)',
    marginTop: 12,
  },
});
