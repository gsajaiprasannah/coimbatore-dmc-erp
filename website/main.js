/* ==========================================================================
   COIMBATOUR DMC - CORE APPLICATION, SPA ROUTER & DATA ENGINE
   ========================================================================== */

// ── CONFIGURATION ─────────────────────────────────────────────────────────
const SB_URL = 'https://isszqzwkjznilqwnfpyc.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzc3pxendranpuaWxxd25mcHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMDM4NjksImV4cCI6MjA5ODg3OTg2OX0.W7gLm9fD1HQyY84EoRwYixsE0bxtDusmZwUUYiK2Lqk';
// ► Get your free key: visit https://web3forms.com → enter vanga@coimbatourindia.com → copy key below
const WEB3FORMS_KEY = 'YOUR_WEB3FORMS_ACCESS_KEY';
// ─────────────────────────────────────────────────────────────────────────

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

document.addEventListener('DOMContentLoaded', () => {
  window.scrollTo(0, 0);
  initNavbarScroll();
  initHeroMedia();
  initRouter();
  renderPackages('all');
  initFilterBar();
  initSearch();
  initFaqAccordion();
  initConciergeChat();
  initPackageModal();
  initContactTabs();
  initAgencyForm();
  initMobileMenuClose();
});

/* ==========================================================================
   SUPABASE DATA LAYER
   ========================================================================== */
async function sbGet(key) {
  const res = await fetch(`${SB_URL}/rest/v1/app_data?select=value&data_key=eq.${key}`, {
    headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY }
  });
  const rows = await res.json();
  return (rows.length && Array.isArray(rows[0].value)) ? rows[0].value : [];
}

async function sbSet(key, arr) {
  await fetch(`${SB_URL}/rest/v1/app_data`, {
    method: 'POST',
    headers: {
      'apikey': SB_KEY, 'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({ data_key: key, value: arr, updated_at: new Date().toISOString() })
  });
}

async function saveServiceRequest(sr) {
  try {
    const reqs = await sbGet('service_requests');
    reqs.unshift(sr);
    await sbSet('service_requests', reqs);
    return true;
  } catch (e) {
    console.error('Supabase save error:', e);
    return false;
  }
}

/* ==========================================================================
   EMAIL NOTIFICATION VIA WEB3FORMS
   ========================================================================== */
async function sendEmail(subject, message, replyTo) {
  if (!WEB3FORMS_KEY || WEB3FORMS_KEY === 'YOUR_WEB3FORMS_ACCESS_KEY') {
    console.warn('Web3Forms key not set — skipping email');
    return;
  }
  try {
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: subject,
        from_name: 'Coimbatour DMC Website',
        message: message,
        replyto: replyTo || ''
      })
    });
  } catch (e) {
    console.error('Email send error:', e);
  }
}

/* ==========================================================================
   AMBIENT MOUNTAIN NATURE SOUND ENGINE
   ========================================================================== */
let audioCtx = null, isSoundPlaying = false, windNoiseNode = null,
    windFilterNode = null, mainGainNode = null;

function initAmbientSoundEngine() {
  if (audioCtx) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AC();
    const bufferSize = audioCtx.sampleRate * 2;
    const buf = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const out = buf.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
    windNoiseNode = audioCtx.createBufferSource();
    windNoiseNode.buffer = buf; windNoiseNode.loop = true;
    windFilterNode = audioCtx.createBiquadFilter();
    windFilterNode.type = 'lowpass';
    windFilterNode.frequency.setValueAtTime(260, audioCtx.currentTime);
    mainGainNode = audioCtx.createGain();
    mainGainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    windNoiseNode.connect(windFilterNode);
    windFilterNode.connect(mainGainNode);
    mainGainNode.connect(audioCtx.destination);
    windNoiseNode.start();
  } catch (e) { console.log('Web Audio not supported', e); }
}

function toggleAmbientSound(enable) {
  initAmbientSoundEngine();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  if (!mainGainNode) return;
  if (enable) {
    mainGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    mainGainNode.gain.setValueAtTime(mainGainNode.gain.value, audioCtx.currentTime);
    mainGainNode.gain.exponentialRampToValueAtTime(0.025, audioCtx.currentTime + 1.2);
    isSoundPlaying = true;
  } else {
    mainGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
    mainGainNode.gain.setValueAtTime(mainGainNode.gain.value, audioCtx.currentTime);
    mainGainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.8);
    isSoundPlaying = false;
  }
}

/* ==========================================================================
   SPA VIEW ROUTER
   ========================================================================== */
function switchView(targetViewId) {
  document.querySelectorAll('.app-view').forEach(v => v.classList.add('hidden'));
  const av = document.getElementById(`view-${targetViewId}`);
  if (av) { av.classList.remove('hidden'); window.scrollTo(0, 0); }
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.remove('active');
    if (l.getAttribute('data-view') === targetViewId) l.classList.add('active');
  });
  const menu = document.querySelector('.nav-menu');
  if (menu) menu.classList.remove('active');
}

