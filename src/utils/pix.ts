export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';

export type PixPaymentConfig = {
  method: string;
  receiverName: string;
  city: string;
  pixKeyType?: string | null;
  pixKey?: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  bankDetails?: string | null;
  instructions?: string | null;
};

const utf8Length = (value: string) => new TextEncoder().encode(value).length;

const field = (id: string, value: string) => id + String(utf8Length(value)).padStart(2, '0') + value;

const crc16Ccitt = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let crc = 0xffff;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
};

export function generatePixPayload(config: PixPaymentConfig, amountCents: number, txid = '***') {
  if (config.method !== 'pix' || !config.pixKey) {
    throw new Error('O PIX ainda não foi configurado pela administração.');
  }

  const merchantAccount = [
    field('00', 'BR.GOV.BCB.PIX'),
    field('01', config.pixKey.trim()),
  ].join('');

  const amount = (amountCents / 100).toFixed(2);
  const additionalData = field('05', txid.slice(0, 25) || '***');

  const payloadWithoutCrc = [
    field('00', '01'),
    field('26', merchantAccount),
    field('52', '0000'),
    field('53', '986'),
    field('54', amount),
    field('58', 'BR'),
    field('59', config.receiverName.trim().slice(0, 25)),
    field('60', config.city.trim().slice(0, 15)),
    field('62', additionalData),
    '6304',
  ].join('');

  return payloadWithoutCrc + crc16Ccitt(payloadWithoutCrc);
}