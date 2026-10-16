// Main Application Controller & Interactions
import confetti from 'canvas-confetti';
import { bookingEngine } from './modules/bookingEngine.js';
import { renderSeatMap } from './modules/seatMap.js';
import { renderTicketPass } from './modules/ticketGenerator.js';
import { renderAdminPortal } from './modules/adminPortal.js';
import { getAvailableDates } from './data/mockData.js';
import { generateQRCodeUrl } from './utils/qrHelper.js';

// DOM Elements
const customerPortalView = document.getElementById('customer-portal-view');
const adminPortalView = document.getElementById('admin-portal-view');
const heroBannerContainer = document.getElementById('hero-banner-container');
const moviesGridContainer = document.getElementById('movies-grid-container');
const bookingModalOverlay = document.getElementById('booking-modal-overlay');
const checkoutModalOverlay = document.getElementById('checkout-modal-overlay');
const ticketModalContainer = document.getElementById('ticket-modal-container');

const cinemaSelect = document.getElementById('cinema-select');
const dateChipsContainer = document.getElementById('date-chips-container');
const showtimesSlotsContainer = document.getElementById('showtimes-slots-container');
const seatMapContainer = document.getElementById('seat-map-container');
const modalMovieInfo = document.getElementById('modal-movie-info');

const holdTimerContainer = document.getElementById('hold-timer-container');
const holdCountdownTimer = document.getElementById('hold-countdown-timer');

const selectedSeatsText = document.getElementById('selected-seats-text');
const totalAmountText = document.getElementById('total-amount-text');
const proceedCheckoutBtn = document.getElementById('proceed-checkout-btn');
const cancelSelectionBtn = document.getElementById('cancel-selection-btn');
const closeBookingModalBtn = document.getElementById('close-booking-modal-btn');
const closeCheckoutModalBtn = document.getElementById('close-checkout-modal-btn');

const ticketCountBadge = document.getElementById('ticket-count-badge');
const navMyTicketsBtn = document.getElementById('nav-my-tickets-btn');
const toggleAdminBtn = document.getElementById('toggle-admin-btn');
const brandHomeBtn = document.getElementById('brand-home-btn');

let activeGenreFilter = 'ALL';
let activePaymentMethod = 'promptpay';

// Initialize Application
function initApp() {
  updateTicketCount();
  renderHeroBanner();
  renderMovieCatalog();
  setupEventListeners();

  // Subscribe to bookingEngine state changes
  bookingEngine.subscribe((event, payload) => {
    switch (event) {
      case 'SEATS_UPDATED':
        updateBookingCheckoutBar();
        renderSeatMap(seatMapContainer);
        break;

      case 'HOLD_STARTED':
        holdTimerContainer.style.display = 'block';
        holdCountdownTimer.textContent = payload.formatted;
        break;

      case 'HOLD_TICK':
        holdCountdownTimer.textContent = payload.formatted;
        break;

      case 'HOLD_CANCELLED':
        holdTimerContainer.style.display = 'none';
        break;

      case 'HOLD_EXPIRED':
        holdTimerContainer.style.display = 'none';
        alert('⚠️ หมดเวลาล็อกที่นั่ง 10 นาทีแล้ว! ระบบทำการปลดล็อกที่นั่งให้ผู้อื่นเลือกแล้ว');
        bookingModalOverlay.style.display = 'none';
        checkoutModalOverlay.style.display = 'none';
        break;

      case 'BOOKING_COMPLETED':
        updateTicketCount();
        break;

      case 'MOVIES_UPDATED':
      case 'SHOWTIMES_UPDATED':
        renderHeroBanner();
        renderMovieCatalog();
        break;
    }
  });
}

// Update Ticket Badge Count in Navbar
function updateTicketCount() {
  ticketCountBadge.textContent = bookingEngine.orders.length;
}