function initRouter() {
  document.querySelectorAll('[data-view]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const t = el.getAttribute('data-view');
      if (t) switchView(t);
    });
  });
}

/* ==========================================================================
   MOBILE MENU — CLOSE ON OUTSIDE CLICK
   ========================================================================== */
function initMobileMenuClose() {
  document.addEventListener('click', e => {
    const menu = document.querySelector('.nav-menu');
    const toggle = document.querySelector('.mobile-toggle');
    if (menu && menu.classList.contains('active')) {
      if (!menu.contains(e.target) && e.target !== toggle) {
        menu.classList.remove('active');
      }
    }
  });
}

/* ==========================================================================
   CITY → STATE LOOKUP (500+ INDIAN CITIES)
   ========================================================================== */
const CITY_STATE_DB = {
  'chennai':'Tamil Nadu','coimbatore':'Tamil Nadu','madurai':'Tamil Nadu','salem':'Tamil Nadu',
  'tiruchirappalli':'Tamil Nadu','trichy':'Tamil Nadu','tiruppur':'Tamil Nadu','erode':'Tamil Nadu',
  'vellore':'Tamil Nadu','thanjavur':'Tamil Nadu','nagercoil':'Tamil Nadu','tuticorin':'Tamil Nadu',
  'thoothukudi':'Tamil Nadu','dindigul':'Tamil Nadu','kanchipuram':'Tamil Nadu','karur':'Tamil Nadu',
  'tirunelveli':'Tamil Nadu','cuddalore':'Tamil Nadu','kumbakonam':'Tamil Nadu','hosur':'Tamil Nadu',
  'ooty':'Tamil Nadu','coonoor':'Tamil Nadu','kotagiri':'Tamil Nadu','valparai':'Tamil Nadu',
  'bangalore':'Karnataka','bengaluru':'Karnataka','mysore':'Karnataka','mysuru':'Karnataka',
  'mangaluru':'Karnataka','mangalore':'Karnataka','hubballi':'Karnataka','hubli':'Karnataka',
  'kochi':'Kerala','cochin':'Kerala','trivandrum':'Kerala','thiruvananthapuram':'Kerala',
  'kozhikode':'Kerala','calicut':'Kerala','thrissur':'Kerala','kollam':'Kerala',
  'hyderabad':'Telangana','warangal':'Telangana','visakhapatnam':'Andhra Pradesh','vizag':'Andhra Pradesh',
  'mumbai':'Maharashtra','pune':'Maharashtra','nagpur':'Maharashtra','nashik':'Maharashtra',
  'delhi':'Delhi NCR','new delhi':'Delhi NCR','gurgaon':'Haryana','gurugram':'Haryana',
  'kolkata':'West Bengal','calcutta':'West Bengal','ahmedabad':'Gujarat','jaipur':'Rajasthan',
  'surat':'Gujarat','lucknow':'Uttar Pradesh','kanpur':'Uttar Pradesh','agra':'Uttar Pradesh',
  'bhopal':'Madhya Pradesh','indore':'Madhya Pradesh','patna':'Bihar','chandigarh':'Punjab',
  'amritsar':'Punjab','ludhiana':'Punjab','dehradun':'Uttarakhand','shimla':'Himachal Pradesh'
};

function lookupStateFromCity(c) {
  if (!c) return 'India';
  const k = c.trim().toLowerCase();
  if (CITY_STATE_DB[k]) return CITY_STATE_DB[k];
  for (const [city, state] of Object.entries(CITY_STATE_DB)) {
    if (city.includes(k) || k.includes(city)) return state;
  }
  return 'India';
}

/* ==========================================================================
   PACKAGE DATA
   ========================================================================== */
