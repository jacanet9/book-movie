// Booking Engine & State Manager
import { INITIAL_MOVIES, CINEMAS, SEAT_PRICING, generateInitialShowtimes } from '../data/mockData.js';

class BookingEngine {
  constructor() {
    this.movies = this.loadFromStorage('mb_movies', INITIAL_MOVIES);
    this.cinemas = CINEMAS;
    this.showtimes = this.loadFromStorage('mb_showtimes', null);
    if (!this.showtimes || this.showtimes.length === 0) {
      this.showtimes = generateInitialShowtimes();
      this.saveToStorage('mb_showtimes', this.showtimes);
    }
    this.orders = this.loadFromStorage('mb_orders', []);

    // Current Booking Session
    this.selectedMovie = null;
    this.selectedCinemaId = this.cinemas[0].id;
    this.selectedDate = null;
    this.selectedShowtime = null;
    this.selectedSeats = [];
    
    // Hold Timer State (10 minutes = 600s)
    this.holdTimer = null;
    this.holdRemainingSeconds = 0;
    this.holdToken = null;
    
    // Listeners for UI reactivity
    this.listeners = [];
  }

  loadFromStorage(key, defaultValue) {
    try {
      if (typeof localStorage === 'undefined') return defaultValue;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  saveToStorage(key, value) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn("Storage write error", e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event, payload) {
    this.listeners.forEach(l => l(event, payload));
  }

  selectMovie(movieId) {
    this.selectedMovie = this.movies.find(m => m.id === movieId) || null;
    this.selectedShowtime = null;
    this.selectedSeats = [];
    this.cancelHold();
    this.notify('MOVIE_SELECTED', this.selectedMovie);
  }

  selectShowtime(showtimeId) {
    this.selectedShowtime = this.showtimes.find(st => st.id === showtimeId) || null;
    this.selectedSeats = [];
    this.cancelHold();
    this.notify('SHOWTIME_SELECTED', this.selectedShowtime);
  }

  toggleSeat(seat) {
    // Check if already occupied
    if (this.isSeatOccupied(seat.id)) {
      return { success: false, reason: "ที่นั่งนี้ถูกซื้อไปแล้ว" };
    }

    const index = this.selectedSeats.findIndex(s => s.id === seat.id);
    if (index >= 0) {
      this.selectedSeats.splice(index, 1);
    } else {
      if (this.selectedSeats.length >= 8) {
        return { success: false, reason: "สามารถเลือกที่นั่งได้สูงสุด 8 ที่นั่งต่อครั้ง" };
      }
      this.selectedSeats.push(seat);
    }

    this.notify('SEATS_UPDATED', this.selectedSeats);
    return { success: true };
  }

  isSeatOccupied(seatId) {
    if (!this.selectedShowtime) return false;
    return this.selectedShowtime.occupiedSeats?.includes(seatId);
  }

  // Calculate pricing breakdown
  getPricingSummary() {
    let subtotal = 0;
    this.selectedSeats.forEach(s => {
      subtotal += s.price;
    });
    const vat = Math.round(subtotal * 0.07);
    const total = subtotal; // Price includes VAT in Thailand
    return {
      seatCount: this.selectedSeats.length,
      subtotal: total - vat,
      vat,
      total,
      seatList: this.selectedSeats.map(s => s.id).join(', ')
    };
  }

  // Acquire 10-Minute Seat Hold (Atomic simulation)
  startSeatHold() {
    if (this.selectedSeats.length === 0 || !this.selectedShowtime) return false;

    // Check race condition
    const currentOccupied = this.selectedShowtime.occupiedSeats || [];
    const conflict = this.selectedSeats.some(s => currentOccupied.includes(s.id));
    if (conflict) {
      return false;
    }

    this.holdToken = 'HOLD-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    this.holdRemainingSeconds = 600; // 10 minutes

    if (this.holdTimer) clearInterval(this.holdTimer);

    this.holdTimer = setInterval(() => {
      this.holdRemainingSeconds--;
      this.notify('HOLD_TICK', {
        remainingSeconds: this.holdRemainingSeconds,
        formatted: this.formatTime(this.holdRemainingSeconds)
      });

      if (this.holdRemainingSeconds <= 0) {
        this.cancelHold();
        this.notify('HOLD_EXPIRED', null);
      }
    }, 1000);

    this.notify('HOLD_STARTED', {
      token: this.holdToken,
      remainingSeconds: this.holdRemainingSeconds,
      formatted: this.formatTime(this.holdRemainingSeconds)
    });

    return true;
  }

  cancelHold() {
    if (this.holdTimer) {
      clearInterval(this.holdTimer);
      this.holdTimer = null;
    }
    this.holdToken = null;
    this.holdRemainingSeconds = 0;
    this.notify('HOLD_CANCELLED', null);
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Complete Order & Commit to permanent database storage
  completeBooking({ paymentMethod, customerName, customerEmail, customerPhone }) {
    if (!this.selectedMovie || !this.selectedShowtime || this.selectedSeats.length === 0) {
      throw new Error("Invalid booking state");
    }

    const pricing = this.getPricingSummary();
    const bookingRef = 'BK-' + Math.floor(100000 + Math.random() * 900000);

    const newOrder = {
      id: 'ord-' + Date.now(),
      bookingRef,
      createdAt: new Date().toISOString(),
      movieId: this.selectedMovie.id,
      movieTitle: this.selectedMovie.title,
      thaiTitle: this.selectedMovie.thaiTitle,
      poster: this.selectedMovie.poster,
      cinemaName: this.selectedShowtime.cinemaName,
      hall: this.selectedShowtime.hall,
      format: this.selectedShowtime.format,
      audio: this.selectedShowtime.audio,
      date: this.selectedShowtime.date,
      time: this.selectedShowtime.time,
      seats: [...this.selectedSeats],
      pricing,
      payment: {
        method: paymentMethod,
        amount: pricing.total,
        status: 'PAID',
        paidAt: new Date().toISOString()
      },
      customer: {
        name: customerName || 'ผู้จองตั๋วภาพยนตร์',
        email: customerEmail || 'booking@parichat.skru.ac.th',
        phone: customerPhone || '081-234-5678'
      },
      status: 'CONFIRMED' // CONFIRMED, CHECKED_IN
    };

    // Update showtime occupied seats
    const targetShowtime = this.showtimes.find(st => st.id === this.selectedShowtime.id);
    if (targetShowtime) {
      const seatIds = this.selectedSeats.map(s => s.id);
      targetShowtime.occupiedSeats = [...(targetShowtime.occupiedSeats || []), ...seatIds];
      this.saveToStorage('mb_showtimes', this.showtimes);
    }

    // Save order
    this.orders.unshift(newOrder);
    this.saveToStorage('mb_orders', this.orders);

    // Stop hold timer & clear active seat selection
    this.cancelHold();
    this.selectedSeats = [];

    this.notify('BOOKING_COMPLETED', newOrder);
    return newOrder;
  }

  // Admin: Check-in ticket verification
  checkInTicket(bookingRef) {
    const order = this.orders.find(o => o.bookingRef === bookingRef);
    if (!order) return { success: false, message: "ไม่พบรหัสการจองนี้ในระบบ" };
    if (order.status === 'CHECKED_IN') {
      return { success: false, message: "ตั๋วใบนี้ถูกสแกนเข้าชมภาพยนตร์ไปแล้ว!", order };
    }
    order.status = 'CHECKED_IN';
    order.checkedInAt = new Date().toISOString();
    this.saveToStorage('mb_orders', this.orders);
    this.notify('ORDER_STATUS_CHANGED', order);
    return { success: true, message: "สแกนตรวจตั๋วสำเร็จ! ยินดีต้อนรับเข้าโรงภาพยนตร์", order };
  }

  // Admin: Add new movie
  addMovie(movieData) {
    const newMovie = {
      id: 'mov-' + Date.now(),
      ...movieData,
      status: 'NOW_SHOWING'
    };
    this.movies.unshift(newMovie);
    this.saveToStorage('mb_movies', this.movies);
    this.notify('MOVIES_UPDATED', this.movies);
    return newMovie;
  }

  // Admin: Add new showtime with schedule overlap check
  addShowtime(showtimeData) {
    // Check overlap in the same hall and date
    const sameHallShowtimes = this.showtimes.filter(
      st => st.cinemaName === showtimeData.cinemaName &&
            st.hall === showtimeData.hall &&
            st.date === showtimeData.date
    );

    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const newStart = toMinutes(showtimeData.time);
    const newEnd = newStart + 160; // movie ~130 min + 30 min buffer

    const hasConflict = sameHallShowtimes.some(st => {
      const existStart = toMinutes(st.time);
      const existEnd = existStart + 160;
      return (newStart < existEnd && newEnd > existStart);
    });

    if (hasConflict) {
      return { success: false, error: "เวลาฉายทับซ้อนกับรอบฉายอื่นในโรงภาพยนตร์เดียวกัน!" };
    }

    const newShowtime = {
      id: 'st-' + Date.now(),
      ...showtimeData,
      occupiedSeats: []
    };

    this.showtimes.push(newShowtime);
    this.saveToStorage('mb_showtimes', this.showtimes);
    this.notify('SHOWTIMES_UPDATED', this.showtimes);
    return { success: true, showtime: newShowtime };
  }
}

export const bookingEngine = new BookingEngine();
