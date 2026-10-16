// Admin Management & Analytics Portal Component
import { bookingEngine } from './bookingEngine.js';
import { renderTicketPass } from './ticketGenerator.js';

export function renderAdminPortal(containerElement) {
  const movies = bookingEngine.movies;
  const showtimes = bookingEngine.showtimes;
  const orders = bookingEngine.orders;
  const cinemas = bookingEngine.cinemas;

  // Calculate statistics
  let totalRevenue = 0;
  let totalTicketsSold = 0;
  orders.forEach(o => {
    totalRevenue += o.pricing?.total || 0;
    totalTicketsSold += o.seats?.length || 0;
  });

  const totalSeatsCapacity = showtimes.length * 58; // approx 58 seats per showtime
  const occupancyRate = totalSeatsCapacity > 0 ? ((totalTicketsSold / totalSeatsCapacity) * 100).toFixed(1) : 0;

  const html = `
    <div class="admin-wrapper animate-fade-in">
      <div class="admin-topbar">
        <div>
          <h2 class="admin-title">⚡ Cinema Management System (Admin)</h2>
          <p class="admin-sub">ระบบจัดการรอบฉาย ข้อมูลภาพยนตร์ และสถิติยอดขายตามมาตรฐาน Enterprise</p>
        </div>
        <button class="btn btn-secondary close-admin-btn">
          <span>← กลับสู่หน้าลูกค้า (Customer View)</span>
        </button>
      </div>

      <!-- KPI Dashboard Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon">💰</div>
          <div class="kpi-info">
            <span class="kpi-label">รายได้รวมทั้งหมด</span>
            <h3 class="kpi-value text-gold">฿${totalRevenue.toLocaleString()}</h3>
            <span class="kpi-trend">↑ ยอดจำหน่ายตั๋วออนไลน์</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">🎟️</div>
          <div class="kpi-info">
            <span class="kpi-label">ตั๋วที่จำหน่ายได้</span>
            <h3 class="kpi-value">${totalTicketsSold} <small>ที่นั่ง</small></h3>
            <span class="kpi-trend">จาก ${orders.length} คำสั่งซื้อ</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">🎬</div>
          <div class="kpi-info">
            <span class="kpi-label">รอบฉายทั้งหมด</span>
            <h3 class="kpi-value">${showtimes.length} <small>รอบ</small></h3>
            <span class="kpi-trend">ใน ${cinemas.length} สาขาโรงหนัง</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon">📊</div>
          <div class="kpi-info">
            <span class="kpi-label">อัตราครองที่นั่งเฉลี่ย</span>
            <h3 class="kpi-value text-accent">${occupancyRate}%</h3>
            <span class="kpi-trend">Occupancy Rate</span>
          </div>
        </div>
      </div>

      <!-- Admin Tabs Navigation -->
      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="orders">📋 รายการคำสั่งซื้อ (${orders.length})</button>
        <button class="admin-tab" data-tab="showtimes">🕒 จัดการรอบฉาย (${showtimes.length})</button>
        <button class="admin-tab" data-tab="movies">🎞️ จัดการภาพยนตร์ (${movies.length})</button>
        <button class="admin-tab" data-tab="checkin">📱 สแกนตรวจตั๋วหน้าโรง</button>
      </div>

      <!-- Tab Content: Orders Table -->
      <div class="admin-tab-content tab-orders active">
        <div class="admin-section-header">
          <h3>รายการจองตั๋วภาพยนตร์ล่าสุด</h3>
          <span class="text-muted">ข้อมูล Real-time Synchronized กับฐานข้อมูล</span>
        </div>
        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>ภาพยนตร์</th>
                <th>สาขา / โรง</th>
                <th>รอบฉาย</th>
                <th>ที่นั่ง</th>
                <th>ยอดเงิน</th>
                <th>สถานะ</th>
                <th>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              ${orders.length === 0 ? `<tr><td colspan="8" class="text-center">ยังไม่มีประวัติการจอง</td></tr>` : ''}
              ${orders.map(o => `
                <tr>
                  <td><strong>${o.bookingRef}</strong></td>
                  <td>${o.movieTitle}</td>
                  <td>${o.cinemaName} (${o.hall})</td>
                  <td>${o.date} ${o.time}</td>
                  <td><span class="badge-seat">${o.seats.map(s => s.id).join(', ')}</span></td>
                  <td>฿${o.pricing.total.toLocaleString()}</td>
                  <td>
                    <span class="status-pill status-${o.status.toLowerCase()}">
                      ${o.status === 'CHECKED_IN' ? 'เข้าชมแล้ว' : 'ชำระแล้ว'}
                    </span>
                  </td>
                  <td>
                    <button class="btn-xs view-order-ticket-btn" data-id="${o.id}">ดูตั๋ว</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab Content: Showtimes Management -->
      <div class="admin-tab-content tab-showtimes">
        <div class="admin-section-header">
          <h3>เพิ่มรอบฉายภาพยนตร์ใหม่</h3>
          <span class="text-muted">มีระบบ Schedule Conflict Validator ป้องกันเวลาฉายชนกันอัตโนมัติ</span>
        </div>

        <form id="add-showtime-form" class="admin-form-card">
          <div class="form-row">
            <div class="form-group">
              <label>เลือกภาพยนตร์:</label>
              <select name="movieId" required>
                ${movies.map(m => `<option value="${m.id}">${m.title} (${m.duration} นาที)</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>สาขาโรงภาพยนตร์:</label>
              <select name="cinemaName" required>
                ${cinemas.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label>โรงฉาย (Hall):</label>
              <select name="hall" required>
                <option value="Hall 1 (IMAX Laser)">Hall 1 (IMAX Laser)</option>
                <option value="Hall 2 (Dolby Atmos)">Hall 2 (Dolby Atmos)</option>
                <option value="Hall 3 (Standard)">Hall 3 (Standard)</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>วันที่ฉาย:</label>
              <input type="date" name="date" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label>เวลาเริ่มฉาย:</label>
              <input type="time" name="time" required value="13:00">
            </div>
            <div class="form-group">
              <label>ระบบเสียงและซับ:</label>
              <input type="text" name="audio" value="EN/TH" required>
            </div>
            <div class="form-group">
              <label>ฟอร์แมต:</label>
              <input type="text" name="format" value="IMAX 3D" required>
            </div>
          </div>

          <button type="submit" class="btn btn-primary">
            <span>+ บันทึกรอบฉายใหม่</span>
          </button>
        </form>
      </div>

      <!-- Tab Content: Movies Management -->
      <div class="admin-tab-content tab-movies">
        <div class="admin-section-header">
          <h3>เพิ่มภาพยนตร์เข้าสู่ระบบ</h3>
        </div>

        <form id="add-movie-form" class="admin-form-card">
          <div class="form-row">
            <div class="form-group">
              <label>ชื่อภาพยนตร์ (อังกฤษ):</label>
              <input type="text" name="title" required placeholder="e.g. DUNE: PART THREE">
            </div>
            <div class="form-group">
              <label>ชื่อภาพยนตร์ (ไทย):</label>
              <input type="text" name="thaiTitle" placeholder="e.g. ดูน: ภาค 3">
            </div>
            <div class="form-group">
              <label>ความยาว (นาที):</label>
              <input type="number" name="duration" value="135" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>เรตติ้ง:</label>
              <select name="rating">
                <option value="G">ทั่วไป (G)</option>
                <option value="13+">น 13+</option>
                <option value="15+">น 15+</option>
                <option value="18+">น 18+</option>
              </select>
            </div>
            <div class="form-group">
              <label>URL โปสเตอร์ภาพยนตร์:</label>
              <input type="text" name="poster" value="/posters/cyberpunk.jpg" required>
            </div>
            <div class="form-group">
              <label>แนวภาพยนตร์ (คั่นด้วยจุลภาค):</label>
              <input type="text" name="genre" value="Action, Sci-Fi" required>
            </div>
          </div>

          <div class="form-group">
            <label>เรื่องย่อ:</label>
            <textarea name="synopsis" rows="2" placeholder="ระบุเรื่องย่อโดยย่อ..."></textarea>
          </div>

          <button type="submit" class="btn btn-primary">
            <span>+ บันทึกภาพยนตร์ใหม่</span>
          </button>
        </form>
      </div>

      <!-- Tab Content: Staff Check-in Simulation -->
      <div class="admin-tab-content tab-checkin">
        <div class="admin-section-header">
          <h3>เครื่องสแกนและตรวจสอบตั๋วสำหรับเจ้าหน้าที่หน้าโรง (Staff Gate Check-in)</h3>
          <span class="text-muted">ระบบตรวจสอบ HMAC Signature และป้องกันการนำตั๋วมาเข้าชมซ้ำ</span>
        </div>

        <div class="checkin-box">
          <form id="staff-checkin-form">
            <label>ระบุรหัส Booking Reference หรือสแกน QR Code Token:</label>
            <div class="checkin-input-group">
              <input type="text" id="scan-ref-input" placeholder="e.g. BK-123456" required>
              <button type="submit" class="btn btn-accent">
                <span>🔍 ตรวจสอบและบันทึก Check-in</span>
              </button>
            </div>
          </form>
          <div id="checkin-result-box" class="checkin-result"></div>
        </div>
      </div>
    </div>
  `;

  containerElement.innerHTML = html;

  // Tabs logic
  containerElement.querySelectorAll('.admin-tab').forEach(tabBtn => {
    tabBtn.addEventListener('click', () => {
      containerElement.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
      containerElement.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      tabBtn.classList.add('active');
      const target = containerElement.querySelector(`.tab-${tabBtn.dataset.tab}`);
      if (target) target.classList.add('active');
    });
  });

  // Close Admin logic
  containerElement.querySelector('.close-admin-btn')?.addEventListener('click', () => {
    containerElement.innerHTML = '';
    containerElement.style.display = 'none';
    document.getElementById('customer-portal-view').style.display = 'block';
  });

  // View Order Ticket in Modal from Admin
  containerElement.querySelectorAll('.view-order-ticket-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = orders.find(o => o.id === btn.dataset.id);
      if (order) {
        const ticketModalContainer = document.getElementById('ticket-modal-container');
        if (ticketModalContainer) {
          renderTicketPass(order, ticketModalContainer);
        }
      }
    });
  });

  // Add Showtime Submit
  const showtimeForm = containerElement.querySelector('#add-showtime-form');
  showtimeForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(showtimeForm);
    const selectedMovie = movies.find(m => m.id === fd.get('movieId'));
    const cinema = cinemas.find(c => c.name === fd.get('cinemaName'));

    const result = bookingEngine.addShowtime({
      movieId: fd.get('movieId'),
      cinemaId: cinema ? cinema.id : 'cinema-01',
      cinemaName: fd.get('cinemaName'),
      hall: fd.get('hall'),
      date: fd.get('date'),
      time: fd.get('time'),
      audio: fd.get('audio'),
      format: fd.get('format')
    });

    if (result.success) {
      alert("✅ เพิ่มรอบฉายสำเร็จ!");
      renderAdminPortal(containerElement);
    } else {
      alert("⚠️ " + result.error);
    }
  });

  // Add Movie Submit
  const movieForm = containerElement.querySelector('#add-movie-form');
  movieForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(movieForm);
    bookingEngine.addMovie({
      title: fd.get('title'),
      thaiTitle: fd.get('thaiTitle'),
      duration: Number(fd.get('duration')),
      rating: fd.get('rating'),
      poster: fd.get('poster'),
      backdrop: fd.get('poster'),
      genre: fd.get('genre').split(',').map(s => s.trim()),
      synopsis: fd.get('synopsis'),
      format: ["IMAX 3D", "4K Digital"]
    });
    alert("✅ บันทึกภาพยนตร์ใหม่สำเร็จ!");
    renderAdminPortal(containerElement);
  });

  // Check-in verification submit
  const checkinForm = containerElement.querySelector('#staff-checkin-form');
  checkinForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ref = containerElement.querySelector('#scan-ref-input').value.trim();
    const resultBox = containerElement.querySelector('#checkin-result-box');
    const res = bookingEngine.checkInTicket(ref);

    if (res.success) {
      resultBox.innerHTML = `
        <div class="alert-success-box">
          <h4>✅ ${res.message}</h4>
          <p><strong>ผู้จอง:</strong> ${res.order.customer?.name} | <strong>ที่นั่ง:</strong> ${res.order.seats.map(s => s.id).join(', ')}</p>
          <p><strong>เรื่อง:</strong> ${res.order.movieTitle} | <strong>รอบฉาย:</strong> ${res.order.date} เวลา ${res.order.time} น. (${res.order.hall})</p>
        </div>
      `;
    } else {
      resultBox.innerHTML = `
        <div class="alert-danger-box">
          <h4>❌ ${res.message}</h4>
        </div>
      `;
    }
  });
}
