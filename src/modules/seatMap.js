// Interactive Visual Seat Map Component
import { SEAT_PRICING } from '../data/mockData.js';
import { bookingEngine } from './bookingEngine.js';

export function renderSeatMap(containerElement) {
  const currentShowtime = bookingEngine.selectedShowtime;
  if (!currentShowtime) {
    containerElement.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎬</div>
        <h3>กรุณาเลือกรอบฉายภาพยนตร์</h3>
        <p>เลือกสาขา วันที่ และเวลาเพื่อดูผังที่นั่งว่าง</p>
      </div>
    `;
    return;
  }

  const occupiedSeats = currentShowtime.occupiedSeats || [];
  const selectedSeats = bookingEngine.selectedSeats;

  // Build seat layout definition
  const rows = [
    { rowLetter: 'A', type: 'SOFA', seats: ['A1-A2', 'A3-A4', 'A5-A6', 'A7-A8'], isPair: true },
    { rowLetter: 'B', type: 'PREMIUM', seats: ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'] },
    { rowLetter: 'C', type: 'PREMIUM', seats: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'] },
    { rowLetter: 'D', type: 'STANDARD', seats: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'] },
    { rowLetter: 'E', type: 'STANDARD', seats: ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10'] },
    { rowLetter: 'F', type: 'STANDARD', seats: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'] },
    { rowLetter: 'G', type: 'STANDARD', seats: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10'] }
  ];

  let html = `
    <div class="seatmap-wrapper">
      <div class="screen-container">
        <div class="curved-screen"></div>
        <div class="screen-glow"></div>
        <div class="screen-label">SCREEN / จอภาพยนตร์</div>
      </div>

      <div class="seat-grid">
  `;

  rows.forEach(row => {
    html += `
      <div class="seat-row ${row.isPair ? 'sofa-row' : ''}">
        <span class="row-label">${row.rowLetter}</span>
        <div class="row-seats">
    `;

    row.seats.forEach((seatId, idx) => {
      // Add aisle gap
      const isAisle = (!row.isPair && (idx === 1 || idx === 7));
      const isOccupied = occupiedSeats.includes(seatId);
      const isSelected = selectedSeats.some(s => s.id === seatId);
      const seatInfo = SEAT_PRICING[row.type];

      const classes = [
        'seat-btn',
        `seat-${row.type.toLowerCase()}`,
        isOccupied ? 'occupied' : 'available',
        isSelected ? 'selected' : '',
        row.isPair ? 'sofa-pair' : ''
      ].filter(Boolean).join(' ');

      html += `
        <button 
          type="button" 
          class="${classes}" 
          data-seat-id="${seatId}"
          data-type="${row.type}"
          data-price="${seatInfo.price}"
          data-row="${row.rowLetter}"
          title="${seatId} - ${seatInfo.name} (฿${seatInfo.price})"
          ${isOccupied ? 'disabled' : ''}
        >
          <span class="seat-icon">
            ${row.isPair ? '🛋️' : '💺'}
          </span>
          <span class="seat-tag">${seatId}</span>
        </button>
      `;

      if (isAisle) {
        html += `<div class="aisle-gap"></div>`;
      }
    });

    html += `
        </div>
        <span class="row-label">${row.rowLetter}</span>
      </div>
    `;
  });

  html += `
      </div>

      <!-- Seat Map Legend -->
      <div class="seat-legend">
        <div class="legend-item">
          <span class="legend-box available-box"></span>
          <span>ว่าง</span>
        </div>
        <div class="legend-item">
          <span class="legend-box selected-box"></span>
          <span>เลือกอยู่</span>
        </div>
        <div class="legend-item">
          <span class="legend-box occupied-box"></span>
          <span>ไม่ว่าง / จองแล้ว</span>
        </div>
        <div class="legend-divider"></div>
        <div class="legend-item">
          <span class="legend-indicator sofa-ind">🛋️</span>
          <span>Sofa Sweet (฿600/คู่)</span>
        </div>
        <div class="legend-item">
          <span class="legend-indicator premium-ind">💺</span>
          <span>Premium (฿260)</span>
        </div>
        <div class="legend-item">
          <span class="legend-indicator standard-ind">💺</span>
          <span>Standard (฿220)</span>
        </div>
      </div>
    </div>
  `;

  containerElement.innerHTML = html;

  // Add click listeners to seats
  containerElement.querySelectorAll('.seat-btn:not(.occupied)').forEach(btn => {
    btn.addEventListener('click', () => {
      const seat = {
        id: btn.dataset.seatId,
        type: btn.dataset.type,
        price: Number(btn.dataset.price),
        row: btn.dataset.row
      };
      const res = bookingEngine.toggleSeat(seat);
      if (!res.success) {
        alert(res.reason);
      }
    });
  });
}
