const DEFAULT_SANDBOX_URL = 'https://api-sandbox.asaas.com/v3';
const DEFAULT_PRODUCTION_URL = 'https://api.asaas.com/v3';

function baseUrl() {
  return process.env.ASAAS_BASE_URL || (process.env.ASAAS_ENVIRONMENT === 'production' ? DEFAULT_PRODUCTION_URL : DEFAULT_SANDBOX_URL);
}
export function asaasConfigured() { return Boolean(process.env.ASAAS_API_KEY); }
export function asaasEnvironment() { return process.env.ASAAS_ENVIRONMENT === 'production' ? 'production' : 'sandbox'; }
export function asaasWebhookToken() { return process.env.ASAAS_WEBHOOK_TOKEN || ''; }

export async function asaasRequest<T = any>(path: string, init: RequestInit = {}) {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error('ASAAS_API_KEY não configurada no ambiente do backend.');
  const headers = new Headers(init.headers);
  headers.set('accept', 'application/json');
  headers.set('content-type', 'application/json');
  headers.set('access_token', apiKey);
  headers.set('User-Agent', 'CentroUmbandaZeDoLaco/1.0 (Railway)');
  const response = await fetch(baseUrl() + path, { ...init, headers });
  const raw = await response.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = { raw }; }
  if (!response.ok) {
    const detail = data?.errors?.map((item: any) => item.description).join(' ') || data?.message || `Asaas retornou HTTP ${response.status}.`;
    throw new Error(detail);
  }
  return data as T;
}
export async function ensureAsaasCustomer(user: { id:string; name:string; email:string; whatsapp?:string|null; cpfCnpj?:string|null }, existingCustomerId?:string|null) {
  const cpfCnpj=String(user.cpfCnpj||'').replace(/\D/g,'');
  if (![11,14].includes(cpfCnpj.length)) throw new Error('CPF ou CNPJ válido é obrigatório para criar o cadastro do pagador no Asaas.');
  const payload={name:user.name,cpfCnpj,email:user.email,mobilePhone:user.whatsapp?String(user.whatsapp).replace(/\D/g,''):undefined,externalReference:user.id,notificationDisabled:true};
  if(existingCustomerId){ await asaasRequest(`/customers/${encodeURIComponent(existingCustomerId)}`,{method:'PUT',body:JSON.stringify(payload)}); return existingCustomerId; }
  const created=await asaasRequest<{id:string}>('/customers',{method:'POST',body:JSON.stringify(payload)}); return created.id;
}
export async function createPixCharge(customerId:string,valueCents:number,dueDate:string,externalReference:string){
  return asaasRequest<{id:string;status:string;invoiceUrl?:string;dueDate:string}>('/payments',{method:'POST',body:JSON.stringify({customer:customerId,billingType:'PIX',value:Number((valueCents/100).toFixed(2)),dueDate,description:'Mensalidade do Centro de Umbanda Zé do Laço',externalReference})});
}
export async function getPixQrCode(paymentId:string){
  return asaasRequest<{encodedImage:string;payload:string;expirationDate:string}>(`/payments/${encodeURIComponent(paymentId)}/pixQrCode`);
}
export async function createAsaasWebhook(url:string,email:string){
  const token=asaasWebhookToken();
  if(token.length<32||token.length>255||/\s/.test(token)) throw new Error('ASAAS_WEBHOOK_TOKEN deve ter entre 32 e 255 caracteres e não conter espaços.');
  return asaasRequest<{id:string;url:string}>('/webhooks',{method:'POST',body:JSON.stringify({name:'Webhook de mensalidades - Centro Zé do Laço',url,email,enabled:true,interrupted:false,apiVersion:3,authToken:token,sendType:'SEQUENTIALLY',events:['PAYMENT_RECEIVED','PAYMENT_OVERDUE','PAYMENT_DELETED','PAYMENT_REFUNDED']})});
}
