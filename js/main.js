/* Main JS for TechServer24 site */
document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle and close on link click
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  
  console.log('Mobile btn:', mobileBtn);
  console.log('Mobile menu:', mobileMenu);
  
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Hamburger clicked');
      mobileMenu.classList.toggle('hidden');
    });
    // Close menu when any link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        console.log('Menu link clicked');
        mobileMenu.classList.add('hidden');
      });
    });
  } else {
    console.error('Mobile menu elements not found');
  }

  // Simple carousel autoplay
  const track = document.querySelector('.carousel-track');
  let idx = 0;
  const slides = document.querySelectorAll('.carousel-item');
  setInterval(() => {
    idx = (idx + 1) % slides.length;
    track.style.transform = `translateX(-${idx * 100}%)`;
  }, 5000);

  // Reviews carousel auto-rotation
  const reviewsTrack = document.getElementById('reviewsTrack');
  const reviewCards = Array.from(document.querySelectorAll('.review-card'));
  let rIdx = 0;

  const showReview = (i) => {
    rIdx = (i + reviewCards.length) % reviewCards.length;
    reviewsTrack.style.transform = `translateX(-${rIdx * 100}%)`;
    reviewCards.forEach((c, idx) => {
      c.classList.remove('active', 'inactive');
      if (idx === rIdx) c.classList.add('active');
      else c.classList.add('inactive');
    });
  };

  if (reviewCards.length > 0) {
    showReview(0);
    setInterval(() => showReview(rIdx + 1), 5000);
  }

  // About sections scroll journey effect
  const aboutSections = Array.from(document.querySelectorAll('.about-section'));
  const onAboutScroll = () => {
    aboutSections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
      if (inView) sec.classList.add('in-view');
      // parallax effect: adjust background position slightly
      const pos = Math.round((rect.top / window.innerHeight) * 20);
      sec.style.backgroundPosition = `center ${50 - pos}%`;
    });
  };
  if (aboutSections.length) {
    window.addEventListener('scroll', onAboutScroll, {passive:true});
    onAboutScroll();
  }

  // Add vertical timeline (left side) with year-wise markers for journey
  const journeyWrapper = document.querySelector('.about-journey');
  if (journeyWrapper){
    const years = ['1976','2018','2021','2025']; // labels for each section (adjust if needed)
    const timeline = document.createElement('div');
    timeline.className = 'journey-timeline';
    const markerContainer = document.createElement('div');
    markerContainer.className = 'marker-container';
    // create markers stacked vertically with labels
    aboutSections.forEach((s, i) => {
      const wrap = document.createElement('div');
      wrap.className = 'marker-wrap';
      const marker = document.createElement('div'); marker.className = 'marker'; marker.dataset.idx = i;
      const label = document.createElement('div'); label.className = 'label'; label.textContent = years[i] || `Step ${i+1}`;
      wrap.appendChild(marker);
      wrap.appendChild(label);
      // clicking marker scrolls to section
      wrap.addEventListener('click', () => { aboutSections[i].scrollIntoView({behavior:'smooth'}); });
      markerContainer.appendChild(wrap);
    });
    // add vertical line behind markers
    const line = document.createElement('div'); line.className = 'timeline-line';
    timeline.appendChild(markerContainer);
    timeline.appendChild(line);
    document.body.appendChild(timeline);

    const markers = Array.from(timeline.querySelectorAll('.marker'));
    const updateTimeline = () => {
      aboutSections.forEach((s, i) => {
        const rect = s.getBoundingClientRect();
        const active = rect.top < window.innerHeight*0.5 && rect.bottom > window.innerHeight*0.5;
        markers[i].classList.toggle('active', !!active);
      });
    };
    window.addEventListener('scroll', updateTimeline, {passive:true});
    updateTimeline();
  }

  // Buy modal
  const buyButtons = document.querySelectorAll('.btn-buy');
  const buyModal = document.getElementById('buyModal');
  const productName = document.getElementById('productName');
  const productField = document.getElementById('productField');
  const cancelBuy = document.getElementById('cancelBuy');
  const buyForm = document.getElementById('buyForm');

  buyButtons.forEach(btn => btn.addEventListener('click', e => {
    const p = e.currentTarget.dataset.product;
    productName.textContent = p;
    productField.value = p;
    buyModal.classList.remove('hidden');
  }));
  if (cancelBuy) cancelBuy.addEventListener('click', () => buyModal.classList.add('hidden'));

  // Form submission -> send to Google Apps Script endpoint then create Stripe Checkout via serverless function
  const GAS_ENDPOINT = 'https://script.google.com/macros/s/YOUR_DEPLOYED_SCRIPT_ID/exec'; // <-- replace with your Apps Script web app URL
  // SERVERLESS endpoint (Firebase function) that creates a Checkout session
  const SERVERLESS_ENDPOINT = 'https://REGION-PROJECT.cloudfunctions.net/createCheckoutSession'; // <-- replace with your deployed function URL
  const STRIPE_PUBLISHABLE_KEY = 'pk_test_XXXXXXXX'; // <-- replace with your Stripe publishable key

  if (buyForm) buyForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const formData = new FormData(buyForm);
    const product = formData.get('product');
    const email = formData.get('email');
    // send to Google Apps Script for logging & initial confirmation
    try{
      const resp = await fetch(GAS_ENDPOINT, { method: 'POST', body: formData });
      const data = await resp.json();
      if (data.status !== 'success') return alert('Submission failed: ' + (data.message||'unknown'));
    }catch(err){ console.error(err); alert('Failed to submit form. Check console.'); return; }

    // Create Checkout session via serverless function
    try{
      const createResp = await fetch(SERVERLESS_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({product, email})
      });
      const sessionData = await createResp.json();
      if (sessionData.error) return alert('Payment init failed: ' + sessionData.error);

      // Redirect to Stripe Checkout using Stripe.js
      const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
      const result = await stripe.redirectToCheckout({ sessionId: sessionData.id });
      if (result.error) alert(result.error.message);
    }catch(err){ console.error(err); alert('Payment error. Check console.'); }
  });
});
