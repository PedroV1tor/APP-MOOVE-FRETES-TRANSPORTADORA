import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../utils/constants';
import { TextField, PasswordField, WizardHeader } from '../../components/registration/RegistrationField';
import { PickerSelect } from '../../components/freights/FormComponents';
import { DocumentSlot } from '../../components/registration/DocumentSlot';
import { TermsModal } from '../../components/registration/TermsModal';
import { uploadAvatarAsset, uploadDocumentAsset, registerDocumentForReview } from '../../utils/registrationUpload';
import type { PickedFile } from '../../utils/registrationUpload';
import {
  onlyDigits, maskCPF, maskCNPJ, maskPhone, maskCEP, maskRG, maskPlate, maskDateBr,
  brDateToISO, isAdultBr, isNotExpiredBr, validateCPF, validateCNPJ, isValidEmail, isValidPlate,
  inRange, isValidYear, checkPasswordStrength, lookupCEP, lookupCNPJ, BRAZILIAN_STATES, CNH_CATEGORIES,
  REPRESENTATIVE_ROLES, VEHICLE_TYPE_OPTIONS, BODY_TYPE_OPTIONS,
} from '../../utils/registrationHelpers';

type Step = 'credentials' | 'address' | 'specific' | 'documents';

const STEP_META: Record<Step, { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  credentials: { label: 'Dados', icon: 'person-outline' },
  address: { label: 'Endereço', icon: 'location-outline' },
  specific: { label: '', icon: 'car-outline' },
  documents: { label: 'Documentos', icon: 'document-text-outline' },
};

