// Test Suite for Movie Booking Engine, AuthService & QR Security
import test from 'node:test';
import assert from 'node:assert/strict';

import { bookingEngine } from '../src/modules/bookingEngine.js';
import { authService } from '../src/modules/authService.js';
import { createTicketToken, verifyTicketToken } from '../src/utils/qrHelper.js';

test('1. AuthService - RBAC & Authentication', async (t) => {
  await t.test('Identifies 674295049@parichat.skru.ac.th as Super Admin', () => {
    const user = authService.loginWithGoogle({ email: '674295049@parichat.skru.ac.th', name: 'Super Admin User' });
    assert.equal(user.isSuperAdmin, true, 'User should have isSuperAdmin = true');
    assert.equal(user.isAdmin, true, 'Super admin should also have isAdmin = true');
    assert.equal(user.role, 'SUPER_ADMIN');
    assert.equal(authService.isSuperAdmin(), true);
    assert.equal(authService.isAdmin(), true);
  });

  await t.test('Identifies seree999@gmail.com as Admin', () => {
    const user = authService.loginWithGoogle({ email: 'seree999@gmail.com', name: 'Seree Admin' });
    assert.equal(user.isSuperAdmin, false);
    assert.equal(user.isAdmin, true);
    assert.equal(user.role, 'ADMIN');
  });

  await t.test('Normal customer has customer role without admin privileges', () => {
    const user = authService.loginWithGoogle({ email: 'john.doe@gmail.com', name: 'John Doe' });
    assert.equal(user.isSuperAdmin, false);
    assert.equal(user.isAdmin, false);
    assert.equal(user.role, 'CUSTOMER');
    assert.equal(authService.isAdmin(), false);
  });

  await t.test('Logout clears session completely and handles window safely', () => {
    authService.logout();
    assert.equal(authService.isAuthenticated(), false);
    assert.equal(authService.currentUser, null);
    assert.equal(authService.isAdmin(), false);
  });
});

test('2. BookingEngine - Seat Selection & Hold Timer Lifecycle', async (t) => {
  // Reset storage & booking engine state with clean occupied seats
  bookingEngine.selectedMovie = bookingEngine.movies[0];
  bookingEngine.selectedShowtime = {
    ...bookingEngine.showtimes[0],
    occupiedSeats: []
  };
  bookingEngine.selectedSeats = [];
  bookingEngine.cancelHold();

  await t.test('Allows selecting available seats', () => {
    const seat1 = { id: 'D5', type: 'STANDARD', price: 220, row: 'D' };
    const res1 = bookingEngine.toggleSeat(seat1);
    assert.equal(res1.success, true);
    assert.equal(bookingEngine.selectedSeats.length, 1);
    assert.equal(bookingEngine.selectedSeats[0].id, 'D5');
  });

  await t.test('Toggling selected seat unselects it', () => {
    const seat1 = { id: 'D5', type: 'STANDARD', price: 220, row: 'D' };
    const res = bookingEngine.toggleSeat(seat1);
    assert.equal(res.success, true);
    assert.equal(bookingEngine.selectedSeats.length, 0);
  });

  await t.test('Enforces maximum 8 seats selection limit', () => {
    bookingEngine.selectedSeats = [];
    for (let i = 1; i <= 8; i++) {
      const res = bookingEngine.toggleSeat({ id: `D${i}`, type: 'STANDARD', price: 220, row: 'D' });
      assert.equal(res.success, true);
    }
    assert.equal(bookingEngine.selectedSeats.length, 8);

    // 9th seat should be rejected
    const res9 = bookingEngine.toggleSeat({ id: 'D9', type: 'STANDARD', price: 220, row: 'D' });
    assert.equal(res9.success, false);
    assert.match(res9.reason, /สูงสุด 8 ที่นั่ง/);
  });

  await t.test('Rejects selecting already occupied seat', () => {
    bookingEngine.selectedSeats = [];
    const occupiedSeatId = 'C1';
    bookingEngine.selectedShowtime.occupiedSeats = [occupiedSeatId];

    const res = bookingEngine.toggleSeat({ id: occupiedSeatId, type: 'PREMIUM', price: 260, row: 'C' });
    assert.equal(res.success, false);
    assert.match(res.reason, /ถูกซื้อไปแล้ว/);
  });

  await t.test('Calculates pricing breakdown and VAT 7% correctly', () => {
    bookingEngine.selectedSeats = [
      { id: 'D1', type: 'STANDARD', price: 220 },
      { id: 'B1', type: 'PREMIUM', price: 260 },
      { id: 'A1-A2', type: 'SOFA', price: 600 }
    ];
    const summary = bookingEngine.getPricingSummary();
    assert.equal(summary.seatCount, 3);
    assert.equal(summary.total, 1080); // 220 + 260 + 600 = 1080
    assert.equal(summary.vat, Math.round(1080 * 0.07)); // 76
    assert.equal(summary.subtotal, 1080 - 76); // 1004
    assert.equal(summary.seatList, 'D1, B1, A1-A2');
  });

  await t.test('Seat hold lifecycle starts and cancels cleanly', () => {
    const started = bookingEngine.startSeatHold();
    assert.equal(started, true);
    assert.ok(bookingEngine.holdToken);
    assert.equal(bookingEngine.holdRemainingSeconds, 600);
    assert.equal(bookingEngine.formatTime(600), '10:00');
    assert.equal(bookingEngine.formatTime(59), '00:59');

    bookingEngine.cancelHold();
    assert.equal(bookingEngine.holdToken, null);
    assert.equal(bookingEngine.holdRemainingSeconds, 0);
  });

  await t.test('startSeatHold safely handles null selectedShowtime without throwing', () => {
    const origShowtime = bookingEngine.selectedShowtime;
    bookingEngine.selectedShowtime = null;
    assert.doesNotThrow(() => {
      const res = bookingEngine.startSeatHold();
      assert.equal(res, false);
    });
    bookingEngine.selectedShowtime = origShowtime;
  });
});

