// E-Ticket Generator & Digital Cinema Pass Component
import { generateQRCodeUrl, createTicketToken, verifyTicketToken } from '../utils/qrHelper.js';
import { bookingEngine } from './bookingEngine.js';

export async function renderTicketPass(order, containerElement) {
  const token = createTicketToken(order);
  const qrDataUrl = await generateQRCodeUrl(token, { width: 220, darkColor: '#0f172a' });

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
                <strong>฿${order.pricing.total.toLocaleString()}</strong>
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
          <button class="btn btn-secondary print-ticket-btn">
            <span>🖨️ พิมพ์ตั๋ว / บันทึก PDF</span>
          </button>
          <button class="btn btn-primary add-calendar-btn">
            <span>📅 บันทึกลงปฏิทิน (.ics)</span>
          </button>
          <button class="btn btn-ghost close-ticket-bottom-btn">กลับสู่หน้าหลัก</button>
        </div>
      </div>
    </div>
  `;

  containerElement.innerHTML = html;

  // Event handlers
  const close = () => { containerElement.innerHTML = ''; };
  containerElement.querySelector('.close-ticket-btn')?.addEventListener('click', close);
  containerElement.querySelector('.close-ticket-bottom-btn')?.addEventListener('click', close);
  
  containerElement.querySelector('.print-ticket-btn')?.addEventListener('click', () => {
    window.print();
  });

  // Download real iCalendar invite (.ics)
  containerElement.querySelector('.add-calendar-btn')?.addEventListener('click', () => {
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
  });
}