// Render Hero Banner
function renderHeroBanner() {
  const featured = bookingEngine.movies[0];
  if (!featured) return;

  heroBannerContainer.innerHTML = `
    <div class="hero-banner" style="background-image: url('${featured.backdrop}');">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="badge-tag">🔥 แนะนำสัปดาห์นี้ • ${featured.format.join(' / ')}</span>
        <h1 class="hero-title">${featured.title}</h1>
        <p class="hero-thai-title">${featured.thaiTitle}</p>
        <div class="hero-meta">
          <span class="meta-score">★ ${featured.imdbScore}</span>
          <span>⏱️ ${featured.duration} นาที</span>
          <span>🛡️ เรตติ้ง ${featured.rating}</span>
          <span>🎭 ${featured.genre.join(', ')}</span>
        </div>
        <div class="hero-actions">
          <button class="btn btn-primary" id="hero-book-now-btn" data-movie-id="${featured.id}">
            <span>🎟️ จองตั๋วภาพยนตร์ตอนนี้</span>
          </button>
          <button class="btn btn-secondary" onclick="alert('ตัวอย่างภาพยนตร์: ${featured.title}\\n\\nเรื่องย่อ: ${featured.synopsis}')">
            <span>▶ ดูเรื่องย่อ & ตัวอย่าง</span>
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('hero-book-now-btn')?.addEventListener('click', (e) => {
    openBookingModal(e.currentTarget.dataset.movieId);
  });
}

// Render Movie Catalog Grid
function renderMovieCatalog() {
  const filtered = activeGenreFilter === 'ALL'
    ? bookingEngine.movies
    : bookingEngine.movies.filter(m => m.genre.includes(activeGenreFilter));

  moviesGridContainer.innerHTML = filtered.map(movie => `
    <div class="movie-card" data-movie-id="${movie.id}">
      <div class="poster-wrap">
        <img src="${movie.poster}" alt="${movie.title}" class="poster-img" loading="lazy">
        <span class="rating-badge">${movie.rating}</span>
        <span class="imdb-badge">★ ${movie.imdbScore}</span>
      </div>
      <div class="movie-details">
        <div class="genre-tags">
          ${movie.genre.map(g => `<span class="genre-tag">${g}</span>`).join('')}
        </div>
        <h3 class="movie-card-title">${movie.title}</h3>
        <p class="movie-card-thai">${movie.thaiTitle || ''}</p>
        <div class="movie-footer">
          <span class="movie-duration">⏱️ ${movie.duration} นาที</span>
          <button class="btn btn-primary btn-book-movie" data-movie-id="${movie.id}">
            <span>จองตั๋ว</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  moviesGridContainer.querySelectorAll('.btn-book-movie').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBookingModal(btn.dataset.movieId);
    });
  });
}

// Open Booking & Seat Selection Modal
function openBookingModal(movieId) {
  bookingEngine.selectMovie(movieId);
  const movie = bookingEngine.selectedMovie;
  if (!movie) return;

  modalMovieInfo.innerHTML = `
    <div style="display: flex; align-items: center; gap: 1rem;">
      <img src="${movie.poster}" style="width: 44px; height: 60px; object-fit: cover; border-radius: 4px;" alt="">
      <div>
        <h3 style="font-size: 1.3rem; line-height: 1.2;">${movie.title}</h3>
        <span class="text-muted" style="font-size: 0.85rem;">⏱️ ${movie.duration} นาที | เรตติ้ง ${movie.rating} | ${movie.genre.join(', ')}</span>
      </div>
    </div>
  `;

  // Populate cinemas
  cinemaSelect.innerHTML = bookingEngine.cinemas.map(c => `
    <option value="${c.id}">${c.name} (${c.location})</option>
  `).join('');
  cinemaSelect.value = bookingEngine.selectedCinemaId;

  // Populate Dates
  const dates = getAvailableDates();
  bookingEngine.selectedDate = dates[0].dateStr;
  dateChipsContainer.innerHTML = dates.map((d, idx) => `
    <div class="date-pill ${idx === 0 ? 'active' : ''}" data-date="${d.dateStr}">
      <span class="date-pill-day">${d.dayName}</span>
      <span class="date-pill-num">${d.dateNumber}</span>
      <span class="date-pill-day">${d.monthName}</span>
    </div>
  `).join('');

  dateChipsContainer.querySelectorAll('.date-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      dateChipsContainer.querySelectorAll('.date-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      bookingEngine.selectedDate = pill.dataset.date;
      renderShowtimeSlots();
    });
  });

  cinemaSelect.onchange = () => {
    bookingEngine.selectedCinemaId = cinemaSelect.value;
    renderShowtimeSlots();
  };

  renderShowtimeSlots();
  bookingModalOverlay.style.display = 'flex';
}