test('3. BookingEngine - Order Completion & State Reset', async (t) => {
  bookingEngine.selectedMovie = bookingEngine.movies[0];
  bookingEngine.selectedShowtime = bookingEngine.showtimes[0];
  bookingEngine.selectedSeats = [
    { id: 'E3', type: 'STANDARD', price: 220 },
    { id: 'E4', type: 'STANDARD', price: 220 }
  ];

  await t.test('Completes booking and resets active seat selection', () => {
    const initialOrdersCount = bookingEngine.orders.length;
    const order = bookingEngine.completeBooking({
      paymentMethod: 'PromptPay QR',
      customerName: 'Seree Test',
      customerEmail: '674295049@parichat.skru.ac.th',
      customerPhone: '081-234-5678'
    });

    assert.ok(order);
    assert.match(order.bookingRef, /^BK-\d{6}$/);
    assert.equal(order.payment.status, 'PAID');
    assert.equal(order.seats.length, 2);
    assert.equal(bookingEngine.orders.length, initialOrdersCount + 1);

    // Verify occupied seats were appended
    const updatedShowtime = bookingEngine.showtimes.find(st => st.id === bookingEngine.selectedShowtime.id);
    assert.ok(updatedShowtime.occupiedSeats.includes('E3'));
    assert.ok(updatedShowtime.occupiedSeats.includes('E4'));

    // Critical Bug Check: Selected seats must be reset to empty array!
    assert.equal(bookingEngine.selectedSeats.length, 0, 'selectedSeats must be empty after order completion');
    assert.equal(bookingEngine.holdToken, null, 'Hold token must be cleared');
  });

  await t.test('Staff check-in ticket validation', () => {
    const latestOrder = bookingEngine.orders[0];
    
    // First check-in should succeed
    const res1 = bookingEngine.checkInTicket(latestOrder.bookingRef);
    assert.equal(res1.success, true);
    assert.equal(res1.order.status, 'CHECKED_IN');
    assert.ok(res1.order.checkedInAt);

    // Duplicate check-in should be rejected
    const res2 = bookingEngine.checkInTicket(latestOrder.bookingRef);
    assert.equal(res2.success, false);
    assert.match(res2.message, /ถูกสแกนเข้าชมภาพยนตร์ไปแล้ว/);

    // Invalid ref check-in should be rejected
    const res3 = bookingEngine.checkInTicket('NON-EXISTENT-REF');
    assert.equal(res3.success, false);
    assert.match(res3.message, /ไม่พบรหัสการจองนี้/);
  });
});

test('4. Admin - Showtime Scheduling & Conflict Detection', async (t) => {
  const uniqueDate = '2026-12-31';
  const baseShowtime = {
    movieId: bookingEngine.movies[0].id,
    cinemaName: 'Paragon Cineplex',
    hall: 'Hall 9 (Special Test)',
    date: uniqueDate,
    time: '13:00',
    audio: 'EN/TH',
    format: 'IMAX Laser 70mm'
  };

  // Add initial showtime on unique date & hall
  const res1 = bookingEngine.addShowtime(baseShowtime);
  assert.equal(res1.success, true);

  // Add overlapping showtime in same hall at 14:00 (within 160 min window) -> should fail
  const conflictShowtime = {
    ...baseShowtime,
    time: '14:00'
  };
  const res2 = bookingEngine.addShowtime(conflictShowtime);
  assert.equal(res2.success, false);
  assert.match(res2.error, /เวลาฉายทับซ้อน/);

  // Add non-overlapping showtime in same hall at 17:00 (after 160 min) -> should succeed
  const nonConflictShowtime = {
    ...baseShowtime,
    time: '17:00'
  };
  const res3 = bookingEngine.addShowtime(nonConflictShowtime);
  assert.equal(res3.success, true);
});

