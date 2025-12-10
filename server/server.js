// Sample Express server for Stripe Checkout and webhook handling
// NOTE: This is an example. Do not deploy without configuring env vars and securing webhooks.
const express = require('express');
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');

const app = express();
app.use(bodyParser.json());

// Create a Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  const { product, email } = req.body;
  try{
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{price_data: {currency: 'usd',product_data:{name:product},unit_amount: 5000},quantity:1}],
      mode: 'payment',
      success_url: process.env.SUCCESS_URL || 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.CANCEL_URL || 'http://localhost:3000/cancel'
    });
    res.json({id: session.id});
  }catch(err){
    console.error(err);res.status(500).json({error:err.message});
  }
});

// Webhook endpoint to listen for checkout.session.completed
app.post('/webhook', bodyParser.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try{
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_ENDPOINT_SECRET);
  }catch(err){
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed'){
    const session = event.data.object;
    // send email with purchased software or download link
    const customerEmail = session.customer_details && session.customer_details.email;
    await sendProductEmail(customerEmail, 'Downloaded Product', 'Thank you for your purchase. Here is your download link: https://example.com/download');
  }
  res.json({received:true});
});

async function sendProductEmail(to, subject, text){
  // configure transporter with environment variables
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  await transporter.sendMail({from: process.env.EMAIL_FROM, to, subject, text});
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port',port));