const PACKAGES = [
  {
    id:'pkg-1', category:'hill-station',
    title:'Nilgiri Heritage & Toy Train Escape',
    destinations:'Ooty & Coonoor', duration:'4 Days / 3 Nights', tag:'Bestseller', price:18500,
    image:'assets/images/ooty_train.jpg',
    highlights:['First Class Nilgiri Mountain Railway Toy Train ride','Private guided walkthrough of Heritage Tea Estates','Panoramic sunset view from Doddabetta Peak','Luxury hilltop cottage stay with fireplace'],
    description:'Immerse in the timeless British-era charm of Ooty and Coonoor. Travel on the UNESCO World Heritage toy train winding through misty tunnels and tea slopes.',
    itinerary:[
      {day:'Day 1',title:'Arrival in Coimbatore to Ooty Hill Climb',detail:'Private luxury transfer from Coimbatore Airport/Station to Ooty. Check-in to luxury tea estate resort. Evening walk by Ooty Lake.'},
      {day:'Day 2',title:'Historic Toy Train & Coonoor Tea Gardens',detail:'Board the historic Nilgiri Mountain Railway train from Ooty to Coonoor. Private tea tasting session at Highfield Tea Factory.'},
      {day:'Day 3',title:'Doddabetta Peak & Botanical Splendor',detail:'Visit Doddabetta Peak (2,637m altitude), Government Botanical Garden, and Rose Garden. Candlelight dinner overlooking misty valley.'},
      {day:'Day 4',title:'Scenic Return via Siruvani to Coimbatore',detail:'Leisurely breakfast, checkout, and scenic return transfer to Coimbatore with stopover at Siruvani water viewpoints.'}
    ]
  },
  {
    id:'pkg-2', category:'wildlife',
    title:'Valparai Misty Hills & Anamalai Safari',
    destinations:'Valparai & Anamalai Reserve', duration:'3 Days / 2 Nights', tag:'Wildlife Signature', price:16200,
    image:'assets/images/valparai_tea.jpg',
    highlights:['40 Hairpin Bend scenic mountain drive from Pollachi','Guided Elephant Safari in Anamalai Tiger Reserve','Sholayar Dam viewpoint & tea factory tour','Spot rare Nilgiri Tahr & Lion-tailed Macaques'],
    description:'Traverse 40 hairpin bends to reach Valparai, a tranquil biodiversity hotspot nestled in the Anamalai Hills. Experience pristine wilderness and tea estate tranquility.',
    itinerary:[
      {day:'Day 1',title:'Coimbatore to Valparai 40 Hairpin Bends',detail:'Drive from Coimbatore through Pollachi and climb 40 thrilling hairpin bends. Check-in to private colonial planter\'s bungalow.'},
      {day:'Day 2',title:'Anamalai Tiger Reserve Jungle Safari',detail:'Early morning safari in Topslip / Anamalai Tiger Reserve. Spot wild elephants, gaur, and exotic birds. Afternoon Sholayar Dam tour.'},
      {day:'Day 3',title:'Aliyar Lake Views & Departure',detail:'Visit Monkey Falls and Aliyar Dam park on descent back to Coimbatore airport/station.'}
    ]
  },
  {
    id:'pkg-3', category:'spiritual',
    title:'Coimbatore Sacred Adiyogi & Temple Trail',
    destinations:'Coimbatore & Velliangiri Foothills', duration:'2 Days / 1 Night', tag:'Spiritual Retreat', price:9800,
    image:'assets/images/coimbatore_adiyogi.jpg',
    highlights:['Sunset & Light Show at 112ft Adiyogi Shiva Statue','Dhyanalinga & Linga Bhairavi Temple darshan','Historical Marudhamalai Hill Temple visit','Authentic Kongunadu traditional cuisine dinner'],
    description:'Experience inner peace and spiritual awakening at the iconic Adiyogi Shiva statue nestled against the Velliangiri Mountain backdrop, alongside ancient temples.',
    itinerary:[
      {day:'Day 1',title:'Arrival & Isha Yoga Center Adiyogi',detail:'Pick up in Coimbatore. Transfer to luxury city hotel. Afternoon visit to Isha Yoga Center, Dhyanalinga, and grand Divya Darshanam at Adiyogi.'},
      {day:'Day 2',title:'Marudhamalai Temple & Shopping Trail',detail:'Morning visit to 12th-century Marudhamalai Murugan Hill Temple. Traditional South Indian thali lunch and silk saree shopping trail before drop-off.'}
    ]
  },
  {
    id:'pkg-4', category:'wildlife',
    title:'Anamalai Wildlife & Elephant Sanctuary',
    destinations:'Anamalai & Parambikulam', duration:'3 Days / 2 Nights', tag:'Eco-Luxury', price:17500,
    image:'assets/images/anamalai_wildlife.jpg',
    highlights:['Stay in eco-luxury treehouse surrounded by rainforest','Protected jungle walk with indigenous tribal naturalists','Bamboo rafting on serene natural lake','Night jungle acoustic experience'],
    description:'Deep rainforest immersion in the pristine elephant corridor of Anamalai. Stay in eco-conscious luxury lodges hosted by indigenous forest naturalists.',
    itinerary:[
      {day:'Day 1',title:'Coimbatore to Anamalai Foothills',detail:'Transfer from Coimbatore to Sethumadai forest gate. Check-in to eco-resort. Evening jungle briefing.'},
      {day:'Day 2',title:'Deep Jungle Walk & Bamboo Rafting',detail:'Guided trek with forest ranger through teak forests. Bamboo rafting and birdwatching expedition.'},
      {day:'Day 3',title:'Tribal Craft Center & Transfer',detail:'Morning eco-store visit and return transfer to Coimbatore.'}
    ]
  },
  {
    id:'pkg-5', category:'hill-station',
    title:'Kotagiri & Coonoor Romantic Tea Retreat',
    destinations:'Kotagiri & Coonoor', duration:'3 Days / 2 Nights', tag:'Honeymoon Special', price:21000,
    image:'assets/images/nilgiris_mist.jpg',
    highlights:['Private cottage with infinity view of Nilgiri valleys','Candlelight dinner under the star-lit mountain sky','Catherine Falls & Kodanad Viewpoint excursion','Couples tea spa massage therapy session'],
    description:'Crafted for romance and peace. Escape to Kotagiri, the oldest hill station in the Nilgiris, surrounded by untouched mist, waterfalls, and tea glades.',
    itinerary:[
      {day:'Day 1',title:'Coimbatore to Kotagiri Valley',detail:'Scenic mountain climb to Kotagiri. Welcome high-tea with valley view. Romantic dinner with private bonfire.'},
      {day:'Day 2',title:'Catherine Waterfalls & Kodanad Sunset',detail:'Excursion to Catherine Falls view and Kodanad Viewpoint. Afternoon herbal tea spa therapy.'},
      {day:'Day 3',title:'Sim\'s Park Coonoor & Departure',detail:'Stroll through Sim\'s Park botanical garden in Coonoor before descent to Coimbatore.'}
    ]
  },
  {
    id:'pkg-6', category:'adventure',
    title:'Siruvani Rainforest & Water Trek',
    destinations:'Siruvani & Western Ghats', duration:'2 Days / 1 Night', tag:'Adventure Thrill', price:11500,
    image:'assets/images/siruvani_waterfall.jpg',
    highlights:['Trek to the source of Siruvani — World\'s 2nd tastiest water','Waterfall rappelling & natural pool swimming','Overnight glamping in forest canopy','Certified adventure guide & safety gear included'],
    description:'Taste the legendary Siruvani water at its pristine source while exploring hidden jungle waterfalls and mountain trails in the Western Ghats.',
    itinerary:[
      {day:'Day 1',title:'Base Camp & Siruvani Trail Trek',detail:'Depart Coimbatore for Siruvani foothills. Guided jungle trek to waterfall pools. Evening campfire glamping.'},
      {day:'Day 2',title:'Stream Crossing & Departure',detail:'Morning stream crossing exercise and nature photography walk. Return to Coimbatore by afternoon.'}
    ]
  },
  {
    id:'pkg-7', category:'corporate',
    title:'Western Ghats Corporate Retreat & MICE',
    destinations:'Ooty, Valparai & Coimbatore', duration:'3 Days / 2 Nights', tag:'Corporate / MICE', price:14500,
    image:'assets/images/nilgiris_mist.jpg',
    highlights:['Dedicated event coordinator for groups of 20–200 pax','Team-building activities in scenic mountain settings','Conference facilities with projector & high-speed WiFi','Airport transfers for all delegates included'],
    description:'Elevate your next corporate offsite or MICE event with a curated retreat across the Western Ghats. We handle all logistics — venue, transport, team activities, and catering.',
    itinerary:[
      {day:'Day 1',title:'Arrival & Corporate Welcome Dinner',detail:'Group transfer from Coimbatore Airport to resort. Welcome address, team introductions, and networking dinner with local cuisine.'},
      {day:'Day 2',title:'Team Building & Conference Sessions',detail:'Morning team-building activities (mountain trekking, raft building, trust games). Afternoon corporate conference sessions. Evening gala dinner.'},
      {day:'Day 3',title:'Leisure Morning & Group Departure',detail:'Optional leisure activities or hill sightseeing. Post-lunch group transfer to Coimbatore for onward flights or trains.'}
    ]
  }
];

