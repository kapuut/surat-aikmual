type WhatsAppMetadata = Record<string, unknown>;

function getEnv(name: string): string {
  return String(process.env[name] || '').trim();
}

export function normalizeWhatsAppNumber(rawValue: string): string | null {
  const cleaned = String(rawValue || '').replace(/[^0-9+]/g, '').trim();
  if (!cleaned) return null;

  let digits = cleaned;
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }

  if (digits.startsWith('0')) {
    digits = `62${digits.slice(1)}`;
  } else if (digits.startsWith('8')) {
    digits = `62${digits}`;
  }

  if (!/^\d{9,16}$/.test(digits)) {
    return null;
  }

  return digits;
}

export function isWhatsAppApiConfigured(): boolean {
  return Boolean(getEnv('WHATSAPP_API_URL'));
}

export async function sendWhatsAppNotification(params: {
  to: string;
  message: string;
  metadata?: WhatsAppMetadata;
}): Promise<{ destination: string; status: string }> {
  const apiUrl = getEnv('WHATSAPP_API_URL');
  if (!apiUrl) {
    throw new Error('WHATSAPP_API_URL belum dikonfigurasi');
  }

  const destination = normalizeWhatsAppNumber(params.to);
  if (!destination) {
    throw new Error('Nomor WhatsApp tidak valid');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getEnv('WHATSAPP_API_TOKEN');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const apiKey = getEnv('WHATSAPP_API_KEY');
  if (apiKey) {
    const apiKeyHeader = getEnv('WHATSAPP_API_KEY_HEADER') || 'x-api-key';
    headers[apiKeyHeader] = apiKey;
  }

  const body: Record<string, unknown> = {
    to: destination,
    message: params.message,
  };

  const sender = getEnv('WHATSAPP_SENDER');
  if (sender) {
    body.sender = sender;
  }

  if (params.metadata && Object.keys(params.metadata).length > 0) {
    body.metadata = params.metadata;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`Gagal kirim WhatsApp (${response.status}): ${reason || 'unknown error'}`);
  }

  return {
    destination,
    status: 'sent',
  };
}