// Render Showtime Slots
function renderShowtimeSlots() {
  const matchingShowtimes = bookingEngine.showtimes.filter(
    st => st.movieId === bookingEngine.selectedMovie.id &&
          st.cinemaId === bookingEngine.selectedCinemaId &&
          st.date === bookingEngine.selectedDate
  );

  if (matchingShowtimes.length === 0) {
    showtimesSlotsContainer.innerHTML = `
      <div class="text-muted" style="padding: 1rem 0;">ไม่มีรอบฉายสำหรับวันที่และสาขานี้</div>
    `;
    bookingEngine.selectedShowtime = null;
    renderSeatMap(seatMapContainer);
    return;
  }

  showtimesSlotsContainer.innerHTML = matchingShowtimes.map((st, idx) => `
    <button class="time-slot-btn ${idx === 0 ? 'active' : ''}" data-showtime-id="${st.id}">
      <span class="slot-time">${st.time} น.</span>
      <span class="slot-meta">${st.hall} • ${st.audio}</span>
    </button>
  `).join('');

  showtimesSlotsContainer.querySelectorAll('.time-slot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showtimesSlotsContainer.querySelectorAll('.time-slot-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      bookingEngine.selectShowtime(btn.dataset.showtimeId);
      renderSeatMap(seatMapContainer);
    });
  });

  // Default select first slot
  bookingEngine.selectShowtime(matchingShowtimes[0].id);
  renderSeatMap(seatMapContainer);
}

// Update Sticky Checkout Bar
function updateBookingCheckoutBar() {
  const summary = bookingEngine.getPricingSummary();
  if (summary.seatCount > 0) {
    selectedSeatsText.textContent = `ที่นั่งที่เลือก: ${summary.seatList} (${summary.seatCount} ที่นั่ง)`;
    totalAmountText.textContent = `฿${summary.total.toLocaleString()}`;
    proceedCheckoutBtn.disabled = false;

    // Start 10-Minute Hold Timer if not active yet
    if (!bookingEngine.holdToken) {
      bookingEngine.startSeatHold();
    }
  } else {
    selectedSeatsText.textContent = 'ยังไม่ได้เลือกที่นั่ง';
    totalAmountText.textContent = '฿0';
    proceedCheckoutBtn.disabled = true;
    bookingEngine.cancelHold();
  }
}

// Open Checkout Modal
async function openCheckoutModal() {
  const summary = bookingEngine.getPricingSummary();
  const movie = bookingEngine.selectedMovie;
  const showtime = bookingEngine.selectedShowtime;

  // Render Order Summary
  document.getElementById('checkout-order-summary').innerHTML = `
    <div style="background: rgba(255,255,255,0.03); padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border-glass);">
      <h4 style="color: var(--gold-primary); margin-bottom: 0.25rem;">${movie.title}</h4>
      <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${showtime.cinemaName} • ${showtime.hall}</p>
      
      <div style="font-size: 0.9rem; margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
        <span>รอบฉาย:</span>
        <strong>${showtime.date} เวลา ${showtime.time} น.</strong>
      </div>
      <div style="font-size: 0.9rem; margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
        <span>ที่นั่ง:</span>
        <strong style="color: var(--cyan-accent);">${summary.seatList} (${summary.seatCount} ที่นั่ง)</strong>
      </div>
      <hr style="border: none; border-top: 1px solid var(--border-glass); margin: 0.75rem 0;">
      <div style="font-size: 0.9rem; margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
        <span>ราคาบัตร (ก่อน VAT):</span>
        <span>฿${summary.subtotal.toLocaleString()}</span>
      </div>
      <div style="font-size: 0.9rem; margin-bottom: 0.4rem; display: flex; justify-content: space-between;">
        <span>ภาษีมูลค่าเพิ่ม (VAT 7%):</span>
        <span>฿${summary.vat.toLocaleString()}</span>
      </div>
      <div style="font-size: 1.25rem; font-weight: 800; margin-top: 0.5rem; display: flex; justify-content: space-between; color: var(--gold-primary);">
        <span>ยอดชำระสุทธิ:</span>
        <span>฿${summary.total.toLocaleString()}</span>
      </div>
    </div>
  `;

  // Generate PromptPay QR Code
  const qrData = `PROMPTPAY::010555891234::AMOUNT=${summary.total}::REF=${Date.now()}`;
  const qrImgUrl = await generateQRCodeUrl(qrData, { width: 220, darkColor: '#003764' });
  document.getElementById('promptpay-qr-image').src = qrImgUrl;

  checkoutModalOverlay.style.display = 'flex';
}