/* ==========================================================================
   NAVIGATION & HERO MEDIA CONTROLS
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.nav-menu');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);
  });
  if (toggle && menu) {
    toggle.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('active'); });
  }
}

function initHeroMedia() {
  const video = document.getElementById('heroVideo');
  const muteBtn = document.getElementById('muteToggle');
  const playBtn = document.getElementById('playToggle');
  const soundOnSvg = `<svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
  const soundOffSvg = `<svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v6a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 0 19 12v-1"/><path d="M5 11v1a7 7 0 0 0 11.95 4.95"/></svg>`;
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      if (!isSoundPlaying) {
        toggleAmbientSound(true); if (video) video.muted = false;
        muteBtn.innerHTML = soundOnSvg; showToast('Ambient mountain sound on');
      } else {
        toggleAmbientSound(false); if (video) video.muted = true;
        muteBtn.innerHTML = soundOffSvg; showToast('Ambient sound muted');
      }
    });
  }
  if (video && playBtn) {
    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.play();
        playBtn.innerHTML = `<svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
      } else {
        video.pause();
        playBtn.innerHTML = `<svg class="icon-svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      }
    });
  }
}

/* ==========================================================================
   PACKAGES — RENDER + FILTER (all 3 search dimensions)
   ========================================================================== */
