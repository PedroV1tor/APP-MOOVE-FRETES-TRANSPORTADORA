/**
 * Upload de avatar/documentos do cadastro — espelha as mesmas convenções do
 * painel web (MOOVE-FRETES/src/utils/storage-helper.ts):
 *
 *   - bucket "avatars" (público):   <userId>/avatar_<timestamp>.<ext>
 *   - bucket "documents" (privado): <ownerId>/<docKey>_<timestamp>_<random>.<ext>
 *
 * Sempre retorna o PATH salvo no bucket (nunca URL), para gravar em
 * profiles.avatar_url / companies.logo_url e nos registros de `documents`.
 */
// SDK 54 do expo-file-system moveu readAsStringAsync/getInfoAsync pra esse
// subpath "legacy" (a API nova usa classes File/Directory).
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../lib/supabase';

export interface PickedFile {
  uri: string;
  /** já vem preenchido quando veio do ImagePicker com base64:true */
  base64?: string | null;
  mimeType?: string | null;
  name?: string | null;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  error?: string;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

function extFromFile(file: PickedFile, fallback: string): string {
  const fromName = file.name?.split('.').pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  const fromUri = file.uri.split('.').pop();
  if (fromUri && fromUri.length <= 5) return fromUri.toLowerCase();
  return fallback;
}

function contentTypeFor(ext: string, mimeType?: string | null): string {
  if (mimeType) return mimeType;
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

async function readAsBase64(file: PickedFile): Promise<string> {
  if (file.base64) return file.base64;
  return FileSystem.readAsStringAsync(file.uri, { encoding: 'base64' });
}

async function getFileSize(uri: string): Promise<number | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return info.exists ? (info.size ?? null) : null;
  } catch {
    return null;
  }
}

/** Upload da foto de perfil (motorista) / logo (empresa). Bucket público "avatars". */
export async function uploadAvatarAsset(userId: string, file: PickedFile): Promise<UploadResult> {
  try {
    const size = await getFileSize(file.uri);
    if (size !== null && size > MAX_AVATAR_BYTES) {
      return { success: false, error: 'Imagem muito grande. Tamanho máximo: 5MB.' };
    }

    const ext = extFromFile(file, 'jpg');
    const base64 = await readAsBase64(file);
    const filePath = `${userId}/avatar_${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(base64), { contentType: contentTypeFor(ext, file.mimeType), upsert: false });

    if (error) throw error;
    return { success: true, path: filePath };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Falha no upload da foto.' };
  }
}

/**
 * Upload de um documento do KYC (RG, CNH, CRLV, CNPJ, contrato social, etc).
 * Bucket privado "documents". `docKey` é o mesmo identificador salvo depois
 * em documents.document_type (ex: 'rg', 'cnh', 'rntrc', 'cnpjDocument').
 */
export async function uploadDocumentAsset(
  ownerId: string,
  docKey: string,
  file: PickedFile,
): Promise<UploadResult> {
  try {
    const size = await getFileSize(file.uri);
    if (size !== null && size > MAX_DOCUMENT_BYTES) {
      return { success: false, error: 'Arquivo muito grande. Tamanho máximo: 10MB.' };
    }

    const ext = extFromFile(file, 'jpg');
    const base64 = await readAsBase64(file);
    const random = Math.random().toString(36).substring(7);
    const filePath = `${ownerId}/${docKey}_${Date.now()}_${random}.${ext}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, decode(base64), { contentType: contentTypeFor(ext, file.mimeType) });

    if (error) throw error;
    return { success: true, path: filePath };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Falha no upload do documento.' };
  }
}

/** Registra o documento enviado na fila de aprovação do painel admin (tabela `documents`). */
export async function registerDocumentForReview(params: {
  userId: string;
  ownerType: 'driver' | 'company';
  documentType: string;
  filePath: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.from('documents').insert({
    owner_type: params.ownerType,
    user_id: params.userId,
    document_type: params.documentType,
    file_path: params.filePath,
    status: 'pending',
  });
  return { error: error?.message || null };
}
