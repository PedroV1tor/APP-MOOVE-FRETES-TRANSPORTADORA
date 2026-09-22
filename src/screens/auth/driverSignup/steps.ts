export const DRIVER_SIGNUP_STEPS = [
  'nome', 'celular', 'email', 'cep', 'endereco', 'dadosPessoais', 'veiculo', 'placa', 'cnh', 'selfie', 'senha',
] as const;

export type DriverSignupStep = typeof DRIVER_SIGNUP_STEPS[number];

/** Percentual da barra de progresso para cada etapa do wizard (CPF/termos ficam antes, sem barra). */
export function progressFor(step: DriverSignupStep): number {
  const index = DRIVER_SIGNUP_STEPS.indexOf(step);
  return ((index + 1) / DRIVER_SIGNUP_STEPS.length) * 100;
}