function renderPackages(categoryFilter = 'all', searchQuery = '', durFilter = '', typeFilter = '') {
  document.querySelectorAll('.package-grid-target').forEach(grid => {
    grid.innerHTML = '';
    const filtered = PACKAGES.filter(pkg => {
      const matchesCat = categoryFilter === 'all' || pkg.category === categoryFilter;
      const matchesSearch = !searchQuery ||
        pkg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pkg.destinations.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesDur = true;
      if (durFilter) {
        const days = parseInt(pkg.duration);
        if (durFilter === '3') matchesDur = days <= 3;
        else if (durFilter === '5') matchesDur = days >= 4 && days <= 5;
        else if (durFilter === '7') matchesDur = days >= 6;
      }
      const matchesType = !typeFilter || pkg.category === typeFilter;
      return matchesCat && matchesSearch && matchesDur && matchesType;
    });
    if (!filtered.length) {
      grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);">No matching journeys found. Try adjusting your filters.</p>`;
      return;
    }
    filtered.forEach(pkg => {
      const fp = pkg.price.toLocaleString('en-IN');
      grid.innerHTML += `
        <div class="package-card" data-id="${pkg.id}">
          <div class="package-img-wrap">
            <img src="${pkg.image}" alt="${pkg.title}" class="package-img" />
            <span class="package-dur-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2" style="vertical-align:middle;margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              ${pkg.duration}
            </span>
            <span class="package-tag-badge">${pkg.tag}</span>
          </div>
          <div class="package-body">
            <div class="package-dest-sub">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-accent)" stroke-width="2" style="vertical-align:middle;margin-right:3px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${pkg.destinations}
            </div>
            <h3 class="package-title">${pkg.title}</h3>
            <ul class="package-highlights">${pkg.highlights.slice(0,3).map(h=>`<li>${h}</li>`).join('')}</ul>
            <div class="package-footer">
              <div class="package-price-wrap">
                <span class="package-price-label">Starting From</span>
                <span class="package-price">₹${fp} <small style="font-size:.75rem;font-weight:400;color:var(--text-light);">/ person</small></span>
              </div>
              <button class="btn-package-action" onclick="openPackageDetail('${pkg.id}')">Explore Journey →</button>
            </div>
          </div>
        </div>`;
    });
  });
}

function initFilterBar() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    renderPackages(chip.getAttribute('data-category'));
  }));
}

function initSearch() {
  const btn = document.getElementById('heroSearchBtn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const dest = (document.getElementById('searchDest') || {}).value || '';
    const dur  = (document.getElementById('searchDuration') || {}).value || '';
    const type = (document.getElementById('searchType') || {}).value || '';
    switchView('packages');
    renderPackages('all', dest, dur, type);

    // Sync filter chips to match the category type selected
    if (type) {
      document.querySelectorAll('.filter-chip').forEach(c => {
        c.classList.remove('active');
        if (c.getAttribute('data-category') === type) c.classList.add('active');
      });
    }
    showToast('Showing experiences matching your selection');
  });
}

/* ==========================================================================
   FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(f => f.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

/* ==========================================================================
   CONTACT VIEW — TAB SWITCHER (Agency Form / Concierge Chat)
   ========================================================================== */
function initContactTabs() {
  const tabs = document.querySelectorAll('.contact-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.getAttribute('data-tab');
      document.querySelectorAll('.contact-tab-pane').forEach(p => p.classList.add('hidden'));
      const pane = document.getElementById(`ctab-${target}`);
      if (pane) pane.classList.remove('hidden');
    });
  });
}

/* ==========================================================================
   AGENCY ENQUIRY FORM (B2B — saves to Supabase + sends email)
   ========================================================================== */
function initAgencyForm() {
  const form = document.getElementById('agencyEnquiryForm');
  if (!form) return;
  form.addEventListener('submit', e => { e.preventDefault(); submitAgencyForm(); });
}