export function SignUpScreen({ navigation, route }: any) {
  const insets = useSafeAreaInsets();
  const userType: 'caminhoneiro' | 'transportadora' =
    route?.params?.userType === 'caminhoneiro' ? 'caminhoneiro' : 'transportadora';

  const [currentStep, setCurrentStep] = useState<Step>('credentials');
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // ── Credenciais ──────────────────────────────────────────────────────
  const [profilePhoto, setProfilePhoto] = useState<PickedFile | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const emailTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Endereço ─────────────────────────────────────────────────────────
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const cepLookedUp = useRef('');

  // ── Específico — Motorista ──────────────────────────────────────────
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [cnh, setCnh] = useState('');
  const [cnhCategory, setCnhCategory] = useState('');
  const [cnhValidity, setCnhValidity] = useState('');
  const [rntrc, setRntrc] = useState('');
  const [rntrcValidity, setRntrcValidity] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [bodyType, setBodyType] = useState('');

  // ── Específico — Empresa ─────────────────────────────────────────────
  const [cnpj, setCnpj] = useState('');
  const [cnpjLookupStatus, setCnpjLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'warning'>('idle');
  const [cnpjLookupMessage, setCnpjLookupMessage] = useState('');
  const cnpjLookedUp = useRef('');
  const [companyName, setCompanyName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [stateRegistration, setStateRegistration] = useState('');
  const [isentoIE, setIsentoIE] = useState(false);
  const [municipalRegistration, setMunicipalRegistration] = useState('');
  const [representativeName, setRepresentativeName] = useState('');
  const [representativeCpf, setRepresentativeCpf] = useState('');
  const [representativeRg, setRepresentativeRg] = useState('');
  const [representativeRole, setRepresentativeRole] = useState('');
  const [companyRntrc, setCompanyRntrc] = useState('');
  const [companyRntrcValidity, setCompanyRntrcValidity] = useState('');

  // ── Documentos ───────────────────────────────────────────────────────
  const [rgDoc, setRgDoc] = useState<PickedFile | null>(null);
  const [cpfDoc, setCpfDoc] = useState<PickedFile | null>(null);
  const [cnhDoc, setCnhDoc] = useState<PickedFile | null>(null);
  const [rntrcDoc, setRntrcDoc] = useState<PickedFile | null>(null);
  const [vehicleDoc, setVehicleDoc] = useState<PickedFile | null>(null);
  const [addressDoc, setAddressDoc] = useState<PickedFile | null>(null);
  const [selfieDoc, setSelfieDoc] = useState<PickedFile | null>(null);
  const [cnpjDoc, setCnpjDoc] = useState<PickedFile | null>(null);
  const [contractDoc, setContractDoc] = useState<PickedFile | null>(null);

  const steps: Step[] = ['credentials', 'address', 'specific', 'documents'];
  const currentIndex = steps.indexOf(currentStep);
  const isLastStep = currentIndex === steps.length - 1;

  const wizardSteps = steps.map(id => ({
    label: id === 'specific' ? (userType === 'caminhoneiro' ? 'Veículo' : 'Empresa') : STEP_META[id].label,
    icon: id === 'specific' ? (userType === 'caminhoneiro' ? 'car-outline' as const : 'business-outline' as const) : STEP_META[id].icon,
  }));

  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  // ── Verificação de e-mail (debounced) ──────────────────────────────
  useEffect(() => {
    if (emailTimeout.current) clearTimeout(emailTimeout.current);
    setEmailAvailable(null);
    if (!isValidEmail(email)) return;
    emailTimeout.current = setTimeout(() => checkEmail(email), 800);
    return () => { if (emailTimeout.current) clearTimeout(emailTimeout.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function checkEmail(value: string) {
    setCheckingEmail(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', value.trim().toLowerCase())
        .maybeSingle();
      if (error) {
        // Falha de rede: não bloquear o usuário — o signUp rejeita duplicado de qualquer forma.
        setEmailAvailable(true);
      } else {
        setEmailAvailable(!data);
      }
    } catch {
      setEmailAvailable(true);
    } finally {
      setCheckingEmail(false);
    }
  }

  // ── CEP → preenchimento automático ──────────────────────────────────
  useEffect(() => {
    const digits = onlyDigits(cep);
    if (digits.length !== 8 || cepLookedUp.current === digits) return;
    cepLookedUp.current = digits;
    lookupCEP(digits).then(addr => {
      if (!addr) return;
      setStreet(addr.logradouro || '');
      setNeighborhood(addr.bairro || '');
      setCity(addr.localidade || '');
      setUf(addr.uf || '');
    });
  }, [cep]);

  // ── CNPJ → preenchimento automático (BrasilAPI / Receita Federal) ────
  useEffect(() => {
    const digits = onlyDigits(cnpj);
    if (digits.length !== 14 || cnpjLookedUp.current === digits) return;
    if (!validateCNPJ(digits)) return;
    cnpjLookedUp.current = digits;
    setCnpjLookupStatus('loading');
    setCnpjLookupMessage('Buscando dados na Receita Federal...');
    lookupCNPJ(digits).then(data => {
      if (!data) {
        setCnpjLookupStatus('not_found');
        setCnpjLookupMessage('CNPJ válido, mas não encontrado na Receita — preencha os dados manualmente.');
        return;
      }
      setCompanyName(data.razao_social || '');
      setTradeName(data.nome_fantasia || '');
      setStreet(data.logradouro || '');
      setNumber(data.numero || '');
      setNeighborhood(data.bairro || '');
      setCity(data.municipio || '');
      setUf(data.uf || '');
      if (data.cep) setCep(data.cep);

      const situacaoAtiva = !data.situacao || data.situacao.toUpperCase() === 'ATIVA';
      if (situacaoAtiva) {
        setCnpjLookupStatus('found');
        setCnpjLookupMessage('Dados encontrados na Receita Federal.');
      } else {
        setCnpjLookupStatus('warning');
        setCnpjLookupMessage(`Atenção: situação cadastral "${data.situacao}" na Receita Federal.`);
      }
    });
  }, [cnpj]);

  // ── Validação por etapa ──────────────────────────────────────────────
  function isCredentialsValid() {
    const base =
      inRange(name, 3, 100) &&
      onlyDigits(phone).length >= 10 && onlyDigits(phone).length <= 11 &&
      isValidEmail(email) && email.trim().length <= 150 && emailAvailable === true &&
      passwordStrength.isStrong && password.length <= 72 &&
      passwordsMatch && acceptedTerms;
    return userType === 'caminhoneiro' ? base && profilePhoto !== null : base;
  }

  function isAddressValid() {
    return onlyDigits(cep).length === 8 &&
      inRange(street, 3, 150) && inRange(number, 1, 10) &&
      inRange(neighborhood, 2, 100) && inRange(city, 2, 100) && uf.length === 2;
  }

  function isSpecificValid() {
    if (userType === 'caminhoneiro') {
      return validateCPF(cpf) && inRange(rg, 5, 15) && isAdultBr(birthDate, 18) &&
        onlyDigits(cnh).length === 11 && cnhCategory.length > 0 && isNotExpiredBr(cnhValidity) &&
        inRange(onlyDigits(rntrc), 8, 9) && isNotExpiredBr(rntrcValidity) &&
        isValidPlate(vehiclePlate) && inRange(vehicleModel, 2, 60) && isValidYear(vehicleYear) &&
        vehicleType.length > 0 && bodyType.length > 0;
    }
    return validateCNPJ(cnpj) && inRange(companyName, 2, 150) &&
      inRange(representativeName, 3, 100) && validateCPF(representativeCpf) &&
      inRange(representativeRg, 5, 15) && inRange(representativeRole, 2, 60) &&
      (isentoIE || stateRegistration.trim().length > 0) &&
      inRange(onlyDigits(companyRntrc), 8, 9) && isNotExpiredBr(companyRntrcValidity);
  }

  function isDocumentsValid() {
    if (userType === 'caminhoneiro') {
      return !!(rgDoc && cpfDoc && cnhDoc && rntrcDoc && vehicleDoc && addressDoc && selfieDoc);
    }
    return !!(cnpjDoc && contractDoc && addressDoc && rntrcDoc);
  }

  function missingForStep(step: Step): string[] {
    const missing: string[] = [];
    if (step === 'credentials') {
      if (!inRange(name, 3, 100)) missing.push('nome completo (3 a 100 caracteres)');
      const digits = onlyDigits(phone);
      if (digits.length < 10 || digits.length > 11) missing.push('telefone (DDD + número)');
      if (!isValidEmail(email)) missing.push('e-mail válido');
      else if (emailAvailable === false) missing.push('e-mail já cadastrado');
      else if (emailAvailable === null || checkingEmail) missing.push('aguarde a verificação do e-mail');
      if (!passwordStrength.isStrong) missing.push('senha forte (8+ caracteres, maiúscula, minúscula e número)');
      if (!passwordsMatch) missing.push('confirmação de senha');
      if (!acceptedTerms) missing.push('aceite dos termos de uso');
      if (userType === 'caminhoneiro' && !profilePhoto) missing.push('foto de perfil');
    } else if (step === 'address') {
      if (onlyDigits(cep).length !== 8) missing.push('CEP');
      if (!inRange(street, 3, 150)) missing.push('rua/avenida');
      if (!inRange(number, 1, 10)) missing.push('número');
      if (!inRange(neighborhood, 2, 100)) missing.push('bairro');
      if (!inRange(city, 2, 100)) missing.push('cidade');
      if (uf.length !== 2) missing.push('estado');
    } else if (step === 'specific') {
      if (userType === 'caminhoneiro') {
        if (!validateCPF(cpf)) missing.push('CPF válido');
        if (!inRange(rg, 5, 15)) missing.push('RG');
        if (!isAdultBr(birthDate, 18)) missing.push('data de nascimento (maior de 18 anos)');
        if (onlyDigits(cnh).length !== 11) missing.push('número da CNH (11 dígitos)');
        if (!cnhCategory) missing.push('categoria da CNH');
        if (!isNotExpiredBr(cnhValidity)) missing.push('validade da CNH (não vencida)');
        if (!inRange(onlyDigits(rntrc), 8, 9)) missing.push('RNTRC (8 a 9 dígitos)');
        if (!isNotExpiredBr(rntrcValidity)) missing.push('validade do RNTRC (não vencida)');
        if (!isValidPlate(vehiclePlate)) missing.push('placa do veículo');
        if (!inRange(vehicleModel, 2, 60)) missing.push('modelo do veículo');
        if (!isValidYear(vehicleYear)) missing.push('ano do veículo');
        if (!vehicleType) missing.push('tipo de veículo');
        if (!bodyType) missing.push('tipo de carroceria');
      } else {
        if (!validateCNPJ(cnpj)) missing.push('CNPJ válido');
        if (!inRange(companyName, 2, 150)) missing.push('razão social');
        if (!inRange(representativeName, 3, 100)) missing.push('nome do representante');
        if (!validateCPF(representativeCpf)) missing.push('CPF do representante válido');
        if (!inRange(representativeRg, 5, 15)) missing.push('RG do representante');
        if (!inRange(representativeRole, 2, 60)) missing.push('vínculo do representante');
        if (!isentoIE && !stateRegistration.trim()) missing.push('inscrição estadual (ou marque isento)');
        if (!inRange(onlyDigits(companyRntrc), 8, 9)) missing.push('RNTRC da empresa');
        if (!isNotExpiredBr(companyRntrcValidity)) missing.push('validade do RNTRC da empresa');
      }
    } else {
      if (userType === 'caminhoneiro') {
        if (!rgDoc) missing.push('foto do RG');
        if (!cpfDoc) missing.push('foto do CPF');
        if (!cnhDoc) missing.push('foto da CNH');
        if (!rntrcDoc) missing.push('foto do RNTRC');
        if (!vehicleDoc) missing.push('CRLV do veículo');
        if (!addressDoc) missing.push('comprovante de endereço');
        if (!selfieDoc) missing.push('selfie segurando o RG');
      } else {
        if (!cnpjDoc) missing.push('cartão CNPJ');
        if (!contractDoc) missing.push('contrato social');
        if (!addressDoc) missing.push('comprovante de endereço');
        if (!rntrcDoc) missing.push('certificado RNTRC');
      }
    }
    return missing;
  }

  function canProceed(): boolean {
    if (currentStep === 'credentials') return isCredentialsValid();
    if (currentStep === 'address') return isAddressValid();
    if (currentStep === 'specific') return isSpecificValid();
    return isDocumentsValid();
  }

  function handleNext() {
    if (!canProceed()) {
      const missing = missingForStep(currentStep);
      Alert.alert('Falta preencher', missing.length ? `• ${missing.join('\n• ')}` : 'Preencha todos os campos obrigatórios.');
      return;
    }
    if (isLastStep) {
      handleSubmit();
      return;
    }
    setCurrentStep(steps[currentIndex + 1]);
  }

  function handleBack() {
    if (currentIndex === 0) {
      navigation.goBack();
      return;
    }
    setCurrentStep(steps[currentIndex - 1]);
  }

  // ── Envio final ──────────────────────────────────────────────────────
  async function handleSubmit() {
    setLoading(true);
    let authUserId: string | null = null;

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();
      if (existingProfile) throw new Error('Este email já está cadastrado. Faça login ou use outro email.');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: { data: { user_type: userType, email: email.trim().toLowerCase() } },
      });
      if (authError || !authData.user) throw new Error(authError?.message || 'Erro ao criar usuário');

      const userId = authData.user.id;
      authUserId = userId;

      // Aguarda a sessão/trigger handle_new_user() sincronizarem antes de escrever.
      await new Promise(resolve => setTimeout(resolve, 1500));

      const displayName = userType === 'caminhoneiro' ? name.trim() : companyName.trim();
      await supabase.auth.updateUser({
        data: { display_name: displayName, phone: onlyDigits(phone), user_type: userType },
      });

      let avatarPath: string | undefined;
      if (profilePhoto) {
        const result = await uploadAvatarAsset(userId, profilePhoto);
        if (result.success && result.path) avatarPath = result.path;
      }

      const docsToUpload: { file: PickedFile | null; key: string }[] = userType === 'caminhoneiro'
        ? [
            { file: rgDoc, key: 'rg' },
            { file: cpfDoc, key: 'cpf' },
            { file: cnhDoc, key: 'cnh' },
            { file: rntrcDoc, key: 'rntrc' },
            { file: vehicleDoc, key: 'vehicleDocument' },
            { file: addressDoc, key: 'addressProof' },
            { file: selfieDoc, key: 'selfie' },
          ]
        : [
            { file: cnpjDoc, key: 'cnpjDocument' },
            { file: contractDoc, key: 'contractSocial' },
            { file: addressDoc, key: 'addressProof' },
            { file: rntrcDoc, key: 'rntrc' },
          ];

      for (const doc of docsToUpload) {
        if (!doc.file) continue;
        const result = await uploadDocumentAsset(userId, doc.key, doc.file);
        if (result.success && result.path) {
          await registerDocumentForReview({
            userId, ownerType: userType === 'caminhoneiro' ? 'driver' : 'company',
            documentType: doc.key, filePath: result.path,
          });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const addressJson = {
        cep: onlyDigits(cep), street: street.trim(), number: number.trim(),
        complement: complement.trim(), neighborhood: neighborhood.trim(), city: city.trim(), state: uf.trim(),
      };

      const profileData = {
        id: userId,
        email: email.trim().toLowerCase(),
        user_type: userType,
        name: displayName || null,
        phone: onlyDigits(phone) || null,
        cpf: userType === 'caminhoneiro' ? (onlyDigits(cpf) || null) : null,
        cnpj: userType !== 'caminhoneiro' ? (onlyDigits(cnpj) || null) : null,
        city: city.trim() || null,
        state: uf.trim() || null,
        avatar_url: avatarPath || null,
        // Diferente do painel web: aqui NÃO auto-verificamos a conta. O cadastro
        // fica "pending" até um admin revisar os documentos enviados.
        verification_status: 'pending',
        status: 'active',
        email_verified: false,
        updated_at: new Date().toISOString(),
      };
      const { error: profileError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
      if (profileError) throw new Error('Erro ao salvar perfil: ' + profileError.message);

      await new Promise(resolve => setTimeout(resolve, 500));

      if (userType === 'caminhoneiro') {
        const driverData = {
          user_id: userId,
          name: name.trim() || null,
          cpf: onlyDigits(cpf) || null,
          birth_date: brDateToISO(birthDate),
          phone: onlyDigits(phone) || null,
          cnh: cnh.trim() || null,
          cnh_category: cnhCategory || 'B',
          cnh_expiry: brDateToISO(cnhValidity),
          address: addressJson,
          vehicle_plate: vehiclePlate.trim() || null,
          vehicle_model: vehicleModel.trim() || null,
          vehicle_year: vehicleYear.trim() || null,
          vehicle_types: vehicleType ? [vehicleType] : null,
          body_types: bodyType ? [bodyType] : null,
          vehicle_type: vehicleType || null,
          available: true,
          profile_image: avatarPath || null,
          rg: rg.trim() || null,
          rntrc: rntrc.trim() || null,
          rntrc_expiry: brDateToISO(rntrcValidity),
          updated_at: new Date().toISOString(),
        };
        const { error: driverError } = await supabase.from('drivers').upsert(driverData, { onConflict: 'user_id' });
        if (driverError) throw new Error('Erro ao salvar dados do motorista: ' + driverError.message);
      } else {
        const companyData = {
          user_id: userId,
          company_name: companyName.trim() || null,
          cnpj: onlyDigits(cnpj) || null,
          trading_name: tradeName.trim() || companyName.trim() || null,
          company_type: userType,
          rntrc: companyRntrc.trim() || null,
          phone: onlyDigits(phone) || null,
          email: email.trim().toLowerCase() || null,
          address: addressJson,
          representative_name: representativeName.trim() || null,
          representative_cpf: onlyDigits(representativeCpf) || null,
          representative_email: email.trim().toLowerCase() || null,
          representative_phone: onlyDigits(phone) || null,
          representative_role: representativeRole || 'Representante Legal',
          representative_rg: representativeRg.trim() || null,
          state_registration: isentoIE ? 'ISENTO' : (stateRegistration.trim() || null),
          municipal_registration: municipalRegistration.trim() || null,
          rntrc_expiry: brDateToISO(companyRntrcValidity),
          operating_states: [uf.trim()],
          is_individual: false,
          main_cpf: onlyDigits(representativeCpf) || null,
          logo_url: avatarPath || null,
          updated_at: new Date().toISOString(),
        };
        const { error: companyError } = await supabase.from('companies').upsert(companyData, { onConflict: 'user_id' });
        if (companyError) throw new Error('Erro ao salvar dados da empresa: ' + companyError.message);
      }

      Alert.alert(
        'Cadastro completo!',
        'Bem-vindo ao MooveFretes! Seus documentos entraram na fila de verificação.',
      );
      // Não navega manualmente: o AuthContext detecta a sessão criada e troca
      // de tela sozinho (mesmo mecanismo do login).
    } catch (error: any) {
      if (authUserId) {
        try {
          if (userType === 'caminhoneiro') {
            await supabase.from('drivers').delete().eq('user_id', authUserId);
          } else {
            await supabase.from('companies').delete().eq('user_id', authUserId);
          }
          await supabase.from('profiles').delete().eq('id', authUserId);
          await supabase.auth.signOut();
        } catch {
          // rollback best-effort
        }
      }
      const msg = error?.message || 'Erro ao salvar dados';
      if (msg.includes('already registered') || msg.includes('já está cadastrado')) {
        Alert.alert('Erro', 'Este e-mail já está cadastrado. Faça login ou use outro email.');
      } else {
        Alert.alert('Erro ao criar conta', msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Render de cada etapa ─────────────────────────────────────────────

  function renderCredentials() {
    return (
      <View style={styles.stepBody}>
        <DocumentSlot
          label={userType === 'caminhoneiro' ? 'Foto de Perfil' : 'Logo da Empresa (opcional)'}
          required={userType === 'caminhoneiro'}
          value={profilePhoto}
          onChange={setProfilePhoto}
          imageOnly
          round
        />
        <TextField label="Nome Completo" icon="person-outline" value={name} onChangeText={setName} placeholder="Digite seu nome completo" required maxLength={100} />
        <TextField label="Telefone" icon="call-outline" value={phone} onChangeText={t => setPhone(maskPhone(t))} placeholder="(00) 00000-0000" keyboardType="phone-pad" required maxLength={16} />
        <TextField
          label="E-mail" icon="mail-outline" value={email}
          onChangeText={t => { setEmail(t); setEmailTouched(true); }}
          placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" required maxLength={150}
          rightIcon={checkingEmail ? <ActivityIndicator size="small" color={COLORS.primary} /> : emailTouched && isValidEmail(email) ? (
            <Ionicons name={emailAvailable === true ? 'checkmark-circle' : emailAvailable === false ? 'close-circle' : 'help-circle-outline'} size={18} color={emailAvailable === true ? COLORS.success : emailAvailable === false ? COLORS.danger : COLORS.textLight} />
          ) : undefined}
          error={emailTouched && email.length > 0 && !isValidEmail(email) ? 'E-mail inválido' : emailAvailable === false ? 'Este e-mail já está cadastrado' : undefined}
        />
        <PasswordField label="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" showStrength />
        <PasswordField
          label="Confirmar Senha" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Digite a senha novamente"
          error={confirmPassword.length > 0 && !passwordsMatch ? 'As senhas não conferem' : undefined}
        />
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setAcceptedTerms(!acceptedTerms)} activeOpacity={0.7}>
          <Ionicons name={acceptedTerms ? 'checkbox' : 'square-outline'} size={20} color={acceptedTerms ? COLORS.primary : COLORS.textLight} />
          <Text style={styles.checkboxLabel}>
            Aceito os <Text style={styles.link} onPress={() => setShowTerms(true)}>Termos de Uso</Text> e concordo com o processamento dos meus dados
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderAddress() {
    return (
      <View style={styles.stepBody}>
        <TextField label="CEP" icon="location-outline" value={cep} onChangeText={t => setCep(maskCEP(t))} placeholder="00000-000" keyboardType="numeric" required maxLength={9} />
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <TextField label="Rua/Avenida" value={street} onChangeText={setStreet} placeholder="Nome da rua" required maxLength={150} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Número" value={number} onChangeText={setNumber} placeholder="Nº" keyboardType="numeric" required maxLength={10} />
          </View>
        </View>
        <TextField label="Complemento" value={complement} onChangeText={setComplement} placeholder="Apto, sala, etc." optional maxLength={60} />
        <TextField label="Bairro" value={neighborhood} onChangeText={setNeighborhood} placeholder="Nome do bairro" required maxLength={100} />
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <TextField label="Cidade" value={city} onChangeText={setCity} placeholder="Nome da cidade" required maxLength={100} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickerLabel}>Estado *</Text>
            <PickerSelect value={uf} options={BRAZILIAN_STATES} placeholder="UF" onSelect={setUf} />
          </View>
        </View>
      </View>
    );
  }

  function renderSpecificDriver() {
    return (
      <View style={styles.stepBody}>
        <TextField label="CPF" icon="card-outline" value={cpf} onChangeText={t => setCpf(maskCPF(t))} placeholder="000.000.000-00" keyboardType="numeric" required maxLength={14} />
        <TextField label="RG" value={rg} onChangeText={t => setRg(maskRG(t))} placeholder="00.000.000-0" required maxLength={15} />
        <TextField label="Data de Nascimento" value={birthDate} onChangeText={t => setBirthDate(maskDateBr(t))} placeholder="DD/MM/AAAA" keyboardType="numeric" required maxLength={10} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextField label="CNH (número)" value={cnh} onChangeText={t => setCnh(onlyDigits(t).slice(0, 11))} placeholder="11 dígitos" keyboardType="numeric" required maxLength={11} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickerLabel}>Categoria *</Text>
            <PickerSelect value={cnhCategory} options={CNH_CATEGORIES} placeholder="Selecione" onSelect={setCnhCategory} />
          </View>
        </View>
        <TextField label="Validade da CNH" value={cnhValidity} onChangeText={t => setCnhValidity(maskDateBr(t))} placeholder="DD/MM/AAAA" keyboardType="numeric" required maxLength={10} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextField label="RNTRC" value={rntrc} onChangeText={t => setRntrc(onlyDigits(t).slice(0, 9))} placeholder="8 a 9 dígitos" keyboardType="numeric" required maxLength={9} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Validade RNTRC" value={rntrcValidity} onChangeText={t => setRntrcValidity(maskDateBr(t))} placeholder="DD/MM/AAAA" keyboardType="numeric" required maxLength={10} />
          </View>
        </View>
        <TextField label="Placa do Veículo" value={vehiclePlate} onChangeText={t => setVehiclePlate(maskPlate(t))} placeholder="ABC1D23" autoCapitalize="characters" required maxLength={7} />
        <View style={styles.row}>
          <View style={{ flex: 2 }}>
            <TextField label="Modelo" value={vehicleModel} onChangeText={setVehicleModel} placeholder="Ex: Volvo FH" required maxLength={60} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Ano" value={vehicleYear} onChangeText={t => setVehicleYear(onlyDigits(t).slice(0, 4))} placeholder="2020" keyboardType="numeric" required maxLength={4} />
          </View>
        </View>
        <View>
          <Text style={styles.pickerLabel}>Tipo de Veículo *</Text>
          <PickerSelect value={vehicleType} options={VEHICLE_TYPE_OPTIONS} placeholder="Selecione o tipo de veículo" onSelect={setVehicleType} />
        </View>
        <View>
          <Text style={styles.pickerLabel}>Tipo de Carroceria *</Text>
          <PickerSelect value={bodyType} options={BODY_TYPE_OPTIONS} placeholder="Selecione o tipo de carroceria" onSelect={setBodyType} />
        </View>
      </View>
    );
  }

  function renderSpecificCompany() {
    return (
      <View style={styles.stepBody}>
        <View>
          <TextField
            label="CNPJ" icon="business-outline" value={cnpj}
            onChangeText={t => { setCnpj(maskCNPJ(t)); if (cnpjLookupStatus !== 'idle') { setCnpjLookupStatus('idle'); setCnpjLookupMessage(''); } }}
            placeholder="00.000.000/0000-00" keyboardType="numeric" required maxLength={18}
            rightIcon={cnpjLookupStatus === 'loading' ? <ActivityIndicator size="small" color={COLORS.primary} /> : undefined}
          />
          {!!cnpjLookupMessage && (
            <Text style={[
              styles.cnpjLookupMessage,
              cnpjLookupStatus === 'found' && { color: COLORS.success },
              cnpjLookupStatus === 'warning' && { color: COLORS.warning },
              cnpjLookupStatus === 'not_found' && { color: COLORS.textLight },
            ]}>
              {cnpjLookupMessage}
            </Text>
          )}
        </View>
        <TextField label="Razão Social" value={companyName} onChangeText={setCompanyName} placeholder="Nome da empresa" required maxLength={150} />
        <TextField label="Nome Fantasia" value={tradeName} onChangeText={setTradeName} placeholder="Nome fantasia" optional maxLength={150} />
        <TextField
          label="Inscrição Estadual" value={stateRegistration} onChangeText={setStateRegistration}
          placeholder="000.000.000.000" editable={!isentoIE} required={!isentoIE} maxLength={20}
        />
        <TouchableOpacity style={styles.checkboxRow} onPress={() => { setIsentoIE(!isentoIE); if (!isentoIE) setStateRegistration(''); }} activeOpacity={0.7}>
          <Ionicons name={isentoIE ? 'checkbox' : 'square-outline'} size={20} color={isentoIE ? COLORS.primary : COLORS.textLight} />
          <Text style={styles.checkboxLabel}>Isento de Inscrição Estadual</Text>
        </TouchableOpacity>
        <TextField label="Inscrição Municipal" value={municipalRegistration} onChangeText={setMunicipalRegistration} placeholder="000000" optional maxLength={20} />

        <Text style={styles.sectionTitle}>Representante Legal</Text>
        <TextField label="Nome do Representante" icon="person-outline" value={representativeName} onChangeText={setRepresentativeName} placeholder="Nome completo" required maxLength={100} />
        <TextField label="CPF do Representante" value={representativeCpf} onChangeText={t => setRepresentativeCpf(maskCPF(t))} placeholder="000.000.000-00" keyboardType="numeric" required maxLength={14} />
        <TextField label="RG do Representante" value={representativeRg} onChangeText={t => setRepresentativeRg(maskRG(t))} placeholder="00.000.000-0" required maxLength={15} />
        <View>
          <Text style={styles.pickerLabel}>Tipo de Vínculo *</Text>
          <PickerSelect value={representativeRole} options={REPRESENTATIVE_ROLES} placeholder="Selecione" onSelect={setRepresentativeRole} />
        </View>

        <Text style={styles.sectionTitle}>RNTRC da Empresa</Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <TextField label="RNTRC" value={companyRntrc} onChangeText={t => setCompanyRntrc(onlyDigits(t).slice(0, 9))} placeholder="8 a 9 dígitos" keyboardType="numeric" required maxLength={9} />
          </View>
          <View style={{ flex: 1 }}>
            <TextField label="Validade" value={companyRntrcValidity} onChangeText={t => setCompanyRntrcValidity(maskDateBr(t))} placeholder="DD/MM/AAAA" keyboardType="numeric" required maxLength={10} />
          </View>
        </View>
      </View>
    );
  }

  function renderDocuments() {
    return (
      <View style={styles.stepBody}>
        <Text style={styles.docsIntro}>Envie os documentos necessários para validação do seu cadastro.</Text>
        {userType === 'caminhoneiro' ? (
          <>
            <DocumentSlot label="Foto do RG (frente e verso)" required value={rgDoc} onChange={setRgDoc} />
            <DocumentSlot label="Foto do CPF" required value={cpfDoc} onChange={setCpfDoc} />
            <DocumentSlot label="Foto da CNH (frente e verso)" required value={cnhDoc} onChange={setCnhDoc} />
            <DocumentSlot label="Foto do RNTRC" required value={rntrcDoc} onChange={setRntrcDoc} />
            <DocumentSlot label="CRLV (documento do veículo)" required value={vehicleDoc} onChange={setVehicleDoc} />
            <DocumentSlot label="Comprovante de Endereço" required value={addressDoc} onChange={setAddressDoc} />
            <DocumentSlot label="Selfie segurando o RG" required value={selfieDoc} onChange={setSelfieDoc} />
          </>
        ) : (
          <>
            <DocumentSlot label="Cartão CNPJ" required value={cnpjDoc} onChange={setCnpjDoc} />
            <DocumentSlot label="Contrato Social" required value={contractDoc} onChange={setContractDoc} />
            <DocumentSlot label="Comprovante de Endereço" required value={addressDoc} onChange={setAddressDoc} />
            <DocumentSlot label="Certificado RNTRC" required value={rntrcDoc} onChange={setRntrcDoc} />
          </>
        )}
      </View>
    );
  }

  function renderStep() {
    if (currentStep === 'credentials') return renderCredentials();
    if (currentStep === 'address') return renderAddress();
    if (currentStep === 'specific') return userType === 'caminhoneiro' ? renderSpecificDriver() : renderSpecificCompany();
    return renderDocuments();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} disabled={loading}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Image source={require('../../../assets/logo.png')} style={styles.logoImage} resizeMode="contain" />
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.wizardHeaderWrap}>
        <WizardHeader steps={wizardSteps as any} currentIndex={currentIndex} />
      </View>

      <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          {userType === 'caminhoneiro' ? 'Cadastro de Motorista' : 'Cadastro de Transportadora'}
        </Text>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryBtn, (!canProceed() || loading) && styles.primaryBtnDisabled]}
          onPress={handleNext}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.primaryBtnText}>{isLastStep ? 'Criar Conta e Continuar' : 'Próximo'}</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 140, height: 34 },
  wizardHeaderWrap: { paddingHorizontal: 24, paddingVertical: 12 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 16 },
  stepBody: { gap: 14 },
  row: { flexDirection: 'row', gap: 10 },
  pickerLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 6 },
  docsIntro: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  cnpjLookupMessage: { fontSize: 12, color: COLORS.textSecondary, marginTop: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  checkboxLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 19 },
  link: { color: COLORS.primary, fontWeight: '600', textDecorationLine: 'underline' },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: COLORS.border },
  primaryBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryBtnDisabled: { opacity: 0.5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
