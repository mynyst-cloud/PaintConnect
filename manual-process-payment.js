/**
 * Manual script to process a paid Mollie payment
 * Usage: node manual-process-payment.js <payment_id>
 * Example: node manual-process-payment.js tr_4LhUBtAWX8qTgwgvw3kJJ
 */

const SUPABASE_URL = 'https://hhnbxutsmnkypbwydebo.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY';
const MOLLIE_API_KEY = process.env.MOLLIE_API_KEY || 'YOUR_MOLLIE_API_KEY';

async function processPayment(paymentId) {
  console.log(`Processing payment: ${paymentId}`);
  
  // 1. Fetch payment from Mollie
  const paymentResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
    headers: {
      'Authorization': `Bearer ${MOLLIE_API_KEY}`,
    },
  });
  
  if (!paymentResponse.ok) {
    const error = await paymentResponse.text();
    console.error('Failed to fetch payment:', error);
    return;
  }
  
  const payment = await paymentResponse.json();
  console.log('Payment status:', payment.status);
  console.log('Payment metadata:', JSON.stringify(payment.metadata));
  
  if (payment.status !== 'paid') {
    console.error(`Payment is not paid, status: ${payment.status}`);
    return;
  }
  
  const metadata = payment.metadata;
  const companyId = metadata?.company_id;
  
  if (!companyId) {
    console.error('No company_id in payment metadata');
    return;
  }
  
  // 2. Call the webhook handler via Supabase Edge Function
  // We'll simulate the webhook call
  const webhookResponse = await fetch(`${SUPABASE_URL}/functions/v1/mollieWebhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`, // Use service role to bypass JWT
    },
    body: `id=${paymentId}`,
  });
  
  const webhookResult = await webhookResponse.text();
  console.log('Webhook response:', webhookResult);
  
  if (webhookResponse.ok) {
    console.log('✅ Payment processed successfully!');
  } else {
    console.error('❌ Webhook failed:', webhookResult);
  }
}

// Get payment ID from command line
const paymentId = process.argv[2];

if (!paymentId) {
  console.error('Usage: node manual-process-payment.js <payment_id>');
  console.error('Example: node manual-process-payment.js tr_4LhUBtAWX8qTgwgvw3kJJ');
  process.exit(1);
}

processPayment(paymentId).catch(console.error);

