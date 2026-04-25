import crypto from "crypto";

type MtnRequestToPayArgs = {
  phone: string;
  amount: number;
  currency: string;
  externalReference?: string;
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export function normalizeMsisdn(phone: string): string {
  return phone.replace(/[^\d]/g, "");
}

export function createExternalReference(): string {
  return crypto.randomUUID();
}

export async function getMtnAccessToken(): Promise<string> {
  const baseUrl = required("MTN_MOMO_BASE_URL");
  const subscriptionKey = required("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY");
  const apiUser = required("MTN_MOMO_API_USER");
  const apiKey = required("MTN_MOMO_API_KEY");

  const basic = Buffer.from(`${apiUser}:${apiKey}`).toString("base64");

  const res = await fetch(`${baseUrl}/collection/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok || !data?.access_token) {
    throw new Error(
      data?.message ||
        data?.error_description ||
        `Failed to get MTN access token (${res.status})`
    );
  }

  return data.access_token as string;
}

export async function initiateMtnRequestToPay(args: MtnRequestToPayArgs) {
  const baseUrl = required("MTN_MOMO_BASE_URL");
  const subscriptionKey = required("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY");
  const targetEnvironment =
    process.env.MTN_MOMO_TARGET_ENVIRONMENT || "sandbox";
  const payerMessage =
    process.env.MTN_MOMO_PAYER_MESSAGE || "Slottick subscription";
  const payeeNote =
    process.env.MTN_MOMO_PAYEE_NOTE || "Slottick monthly subscription";

  const accessToken = await getMtnAccessToken();
  const externalReference = args.externalReference || createExternalReference();

  const res = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "X-Reference-Id": externalReference,
      "X-Target-Environment": targetEnvironment,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: String(args.amount),
      currency: args.currency,
      externalId: externalReference,
      payer: {
        partyIdType: "MSISDN",
        partyId: normalizeMsisdn(args.phone),
      },
      payerMessage,
      payeeNote,
    }),
    cache: "no-store",
  });

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      data?.message ||
        data?.reason ||
        `MTN request to pay failed (${res.status})`
    );
  }

  return {
    ok: true,
    externalReference,
    providerTxnId: externalReference,
    providerStatus: "PENDING" as const,
    raw: data ?? { accepted: true, status: res.status },
  };
}

export async function getMtnRequestToPayStatus(referenceId: string) {
  const baseUrl = required("MTN_MOMO_BASE_URL");
  const subscriptionKey = required("MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY");
  const targetEnvironment =
    process.env.MTN_MOMO_TARGET_ENVIRONMENT || "sandbox";

  const accessToken = await getMtnAccessToken();

  const res = await fetch(
    `${baseUrl}/collection/v1_0/requesttopay/${referenceId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Ocp-Apim-Subscription-Key": subscriptionKey,
        "X-Target-Environment": targetEnvironment,
      },
      cache: "no-store",
    }
  );

  const text = await res.text();
  let data: any = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      data?.message ||
        data?.reason ||
        `MTN payment status lookup failed (${res.status})`
    );
  }

  return data;
}