// Complete Order & Trigger Confetti
function handleConfirmPayment(paymentMethod) {
  try {
    const order = bookingEngine.completeBooking({
      paymentMethod,
      customerName: 'Khun Moviegoer',
      customerEmail: 'moviegoer@cinepass.com',
      customerPhone: '089-999-8888'
    });

    checkoutModalOverlay.style.display = 'none';
    bookingModalOverlay.style.display = 'none';

    // Celebration Confetti
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 }
    });

    // Render E-Ticket Pass
    renderTicketPass(order, ticketModalContainer);
  } catch (err) {
    alert("เกิดข้อผิดพลาดในการยืนยันคำสั่งซื้อ: " + err.message);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigation / Brand Home
  brandHomeBtn.addEventListener('click', () => {
    adminPortalView.style.display = 'none';
    customerPortalView.style.display = 'block';
  });

  document.getElementById('nav-movies-btn').addEventListener('click', () => {
    adminPortalView.style.display = 'none';
    customerPortalView.style.display = 'block';
    window.scrollTo({ top: heroBannerContainer.offsetTop - 80, behavior: 'smooth' });
  });

  // Toggle Admin Portal
  toggleAdminBtn.addEventListener('click', () => {
    customerPortalView.style.display = 'none';
    adminPortalView.style.display = 'block';
    renderAdminPortal(adminPortalView);
  });

  // My Tickets navigation
  navMyTicketsBtn.addEventListener('click', () => {
    if (bookingEngine.orders.length === 0) {
      alert("คุณยังไม่มีประวัติการจองตั๋วในระบบ");
      return;
    }
    const latestOrder = bookingEngine.orders[0];
    renderTicketPass(latestOrder, ticketModalContainer);
  });

  // Genre Filters
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeGenreFilter = chip.dataset.genre;
      renderMovieCatalog();
    });
  });

  // Close Modals
  closeBookingModalBtn.addEventListener('click', () => {
    bookingEngine.cancelHold();
    bookingModalOverlay.style.display = 'none';
  });

  cancelSelectionBtn.addEventListener('click', () => {
    bookingEngine.cancelHold();
    bookingModalOverlay.style.display = 'none';
  });

  closeCheckoutModalBtn.addEventListener('click', () => {
    checkoutModalOverlay.style.display = 'none';
  });

  // Proceed Checkout Button
  proceedCheckoutBtn.addEventListener('click', openCheckoutModal);

  // Payment Tabs
  document.querySelectorAll('.payment-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePaymentMethod = btn.dataset.pay;
      if (activePaymentMethod === 'promptpay') {
        document.getElementById('pay-view-promptpay').style.display = 'flex';
        document.getElementById('pay-view-card').style.display = 'none';
      } else {
        document.getElementById('pay-view-promptpay').style.display = 'none';
        document.getElementById('pay-view-card').style.display = 'flex';
      }
    });
  });

  // Simulate QR Payment
  document.getElementById('simulate-qr-paid-btn').addEventListener('click', () => {
    handleConfirmPayment('PromptPay QR');
  });

  // Card Payment Submit
  document.getElementById('pay-view-card').addEventListener('submit', (e) => {
    e.preventDefault();
    handleConfirmPayment('Credit Card');
  });
}

// Start App when DOM is loaded
window.addEventListener('DOMContentLoaded', initApp);
