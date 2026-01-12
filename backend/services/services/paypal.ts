import * as paypal from '@paypal/paypal-server-sdk';

const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.warn('PayPal client ID or secret not set. Payment functionality will be disabled.');
}

// This function sets up the PayPal environment.
// Live Environment: new paypal.core.LiveEnvironment(clientId, clientSecret)
const environment = () => {
  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(clientId!, clientSecret!);
  }
  return new paypal.core.SandboxEnvironment(clientId!, clientSecret!);
}

// This function returns a PayPal HTTP client instance with a fresh access token.
const client = () => {
  return new paypal.core.PayPalHttpClient(environment());
}

export const paypalClient = client();

export async function createSubscription(planId: string, email: string) {
  const request = new paypal.v1.subscriptions.SubscriptionsCreateRequest();
  request.requestBody({
    plan_id: planId,
    subscriber: {
      email_address: email,
    },
    application_context: {
      brand_name: 'LoadLink Africa',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      return_url: `${process.env.FRONTEND_URL}/subscription/success`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
    },
  });

  try {
    const response = await client().execute(request);
    return response.result;
  } catch (err) {
    console.error('Error creating PayPal subscription:', err);
    throw err;
  }
}

export async function getSubscription(subscriptionId: string) {
  const request = new paypal.v1.subscriptions.SubscriptionsGetRequest(subscriptionId);
  try {
    const response = await client().execute(request);
    return response.result;
  } catch (err) {
    console.error('Error getting PayPal subscription:', err);
    throw err;
  }
}
