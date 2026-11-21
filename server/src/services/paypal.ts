import { AppError } from "../middleware/errors";

function paypalConfig() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const apiBase = process.env.PAYPAL_API_BASE;
  if (!clientId || !clientSecret || !apiBase) {
    throw new AppError(503, "Pagos no disponibles temporalmente");
  }
  return { clientId, clientSecret, apiBase: apiBase.replace(/\/$/, "") };
}

async function paypalRequest(path: string, init: RequestInit) {
  const { clientId, clientSecret, apiBase } = paypalConfig();
  let authorization: string;

  try {
    const authResponse = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    });
    if (!authResponse.ok) throw new Error("paypal_auth_failed");
    const auth = await authResponse.json() as { access_token?: string };
    if (!auth.access_token) throw new Error("paypal_auth_missing_token");
    authorization = `Bearer ${auth.access_token}`;

    const response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        ...(init.headers || {})
      }
    });
    if (!response.ok) throw new Error("paypal_request_failed");
    return response.json();
  } catch {
    throw new AppError(502, "No se pudo procesar el pago con PayPal");
  }
}

export interface PaypalCaptureResult {
  status: string;
  captureId?: string;
  amount?: string;
  currency?: string;
}

export async function createPaypalOrder(total: number) {
  const totalValue = total.toFixed(2);
  const result = await paypalRequest("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{ amount: { currency_code: "USD", value: totalValue } }]
    })
  }) as { id?: string };
  if (!result.id) throw new AppError(502, "No se pudo crear la orden de pago");
  return result.id;
}

export function validateCapturedAmount(capture: PaypalCaptureResult, expectedAmount: number) {
  if (capture.status !== "COMPLETED") return false;
  if (capture.currency !== "USD") return false;
  const amount = Number(capture.amount);
  return Number.isFinite(amount) && amount === Number(expectedAmount.toFixed(2));
}

export async function capturePaypalOrder(paypalOrderId: string): Promise<PaypalCaptureResult> {
  const result = await paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: "POST",
    body: "{}"
  }) as any;

  const purchase = result.purchase_units?.[0];
  const capture = purchase?.payments?.captures?.[0];
  return {
    status: result.status,
    captureId: capture?.id,
    amount: capture?.amount?.value,
    currency: capture?.amount?.currency_code
  };
}