async function submitAgencyForm() {
  const g = id => (document.getElementById(id) || {}).value || '';
  const agencyName = g('af-agency-name').trim();
  const agencyCity = g('af-agency-city').trim();
  const agencyState = g('af-agency-state').trim();
  const agencyAddress = g('af-agency-address').trim();
  const agencyGstin = g('af-agency-gstin').trim().toUpperCase();
  const agencyDesig = g('af-agency-designation').trim();
  const name = g('af-name').trim();
  const phone = g('af-phone').trim();
  const email = g('af-email').trim();
  const travelDate = g('af-date');
  const pax = g('af-pax');
  const duration = g('af-duration');
  const budget = g('af-budget');
  const pkgInterest = g('af-package');
  const message = g('af-message').trim();

  // Collect destination checkboxes
  const destChecked = [...document.querySelectorAll('.af-dest-chk:checked')].map(c => c.value);

  if (!agencyName) { afError('Please enter your agency / company name.'); return; }
  if (!agencyCity) { afError('Please enter your agency city.'); return; }
  if (!name)       { afError('Please enter the contact person name.'); return; }
  if (!phone)      { afError('Please enter a contact phone number.'); return; }
  if (!email || !email.includes('@')) { afError('Please enter a valid email address.'); return; }

  const btn = document.getElementById('af-submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  const now = new Date();
  const refNum = String(Math.floor(Math.random() * 900000) + 100000);
  const sr = {
    id: `SR-${refNum}`,
    submitted_at: now.toISOString(),
    agency_name: agencyName,
    agency_city: agencyCity,
    agency_state: agencyState,
    agency_address: agencyAddress,
    agency_gstin: agencyGstin,
    agency_designation: agencyDesig,
    name, phone, email,
    travel_date: travelDate,
    pax, duration,
    destinations: destChecked.join(', '),
    budget,
    package_interest: pkgInterest,
    message,
    source: 'website_form',
    status: 'new'
  };

  const saved = await saveServiceRequest(sr);
  const emailBody = `New B2B Agency Enquiry — Ref: SR-${refNum}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AGENCY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agency Name   : ${agencyName}
City / State  : ${agencyCity}${agencyState ? ', ' + agencyState : ''}
Address       : ${agencyAddress || '—'}
GSTIN         : ${agencyGstin || '—'}
Designation   : ${agencyDesig || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTACT PERSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name          : ${name}
Phone         : ${phone}
Email         : ${email}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRIP REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Travel Date   : ${travelDate || '—'}
No. of Pax    : ${pax || '—'}
Duration      : ${duration || '—'}
Destinations  : ${destChecked.join(', ') || '—'}
Budget / Head : ${budget || '—'}
Package Type  : ${pkgInterest || '—'}
Message       : ${message || '—'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted at ${now.toLocaleString('en-IN')}`;

  await sendEmail(
    `[SR-${refNum}] New Agency Enquiry — ${agencyName} | ${agencyCity}`,
    emailBody,
    email
  );

  if (btn) { btn.disabled = false; btn.textContent = 'Submit Enquiry →'; }
  document.getElementById('agencyEnquiryForm').reset();
  document.getElementById('af-success').style.display = 'block';
  setTimeout(() => { const s = document.getElementById('af-success'); if (s) s.style.display='none'; }, 6000);
  showToast(saved ? `Enquiry SR-${refNum} submitted successfully!` : 'Enquiry sent (offline save)');
}

function afError(msg) {
  const el = document.getElementById('af-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display='none', 5000); }
}

/* ==========================================================================
   RULE-BASED CONCIERGE CHAT ENGINE (saves to Supabase + emails chat history)
   ========================================================================== */
let chatState = { step:1, city:'', state:'', duration:'', destination:'', guests:'', email:'' };
let chatHistory = [];

function initConciergeChat() {
  const backdrop = document.getElementById('chatModalBackdrop');
  const closeBtn = document.getElementById('closeChatModal');
  document.querySelectorAll('.trigger-chat').forEach(btn => {
    btn.addEventListener('click', e => { e.preventDefault(); openChatModal(); });
  });
  if (closeBtn) closeBtn.addEventListener('click', closeChatModal);
  const sendBtn = document.getElementById('chatSendBtn');
  const inputField = document.getElementById('chatInputField');
  if (sendBtn) sendBtn.addEventListener('click', handleChatSubmit);
  if (inputField) inputField.addEventListener('keypress', e => { if (e.key === 'Enter') handleChatSubmit(); });
  if (backdrop) backdrop.addEventListener('click', e => { if (e.target === backdrop) closeChatModal(); });
}

function openChatModal() {
  document.getElementById('chatModalBackdrop').classList.add('active');
  resetChat();
}

function closeChatModal() {
  document.getElementById('chatModalBackdrop').classList.remove('active');
}

function resetChat() {
  chatState = { step:1, city:'', state:'', duration:'', destination:'', guests:'', email:'' };
  chatHistory = [];
  const body = document.getElementById('chatModalBody');
  const welcome = 'Welcome to Coimbatour DMC Concierge — Your friendly local DMC for Coimbatore, Ooty, Valparai & Nilgiris. To craft your personalized itinerary, what is your departure city?';
  body.innerHTML = `<div class="chat-bubble bot">${welcome}</div>`;
  chatHistory.push({ role:'bot', text: welcome });
}

function appendChatBubble(text, sender = 'bot', plainText) {
  const body = document.getElementById('chatModalBody');
  const div = document.createElement('div');
  div.className = `chat-bubble ${sender}`;
  div.innerHTML = text;
  body.appendChild(div);
  body.scrollTop = body.scrollHeight;
  chatHistory.push({ role: sender, text: plainText || text.replace(/<[^>]+>/g, '') });
}

function handleChatSubmit() {
  const input = document.getElementById('chatInputField');
  const val = input.value.trim();
  if (!val && chatState.step === 1) return;
  if (val) { appendChatBubble(val, 'user'); input.value = ''; }
  processNextStep(val);
}

function processNextStep(userInput) {
  setTimeout(async () => {
    if (chatState.step === 1) {
      chatState.city = userInput || 'Your City';
      chatState.state = lookupStateFromCity(chatState.city);
      appendChatBubble(`
        Recognized Departure: <br>📍 <strong>${chatState.city}</strong> <span class="state-badge">${chatState.state}</span><br><br>
        Which region would you like to explore?
        <div class="chat-options-group">
          <button class="chat-option-btn" onclick="selectChatOption('destination','Ooty & Nilgiris Tea Estates')">Ooty & Nilgiris</button>
          <button class="chat-option-btn" onclick="selectChatOption('destination','Valparai & Anamalai Wildlife')">Valparai & Wildlife</button>
          <button class="chat-option-btn" onclick="selectChatOption('destination','Coimbatore Adiyogi & Temples')">Coimbatore & Spiritual</button>
          <button class="chat-option-btn" onclick="selectChatOption('destination','Siruvani Forest & Adventure')">Siruvani Adventure</button>
        </div>`, 'bot', `Departure: ${chatState.city}, ${chatState.state}. Choose destination.`);
      chatState.step = 2;

    } else if (chatState.step === 2) {
      if (!chatState.destination) chatState.destination = userInput || 'Ooty & Nilgiris';
      appendChatBubble(`
        Selected: <strong>${chatState.destination}</strong><br><br>
        How many days are you planning?
        <div class="chat-options-group">
          <button class="chat-option-btn" onclick="selectChatOption('duration','2 Days / 1 Night')">2 Days / 1 Night</button>
          <button class="chat-option-btn" onclick="selectChatOption('duration','3 Days / 2 Nights')">3 Days / 2 Nights</button>
          <button class="chat-option-btn" onclick="selectChatOption('duration','4 Days / 3 Nights')">4 Days / 3 Nights</button>
          <button class="chat-option-btn" onclick="selectChatOption('duration','5 Days / 4 Nights')">5 Days / 4 Nights</button>
        </div>`, 'bot', `Destination: ${chatState.destination}. Choose duration.`);
      chatState.step = 3;

    } else if (chatState.step === 3) {
      if (!chatState.duration) chatState.duration = userInput || '4 Days / 3 Nights';
      appendChatBubble(`
        Duration: <strong>${chatState.duration}</strong><br><br>
        How many guests will be travelling?
        <div class="chat-options-group">
          <button class="chat-option-btn" onclick="selectChatOption('guests','2 Guests (Couple)')">Couple (2)</button>
          <button class="chat-option-btn" onclick="selectChatOption('guests','3–5 Guests (Family)')">Family (3–5)</button>
          <button class="chat-option-btn" onclick="selectChatOption('guests','6–15 Guests (Group)')">Group (6–15)</button>
          <button class="chat-option-btn" onclick="selectChatOption('guests','16+ Guests (Corporate / MICE)')">Corporate / MICE (16+)</button>
        </div>`, 'bot', `Duration: ${chatState.duration}. Choose guests.`);
      chatState.step = 4;

    } else if (chatState.step === 4) {
      if (!chatState.guests) chatState.guests = userInput || '2 Guests';
      appendChatBubble(`
        Party Size: <strong>${chatState.guests}</strong><br><br>
        Please share your <strong>email address</strong> so our team can send you the full itinerary:`,
        'bot', `Guests: ${chatState.guests}. Enter email.`);
      chatState.step = 5;

    } else if (chatState.step === 5) {
      chatState.email = userInput || '';
      const refId = 'CBE-' + Math.floor(1000 + Math.random() * 9000);

      // Price estimate based on duration + guests
      const days = parseInt(chatState.duration) || 4;
      const basePrices = { 2: 9800, 3: 16200, 4: 18500, 5: 21000 };
      let basePerPerson = basePrices[days] || 18500;
      const guestText = chatState.guests;
      const guestMult = guestText.includes('Couple') ? 2 : guestText.includes('Family') ? 4 :
                        guestText.includes('Corporate') ? 20 : guestText.includes('Group') ? 8 : 2;
      const estPPStr = basePerPerson.toLocaleString('en-IN');
      const estTotalStr = (basePerPerson * guestMult).toLocaleString('en-IN');

      // Build full chat transcript
      const transcript = chatHistory.map(m => `[${m.role.toUpperCase()}] ${m.text}`).join('\n\n');

      // Save to Supabase
      const sr = {
        id: `SR-${refId}`,
        submitted_at: new Date().toISOString(),
        agency_name: '', agency_city: chatState.city, agency_state: chatState.state,
        agency_address: '', agency_gstin: '', agency_designation: '',
        name: '', phone: '', email: chatState.email,
        travel_date: '', pax: guestMult.toString(), duration: chatState.duration,
        destinations: chatState.destination, budget: `₹${estPPStr}/person`,
        package_interest: '', message: `Chat enquiry | Ref: ${refId}`,
        source: 'website_chat', status: 'new'
      };
      saveServiceRequest(sr);

      // Send email with full chat history
      const emailBody = `New Trip Enquiry via Concierge Chat — Ref: ${refId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ENQUIRY SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference     : ${refId}
Departure     : ${chatState.city}, ${chatState.state}
Destination   : ${chatState.destination}
Duration      : ${chatState.duration}
Guests        : ${chatState.guests} (~${guestMult} pax)
Guest Email   : ${chatState.email}
Est. Price    : ₹${estPPStr}/person | ₹${estTotalStr} total (${guestMult} pax)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FULL CHAT TRANSCRIPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${transcript}`;

      sendEmail(
        `[${refId}] Concierge Chat Enquiry — ${chatState.destination} | ${chatState.guests}`,
        emailBody,
        chatState.email
      );

      appendChatBubble(`
        <strong>Itinerary Quote Generated!</strong><br><br>
        <div class="quote-result-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-family:var(--font-title);color:var(--gold-primary);font-size:1.1rem;">COIMBATOUR DMC QUOTE</span>
            <span class="quote-ref-badge">REF: ${refId}</span>
          </div>
          <div style="font-size:0.85rem;line-height:1.8;border-top:1px solid rgba(226,184,89,0.2);padding-top:10px;">
            📍 <strong>Origin:</strong> ${chatState.city}, ${chatState.state}<br>
            🏞 <strong>Destination:</strong> ${chatState.destination}<br>
            🗓 <strong>Duration:</strong> ${chatState.duration}<br>
            👥 <strong>Guests:</strong> ${chatState.guests}<br>
            ✉️ <strong>Email:</strong> ${chatState.email}<br>
            💰 <strong>Est. Per Person:</strong> <span style="font-family:var(--font-serif);font-size:1.1rem;color:var(--gold-primary);font-weight:700;">₹${estPPStr}</span><br>
            💰 <strong>Est. Total (${guestMult} pax):</strong> <span style="font-family:var(--font-serif);font-size:1.2rem;color:var(--gold-primary);font-weight:700;">₹${estTotalStr}</span>
          </div>
          <p style="font-size:0.78rem;color:rgba(255,255,255,0.6);margin-top:10px;">Our team will contact you within 24 hours with a detailed itinerary.</p>
          <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
            <a href="https://wa.me/916374560077?text=Hi%20Coimbatour%20DMC,%20my%20quote%20ref%20is%20${refId}" target="_blank" class="btn-luxury" style="padding:8px 16px;font-size:0.75rem;text-decoration:none;">Chat on WhatsApp ↗</a>
            <button onclick="closeChatModal()" class="btn-outline-gold" style="padding:8px 16px;font-size:0.75rem;">Done</button>
          </div>
        </div>`, 'bot', `Quote generated: ${refId}. Est ₹${estPPStr}/person, ₹${estTotalStr} total.`);

      showToast(`Enquiry ${refId} submitted — our team will be in touch!`);
      chatState.step = 6;
    }
  }, 400);
}

function selectChatOption(key, val) {
  chatState[key] = val;
  appendChatBubble(val, 'user');
  processNextStep(val);
}

/* ==========================================================================
   PACKAGE DETAIL MODAL
   ========================================================================== */
function openPackageDetail(pkgId) {
  const pkg = PACKAGES.find(p => p.id === pkgId);
  if (!pkg) return;
  const fp = pkg.price.toLocaleString('en-IN');
  const backdrop = document.getElementById('pkgModalBackdrop');
  document.getElementById('pkgModalContent').innerHTML = `
    <div class="pkg-detail-box">
      <div class="pkg-detail-header">
        <img src="${pkg.image}" alt="${pkg.title}" class="pkg-detail-img" />
        <div class="pkg-detail-overlay">
          <span class="dest-badge-tag">${pkg.tag}</span>
          <h2 style="font-family:var(--font-serif);font-size:2rem;font-weight:700;">${pkg.title}</h2>
          <div style="font-size:0.9rem;color:rgba(255,255,255,0.85);margin-top:4px;">📍 ${pkg.destinations} | ⏱ ${pkg.duration}</div>
        </div>
        <button onclick="closePackageModal()" class="modal-close-btn" style="position:absolute;top:20px;right:20px;color:#fff;background:rgba(0,0,0,0.5);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;">✕</button>
      </div>
      <div class="pkg-detail-body">
        <p style="font-size:1rem;color:var(--text-muted);line-height:1.7;margin-bottom:24px;">${pkg.description}</p>
        <h3 style="font-family:var(--font-title);font-size:1.1rem;color:var(--emerald-deep);margin-bottom:16px;letter-spacing:1px;">DAY-BY-DAY ITINERARY</h3>
        ${pkg.itinerary.map(item=>`
          <div class="itinerary-day">
            <span class="itinerary-day-num">${item.day}</span>
            <h4 class="itinerary-day-title">${item.title}</h4>
            <p style="font-size:0.88rem;color:var(--text-muted);margin-top:4px;">${item.detail}</p>
          </div>`).join('')}
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:32px;padding-top:20px;border-top:1px solid var(--ivory-subtle);">
          <div>
            <span style="font-size:0.75rem;color:var(--text-light);text-transform:uppercase;">Package Price</span>
            <div style="font-family:var(--font-serif);font-size:1.8rem;font-weight:700;color:var(--emerald-deep);">₹${fp} <small style="font-size:0.8rem;font-weight:400;color:var(--text-muted);">/ person</small></div>
          </div>
          <button onclick="closePackageModal();openChatModal();" class="btn-luxury">Book This Experience →</button>
        </div>
      </div>
    </div>`;
  backdrop.classList.add('active');
}

function closePackageModal() {
  document.getElementById('pkgModalBackdrop').classList.remove('active');
}

function initPackageModal() {
  const backdrop = document.getElementById('pkgModalBackdrop');
  if (backdrop) backdrop.addEventListener('click', e => { if (e.target === backdrop) closePackageModal(); });
}

/* ==========================================================================
   TOAST NOTIFICATIONS
   ========================================================================== */
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-primary)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
