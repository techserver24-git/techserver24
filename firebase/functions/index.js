const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const sgMail = require('@sendgrid/mail');
const cors = require('cors')({origin: true});

admin.initializeApp();

// Use Firebase functions config to store secrets:
// firebase functions:config:set stripe.secret="sk_..." sendgrid.key="SG...." email.from="noreply@yourdomain.com"
const stripeSecret = functions.config().stripe && functions.config().stripe.secret;
const sendgridKey = functions.config().sendgrid && functions.config().sendgrid.key;
const emailFrom = functions.config().email && functions.config().email.from;

if (sendgridKey) sgMail.setApiKey(sendgridKey);
const stripe = Stripe(stripeSecret);

// Create Checkout Session (HTTP)
exports.createCheckoutSession = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try{
      const { product, email, amount } = req.body || {};
      if (!product || !email) return res.status(400).json({error:'Missing product or email'});

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {currency: 'usd', product_data: {name: product}, unit_amount: (amount || 5000)},
          quantity: 1
        }],
        customer_email: email,
        mode: 'payment',
        success_url: functions.config().app && functions.config().app.success_url || 'https://yourdomain.example/success',
        cancel_url: functions.config().app && functions.config().app.cancel_url || 'https://yourdomain.example/cancel'
      });
      res.json({id: session.id});
    }catch(err){
      console.error(err);
      res.status(500).json({error: err.message});
    }
  });
});

// Webhook handler - verify stripe signature and handle checkout completion
exports.stripeWebhook = functions.https.onRequest((req, res) => {
  // Stripe requires the raw body to validate signature. Firebase wraps body by default,
  // so configure the function to not parse the body, or use express raw body handling.
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe && functions.config().stripe.webhook_secret;
  let event;
  try{
    const rawBody = req.rawBody;
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  }catch(err){
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed'){
    const session = event.data.object;
    const customerEmail = session.customer_details && session.customer_details.email;
    const productName = session.display_items && session.display_items[0] && session.display_items[0].custom ? session.display_items[0].custom.name : (session.metadata && session.metadata.product) || 'Product';

    // send email via SendGrid if configured
    if (sendgridKey && emailFrom && customerEmail){
      const msg = {
        to: customerEmail,
        from: emailFrom,
        subject: `Your ${productName} from TechServer24`,
        text: `Thank you for your purchase of ${productName}. Download link: https://yourdomain.example/download/${encodeURIComponent(productName)}\n\nRegards, TechServer24`
      };
      sgMail.send(msg).then(() => console.log('SendGrid email queued')).catch(e => console.error('SendGrid error', e));
    } else {
      console.log('Email not sent: SendGrid or from address not configured');
    }

    // Optionally write order into Firestore
    admin.firestore().collection('orders').add({
      sessionId: session.id,
      email: customerEmail,
      product: productName,
      created: admin.firestore.FieldValue.serverTimestamp()
    }).catch(e => console.error('Firestore write failed', e));
  }

  res.json({received: true});
});
