# TechServer24 - Single page site scaffold

This repository contains a simple single-page site (`index.html`) and an `about.html` page for TechServer24. The scaffold includes:

- `index.html` — Home, Services, Reviews, Contacts, and a modal buy form.
- `about.html` — A stylized timeline with scroll reveal.
- `css/styles.css` — Custom CSS for carousel, 3D reviews, timeline.
- `js/main.js` — Frontend behaviors: carousel, 3D reviews rotation, buy modal and form submission.
- `apps-script/Code.gs` — Google Apps Script to save form submissions to Google Sheets and send confirmation email.

Important notes & next steps

1. Google Apps Script
   - Open Google Sheets, create a sheet, copy its ID from the URL.
   - In Google Apps Script editor, create a new project, paste `apps-script/Code.gs` and set `SHEET_ID` to your sheet id.
   - Deploy → New deployment → Select "Web app", set "Execute as" to "Me", and access to "Anyone" (or your preferred setting). Copy the web app URL and paste it into `js/main.js` replacing `GAS_ENDPOINT`.

2. Payment processing (recommended: Stripe)
   - This scaffold includes a sample Node server (see `server/server.js`) demonstrating how to create a Stripe Checkout session and handle webhook events. You must run your own server or use a serverless function to create Checkout sessions and to securely handle webhooks.
   - After successful payment, your server should send the purchased software via email (e.g., via nodemailer) or provide a secure download link.

---

Serverless / Firebase functions (recommended)

- I can convert the sample server to Firebase Cloud Functions so you don't need a long‑running server. The repository already contains an example at `firebase/functions`:
   - `firebase/functions/index.js` — example functions `createCheckoutSession` and `stripeWebhook` using Stripe and SendGrid.
   - `firebase/functions/package.json` — dependencies.

Setup summary (Firebase + Stripe + SendGrid):

1. Install Firebase CLI and initialize functions:

```powershell
npm install -g firebase-tools
# login and init (choose Functions, JavaScript or TypeScript as you like)
# run inside repo root
# firebase login
# firebase init functions
```

2. Set function configs (store secrets safely):

```powershell
# replace values with your keys
firebase functions:config:set stripe.secret="sk_live_..." stripe.webhook_secret="whsec_..." sendgrid.key="SG.xxxxx" email.from="noreply@yourdomain.com" app.success_url="https://yourdomain.example/success" app.cancel_url="https://yourdomain.example/cancel"
```

3. Deploy functions:

```powershell
cd firebase/functions
npm install
cd ../..
firebase deploy --only functions
```

4. Update frontend (`js/main.js`):
    - Set `SERVERLESS_ENDPOINT` to the deployed function URL (e.g. `https://us-central1-<project>.cloudfunctions.net/createCheckoutSession`).
    - Set `STRIPE_PUBLISHABLE_KEY` to your Stripe publishable key.
    - Include Stripe.js on pages that call `redirectToCheckout` (add `<script src="https://js.stripe.com/v3/"></script>` to `index.html` near bottom).

Email/Sending product after payment

- Firebase functions cannot directly send SMTP mail without a third‑party provider. Recommended options:
   - Use SendGrid (we added `@sendgrid/mail` in the example). Store the SendGrid API key in `functions` config and the `index.js` will use it to send post-payment emails.
   - Use Nodemailer with an SMTP relay (store SMTP credentials in functions config). This works too but SendGrid is simpler for deliverability.
   - Use Firebase Extensions: "Trigger Email" extension which integrates with SendGrid and can be easier to configure.

Security notes

- Keep secret keys in Firebase functions config — never in client-side code.
- Use Stripe webhooks and verify signatures using `stripe.webhooks.constructEvent` (example included). Configure `stripe.webhook_secret` in functions config.

If you want, I can:
- Add Stripe.js `<script>` tag to `index.html` and update `index.html` to include a `data-` attribute placeholders for the publishable key.
- Deploy the Firebase functions (I can guide you through running `firebase deploy`), or scaffold a `firebase.json` if you want me to initialize the project files here.

3. Deployment
   - The frontend is static and can be hosted on GitHub Pages, Netlify, Vercel, or any static host.
   - Ensure `GAS_ENDPOINT` in `js/main.js` points to your deployed Apps Script.

4. Customization
   - Replace placeholder images with your brand images.
   - Update text, prices, and social links.

5. Security
   - Do NOT embed sensitive API keys in client-side code.
   - Use server-side code for creating payment sessions and sending download emails.

If you want, I can: deploy the Apps Script manifest, wire up a demo Stripe account + local server, or add serverless functions for Checkout creation. Tell me which step to do next.
