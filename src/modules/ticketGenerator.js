// E-Ticket Generator & Digital Cinema Pass Component
import { generateQRCodeUrl, createTicketToken, verifyTicketToken } from '../utils/qrHelper.js';
import { bookingEngine } from './bookingEngine.js';

/**
 * Render single detailed E-Ticket Boarding Pass
 */
export async function renderTicketPass(order, containerElement, options = {}) {
  const token = createTicketToken(order);
  const qrDataUrl = await generateQRCodeUrl(token, { width: 220, darkColor: '#0f172a' });

  const showBackButton = options.fromList || options.totalCount > 1;

  const html = `
    <div class="ticket-modal-overlay">
      <div class="ticket-card-container animate-slide-up">
        <div class="ticket-header-actions">
          <span class="ticket-badge">✨ สำเร็จ! การจองของคุณยืนยันแล้ว</span>
          <button class="btn-icon close-ticket-btn" title="ปิดหน้าต่าง">✕</button>
        </div>

        <div class="cinema-pass-card" id="printable-ticket">
          <!-- Left Main Body -->
          <div class="pass-main">
            <div class="pass-brand">
              <span class="brand-logo">🎬 CINEPASS DIGITAL</span>
              <span class="booking-ref-tag">${order.bookingRef}</span>
            </div>

            <div class="pass-movie-hero">
              <img src="${order.poster}" alt="${order.movieTitle}" class="pass-poster-thumb">
              <div class="pass-movie-info">
                <span class="format-badge">${order.format || 'DIGITAL 4K'}</span>
                <h2 class="pass-movie-title">${order.movieTitle}</h2>
                <p class="pass-movie-thai">${order.thaiTitle || ''}</p>
                <div class="pass-meta">
                  <span>เสียง/ซับ: <strong>${order.audio || 'EN/TH'}</strong></span>
                </div>
              </div>
            </div>

            <div class="pass-details-grid">
              <div class="pass-field">
                <span class="field-label">โรงภาพยนตร์</span>
                <span class="field-value">${order.cinemaName}</span>
              </div>
              <div class="pass-field">
                <span class="field-label">โรงฉาย</span>
                <span class="field-value text-gold">${order.hall}</span>
              </div>
              <div class="pass-field">
                <span class="field-label">วันที่</span>
                <span class="field-value">${order.date}</span>
              </div>
              <div class="pass-field">
                <span class="field-label">เวลาเริ่มฉาย</span>
                <span class="field-value text-accent">${order.time} น.</span>
              </div>
            </div>

            <div class="pass-seats-banner">
              <span class="field-label">ที่นั่งที่คุณจอง (${order.seats.length} ที่นั่ง):</span>
              <div class="seat-chips-list">
                ${order.seats.map(s => `<span class="seat-chip">${s.id}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Perforated Divider -->
          <div class="pass-perforation">
            <div class="perf-circle-top"></div>
            <div class="perf-line"></div>
            <div class="perf-circle-bottom"></div>
          </div>

          <!-- Right Stub with QR Code -->
          <div class="pass-stub">
            <div class="stub-qr-wrapper">
              <img src="${qrDataUrl}" alt="Ticket QR Code" class="qr-img">
              <span class="qr-label">สแกนเข้าโรงภาพยนตร์</span>
              <span class="qr-sub">HMAC-SHA256 SIGNED</span>
            </div>

            <div class="stub-info">
              <div class="stub-row">
                <span>ราคาตั๋วรวม:</span>
                <strong>฿${order.pricing?.total?.toLocaleString() || 0}</strong>
              </div>
              <div class="stub-row">
                <span>สถานะ:</span>
                <span class="status-pill status-${order.status.toLowerCase()}">${order.status === 'CHECKED_IN' ? 'เข้าชมแล้ว' : 'พร้อมใช้งาน'}</span>
              </div>
              <div class="stub-barcode">|||||||| |||| |||||| ||||| |||||||</div>
            </div>
          </div>
        </div>

        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-glass); border-radius: var(--radius-md); padding: 0.85rem 1.25rem; margin-top: 1rem; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 1.25rem;">ℹ️</span>
          <span>กรุณาแสดงบัตร E-Ticket นี้ผ่านหน้าจอมือถือแก่เจ้าหน้าที่ ณ ประตูทางเข้าโรงภาพยนตร์ก่อนรอบฉาย 15 นาที</span>
        </div>

        <!-- Ticket Action Buttons -->
        <div class="ticket-footer-actions">
          ${showBackButton ? `
            <button class="btn btn-secondary back-to-tickets-btn">
              <span>← ดูตั๋วเรื่องอื่น ๆ ของฉัน</span>
            </button>
          ` : ''}
          <button class="btn btn-secondary print-ticket-btn">
            <span>🖨️ พิมพ์ตั๋ว / บันทึก PDF</span>
          </button>
          <button class="btn btn-primary add-calendar-btn">
            <span>📅 บันทึกลงปฏิทิน (.ics)</span>
          </button>
          <button class="btn btn-ghost close-ticket-bottom-btn">ปิดหน้าต่าง</button>
        </div>
      </div>
    </div>
  `;

  containerElement.innerHTML = html;

  // Event handlers
  const close = () => { containerElement.innerHTML = ''; };
  containerElement.querySelector('.close-ticket-btn')?.addEventListener('click', close);
  containerElement.querySelector('.close-ticket-bottom-btn')?.addEventListener('click', close);

  // Back to tickets list button
  if (showBackButton) {
    containerElement.querySelector('.back-to-tickets-btn')?.addEventListener('click', () => {
      if (options.allOrders && options.allOrders.length > 0) {
        renderMyTicketsList(options.allOrders, containerElement);
      } else {
        renderMyTicketsList(bookingEngine.orders, containerElement);
      }
    });
  }
  
  containerElement.querySelector('.print-ticket-btn')?.addEventListener('click', () => {
    window.print();
  });

  // Download real iCalendar invite (.ics)
  containerElement.querySelector('.add-calendar-btn')?.addEventListener('click', () => {
    downloadICalFile(order);
  });
}

/**
 * Render List of all booked tickets (allows viewing any and all booked movies)
 */
export function renderMyTicketsList(orders, containerElement) {
  if (!orders || orders.length === 0) {
    containerElement.innerHTML = `
      <div class="ticket-modal-overlay">
        <div class="my-tickets-modal-card animate-slide-up" style="max-width: 500px; text-align: center; padding: 2.5rem 1.5rem;">
          <div style="font-size: 3rem; margin-bottom: 0.75rem;">🎟️</div>
          <h3 style="font-size: 1.4rem; color: #fff; margin-bottom: 0.5rem;">ยังไม่มีประวัติการจองตั๋ว</h3>
          <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">
            คุณยังไม่มีรายการจองตั๋วภาพยนตร์ในระบบ สามารถเลือกชมภาพยนตร์ที่กำลังเข้าฉายและสำรองที่นั่งได้ทันที
          </p>
          <button class="btn btn-primary close-ticket-modal-btn" style="margin: 0 auto;">
            <span>🎬 เลือกชมภาพยนตร์</span>
          </button>
        </div>
      </div>
    `;

    containerElement.querySelector('.close-ticket-modal-btn')?.addEventListener('click', () => {
      containerElement.innerHTML = '';
    });
    return;
  }

  const html = `
    <div class="ticket-modal-overlay">
      <div class="my-tickets-modal-card animate-slide-up">
        <div class="my-tickets-header">
          <div>
            <h3 style="font-size: 1.35rem; color: #fff; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
              <span>🎟️</span> ตั๋วภาพยนตร์ของฉัน (My Tickets)
            </h3>
            <span class="text-muted" style="font-size: 0.85rem; margin-top: 0.25rem; display: block;">
              พบรายการจองทั้งหมด ${orders.length} รายการ (สามารถคลิกดูตั๋วและ QR Code ได้ทุกเรื่อง)
            </span>
          </div>
          <button class="btn-icon close-ticket-list-btn" title="ปิดหน้าต่าง">✕</button>
        </div>

        <div class="my-tickets-list">
          ${orders.map((o, idx) => `
            <div class="my-ticket-item-card">
              <img src="${o.poster}" alt="${o.movieTitle}" class="my-ticket-thumb">
              <div class="my-ticket-content">
                <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                  <span class="booking-ref-tag">${o.bookingRef}</span>
                  <span class="status-pill status-${o.status.toLowerCase()}">
                    ${o.status === 'CHECKED_IN' ? 'เข้าชมแล้ว' : 'พร้อมใช้งาน'}
                  </span>
                  <span style="font-size: 0.75rem; color: var(--gold-primary); font-weight: 700;">${o.format || 'DIGITAL 4K'}</span>
                </div>
                <h4 style="font-size: 1.2rem; color: #fff; margin: 0.2rem 0;">${o.movieTitle}</h4>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">${o.thaiTitle || ''}</p>
                
                <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 0.4rem;">
                  <span>🏢 <strong>${o.cinemaName}</strong> (${o.hall})</span>
                  <span>🗓️ <strong>${o.date}</strong> เวลา <strong>${o.time} น.</strong></span>
                  <span>💺 ที่นั่ง: <strong style="color: var(--cyan-accent);">${o.seats.map(s => s.id).join(', ')}</strong></span>
                </div>
              </div>

              <div class="my-ticket-actions">
                <div style="font-size: 1.15rem; font-weight: 800; color: var(--gold-primary); margin-bottom: 0.25rem;">
                  ฿${o.pricing?.total?.toLocaleString() || 0}
                </div>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <button class="btn btn-primary btn-sm view-ticket-btn" data-index="${idx}">
                    <span>📱 ดูบัตร & QR Code</span>
                  </button>
                  <button class="btn btn-secondary btn-sm cal-ticket-btn" data-index="${idx}">
                    <span>📅 ปฏิทิน</span>
                  </button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  containerElement.innerHTML = html;

  const close = () => { containerElement.innerHTML = ''; };
  containerElement.querySelector('.close-ticket-list-btn')?.addEventListener('click', close);

  // View individual ticket pass
  containerElement.querySelectorAll('.view-ticket-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      const selectedOrder = orders[idx];
      if (selectedOrder) {
        renderTicketPass(selectedOrder, containerElement, { fromList: true, allOrders: orders, totalCount: orders.length });
      }
    });
  });

  // Download iCal for selected ticket
  containerElement.querySelectorAll('.cal-ticket-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      const selectedOrder = orders[idx];
      if (selectedOrder) {
        downloadICalFile(selectedOrder);
      }
    });
  });
}

/**
 * Utility to generate and trigger download of .ics calendar file
 */
function downloadICalFile(order) {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CINEPASS//Movie Ticket//TH',
    'BEGIN:VEVENT',
    `SUMMARY:🎬 ชมภาพยนตร์ ${order.movieTitle} (${order.hall})`,
    `DESCRIPTION:ตั๋วชมภาพยนตร์ CINEPASS\\nรหัสการจอง: ${order.bookingRef}\\nที่นั่ง: ${order.seats.map(s => s.id).join(', ')}\\nโรงภาพยนตร์: ${order.cinemaName} (${order.hall})`,
    `LOCATION:${order.cinemaName}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `CINEPASS-${order.bookingRef}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
