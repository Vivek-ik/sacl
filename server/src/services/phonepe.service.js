const isProduction = process.env.PHONEPE_ENV === "PRODUCTION";

const PHONEPE_BASE_URL = isProduction
  ? "https://api.phonepe.com/apis/pg"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox";

const TOKEN_URL = isProduction
  ? "https://api.phonepe.com/apis/identity-manager/v1/oauth/token"
  : "https://api-preprod.phonepe.com/apis/pg-sandbox/v1/oauth/token";

let cachedToken = null;
let tokenExpiry = 0;

export async function getPhonePeToken() {
  // Refresh one minute before expiry.
  if (cachedToken && Date.now() < tokenExpiry - 60_000) {
    return cachedToken;
  }

  const body = new URLSearchParams({
    client_id: process.env.PHONEPE_CLIENT_ID,
    client_version: process.env.PHONEPE_CLIENT_VERSION,
    client_secret: process.env.PHONEPE_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    console.error("PhonePe token error:", data);
    throw new Error("Unable to authenticate with PhonePe");
  }

  cachedToken = data.access_token;
  tokenExpiry = Number(data.expires_at) * 1000;

  return cachedToken;
}

export async function createPhonePeOrder({
  merchantOrderId,
  amount,
  redirectUrl,
  userId,
}) {
  const token = await getPhonePeToken();

  const response = await fetch(`${PHONEPE_BASE_URL}/checkout/v2/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `O-Bearer ${token}`,
    },
    body: JSON.stringify({
      merchantOrderId,
      amount,
      expireAfter: 1200,
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Player registration payment",
        merchantUrls: {
          redirectUrl,
        },
      },
      metaInfo: {
        udf1: String(userId),
        udf2: "player",
      },
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.redirectUrl) {
    console.error("PhonePe create order error:", data);
    throw new Error(data.message || "Unable to create PhonePe payment order");
  }

  return data;
}

export async function checkPhonePeOrderStatus(merchantOrderId) {
  const token = await getPhonePeToken();

  const response = await fetch(
    `${PHONEPE_BASE_URL}/checkout/v2/order/${encodeURIComponent(
      merchantOrderId,
    )}/status?details=false`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `O-Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("PhonePe status error:", data);
    throw new Error("Unable to verify PhonePe payment");
  }

  return data;
}
