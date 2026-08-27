/**
 * UUID v4 generator.
 *
 * Hermes (React Native) não expõe `crypto.randomUUID()` por padrão, então
 * usamos o nativo quando existir e caímos num fallback baseado em
 * `Math.random()` caso contrário. Para IDs de mensagem de chat a
 * probabilidade de colisão é desprezível nesta escala e, se acontecer, a
 * PK da tabela `messages` rejeita o segundo insert.
 */
export function uuidv4(): string {
  const nativeCrypto: any = (globalThis as any).crypto;
  if (nativeCrypto?.randomUUID) {
    return nativeCrypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