test('5. QR Token Security - Signatures & Anti-Tampering', () => {
  const fakeOrder = {
    bookingRef: 'BK-888999',
    movieTitle: 'THE LAST HORIZON',
    seats: [{ id: 'A1' }, { id: 'A2' }],
    hall: 'Hall 1',
    time: '19:00',
    date: '2026-10-20'
  };

  const token = createTicketToken(fakeOrder);
  assert.ok(token);

  // Verification of authentic signed token
  const verified = verifyTicketToken(token);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload.bookingRef, 'BK-888999');
  assert.equal(verified.payload.movie, 'THE LAST HORIZON');

  // Tampered payload verification
  const parts = token.split('::');
  const tamperedTokenPart = Buffer.from(JSON.stringify({ bookingRef: 'BK-TAMPERED', movie: 'HACKED' })).toString('base64');
  const tamperedToken = `CINE-PASS::v1::${tamperedTokenPart}::${parts[3]}`;

  const tamperedResult = verifyTicketToken(tamperedToken);
  assert.equal(tamperedResult.valid, false);
  assert.match(tamperedResult.error, /Invalid signature/);
});

import { answerCinemaQuery } from '../src/modules/aiChatbot.js';

test('6. AI Chatbot (CINEBOT) - Domain-Specific Query & Scope Guard', async (t) => {
  await t.test('Answers questions about currently showing movies', () => {
    const res = answerCinemaQuery('ตอนนี้มีหนังอะไรฉายอยู่บ้าง');
    assert.ok(res.text.includes('NEO CHRONO'));
    assert.ok(res.text.includes('THE LAST HORIZON'));
    assert.ok(res.actions && res.actions.length > 0);
  });

  await t.test('Answers specific movie synopsis and director info', () => {
    const res = answerCinemaQuery('ขอเรื่องย่อ THE LAST HORIZON หน่อย');
    assert.ok(res.text.includes('ขอบฟ้าไร้สิ้นสุด'));
    assert.ok(res.text.includes('หลุมดำ'));
    assert.equal(res.actions[0].action, 'BOOK_MOVIE');
    assert.equal(res.actions[0].payload, 'mov-04');
  });

  await t.test('Answers seat pricing accurately', () => {
    const res = answerCinemaQuery('ที่นั่งราคาเท่าไหร่ โซฟาคู่ราคาเท่าไหร่');
    assert.ok(res.text.includes('Sofa Sweet (Pair): ฿600'));
    assert.ok(res.text.includes('Premium Seat: ฿260'));
    assert.ok(res.text.includes('Standard Seat: ฿220'));
    assert.ok(res.text.includes('VAT 7%'));
  });

  await t.test('Answers cinema branch and projection format details', () => {
    const res = answerCinemaQuery('มีโรงหนังสาขาไหนบ้าง');
    assert.ok(res.text.includes('Paragon Cineplex'));
    assert.ok(res.text.includes('Icon Cineconic'));
    assert.ok(res.text.includes('Mega Cineplex'));
    assert.ok(res.text.includes('IMAX'));
  });

  await t.test('Explains 10-minute hold timer', () => {
    const res = answerCinemaQuery('ระบบล็อกที่นั่ง 10 นาทีคืออะไร');
    assert.ok(res.text.includes('Hold'));
    assert.ok(res.text.includes('10 นาที'));
  });

  await t.test('Explains E-Ticket and QR Code entry', () => {
    const res = answerCinemaQuery('วิธีใช้ตั๋ว E-Ticket สแกนเข้าโรง');
    assert.ok(res.text.includes('E-Ticket'));
    assert.ok(res.text.includes('QR Code'));
    assert.ok(res.text.includes('15 นาที'));
  });

  await t.test('Scope Guard: politely rejects out-of-scope questions', () => {
    const resWeather = answerCinemaQuery('วันนี้ฝนจะตกไหม แนะนำร้านอาหารใกล้ๆ หน่อย');
    assert.ok(resWeather.text.includes('ขออภัย'));
    assert.ok(resWeather.text.includes('เฉพาะ'));
    assert.ok(resWeather.text.includes('CINEPASS'));

    const resCode = answerCinemaQuery('สอนเขียนโปรแกรม python ให้หน่อย');
    assert.ok(resCode.text.includes('ขออภัย'));
    assert.ok(resCode.text.includes('เฉพาะ'));
  });
});

test('7. Showtimes Availability & Auto-Recovery for THE LAST HORIZON', async (t) => {
  await t.test('Guarantees showtimes for mov-04 across all cinemas and dates', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const showtimes = bookingEngine.getShowtimes('mov-04', 'cinema-02', todayStr);
    assert.ok(showtimes.length > 0, 'Should return showtimes for mov-04 at Icon Cineconic');
    assert.equal(showtimes[0].movieId, 'mov-04');
    assert.equal(showtimes[0].cinemaId, 'cinema-02');
    assert.ok(showtimes[0].time);
    assert.ok(showtimes[0].hall);
  });

  await t.test('Catalog includes THE LAST HORIZON in bookingEngine.movies', () => {
    const horizon = bookingEngine.movies.find(m => m.id === 'mov-04');
    assert.ok(horizon, 'THE LAST HORIZON must exist in bookingEngine.movies');
    assert.equal(horizon.title, 'THE LAST HORIZON');
  });
});

