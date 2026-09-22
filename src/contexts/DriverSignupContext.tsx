import React, { createContext, useContext, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { onlyDigits } from '../utils/registrationHelpers';
import { uploadAvatarAsset, uploadDocumentAsset, registerDocumentForReview } from '../utils/registrationUpload';
import type { PickedFile } from '../utils/registrationUpload';

export interface DriverSignupData {
  cpf: string;
  name: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  uf: string;
  number: string;
  complement: string;
  vehicleType: string;
  bodyType: string;
  trackerType: string;
  vehiclePlate: string;
  rntrc: string;
  cnhDoc: PickedFile | null;
  selfieDoc: PickedFile | null;
  password: string;
}

const INITIAL_DATA: DriverSignupData = {
  cpf: '', name: '', phone: '', email: '',
  cep: '', street: '', neighborhood: '', city: '', uf: '', number: '', complement: '',
  vehicleType: '', bodyType: '', trackerType: '',
  vehiclePlate: '', rntrc: '',
  cnhDoc: null, selfieDoc: null,
  password: '',
};

interface DriverSignupContextType {
  data: DriverSignupData;
  update: (patch: Partial<DriverSignupData>) => void;
  loading: boolean;
  submit: () => Promise<{ error: string | null }>;
}

const DriverSignupContext = createContext<DriverSignupContextType | undefined>(undefined);

export function DriverSignupProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DriverSignupData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);

  function update(patch: Partial<DriverSignupData>) {
    setData(prev => ({ ...prev, ...patch }));
  }

  async function submit(): Promise<{ error: string | null }> {
    setLoading(true);
    let authUserId: string | null = null;

    try {
      const email = data.email.trim().toLowerCase();

      const { data: existingProfile } = await supabase
        .from('profiles').select('id').eq('email', email).maybeSingle();
      if (existingProfile) throw new Error('Este e-mail já está cadastrado. Faça login ou use outro e-mail.');

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: data.password,
        options: { data: { user_type: 'caminhoneiro', email } },
      });
      if (authError || !authData.user) throw new Error(authError?.message || 'Erro ao criar usuário');

      const userId = authData.user.id;
      authUserId = userId;

      // Aguarda a sessão/trigger handle_new_user() sincronizarem antes de escrever.
      await new Promise(resolve => setTimeout(resolve, 1500));

      await supabase.auth.updateUser({
        data: { display_name: data.name.trim(), phone: onlyDigits(data.phone), user_type: 'caminhoneiro' },
      });

      let avatarPath: string | undefined;
      if (data.selfieDoc) {
        const result = await uploadAvatarAsset(userId, data.selfieDoc);
        if (result.success && result.path) avatarPath = result.path;
      }

      const docsToUpload: { file: PickedFile | null; key: string }[] = [
        { file: data.cnhDoc, key: 'cnh' },
        { file: data.selfieDoc, key: 'selfie' },
      ];
      for (const doc of docsToUpload) {
        if (!doc.file) continue;
        const result = await uploadDocumentAsset(userId, doc.key, doc.file);
        if (result.success && result.path) {
          await registerDocumentForReview({ userId, ownerType: 'driver', documentType: doc.key, filePath: result.path });
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const addressJson = {
        cep: onlyDigits(data.cep), street: data.street.trim(), number: data.number.trim(),
        complement: data.complement.trim(), neighborhood: data.neighborhood.trim(),
        city: data.city.trim(), state: data.uf.trim(),
      };

      const profileData = {
        id: userId,
        email,
        user_type: 'caminhoneiro',
        name: data.name.trim() || null,
        phone: onlyDigits(data.phone) || null,
        cpf: onlyDigits(data.cpf) || null,
        cnpj: null,
        city: data.city.trim() || null,
        state: data.uf.trim() || null,
        avatar_url: avatarPath || null,
        // Assim como no cadastro atual: fica "pending" até um admin revisar os documentos.
        verification_status: 'pending',
        status: 'active',
        email_verified: false,
        updated_at: new Date().toISOString(),
      };
      const { error: profileError } = await supabase.from('profiles').upsert(profileData, { onConflict: 'id' });
      if (profileError) throw new Error('Erro ao salvar perfil: ' + profileError.message);

      await new Promise(resolve => setTimeout(resolve, 500));

      const driverData = {
        user_id: userId,
        name: data.name.trim() || null,
        cpf: onlyDigits(data.cpf) || null,
        phone: onlyDigits(data.phone) || null,
        address: addressJson,
        vehicle_plate: data.vehiclePlate.trim() || null,
        vehicle_types: data.vehicleType ? [data.vehicleType] : null,
        body_types: data.bodyType ? [data.bodyType] : null,
        vehicle_type: data.vehicleType || null,
        tracker_type: data.trackerType || null,
        rntrc: onlyDigits(data.rntrc) || null,
        cnh_category: 'B',
        available: true,
        profile_image: avatarPath || null,
        updated_at: new Date().toISOString(),
      };
      const { error: driverError } = await supabase.from('drivers').upsert(driverData, { onConflict: 'user_id' });
      if (driverError) throw new Error('Erro ao salvar dados do motorista: ' + driverError.message);

      return { error: null };
    } catch (error: any) {
      if (authUserId) {
        try {
          await supabase.from('drivers').delete().eq('user_id', authUserId);
          await supabase.from('profiles').delete().eq('id', authUserId);
          await supabase.auth.signOut();
        } catch {
          // rollback best-effort
        }
      }
      const msg: string = error?.message || 'Erro ao salvar dados';
      if (msg.includes('already registered') || msg.includes('já está cadastrado')) {
        return { error: 'Este e-mail já está cadastrado. Faça login ou use outro e-mail.' };
      }
      return { error: msg };
    } finally {
      setLoading(false);
    }
  }

  const value = useMemo(() => ({ data, update, loading, submit }), [data, loading]);

  return <DriverSignupContext.Provider value={value}>{children}</DriverSignupContext.Provider>;
}

export function useDriverSignup(): DriverSignupContextType {
  const ctx = useContext(DriverSignupContext);
  if (!ctx) throw new Error('useDriverSignup deve ser usado dentro de DriverSignupProvider');
  return ctx;
}
