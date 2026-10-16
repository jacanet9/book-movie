// Booking Engine & State Manager
import { INITIAL_MOVIES, CINEMAS, SEAT_PRICING, generateInitialShowtimes, getAvailableDates, generateRandomOccupiedSeats } from '../data/mockData.js';

class BookingEngine {
  constructor() {
    // Merge INITIAL_MOVIES with stored movies to ensure new catalog movies always appear
    const storedMovies = this.loadFromStorage('mb_movies', []);
    const movieMap = new Map();
    INITIAL_MOVIES.forEach(m => movieMap.set(m.id, m));
    storedMovies.forEach(m => {
      const existing = movieMap.get(m.id);
      movieMap.set(m.id, existing ? { ...existing, ...m } : m);
    });
    this.movies = Array.from(movieMap.values());
    this.saveToStorage('mb_movies', this.movies);

    this.cinemas = CINEMAS;
    this.showtimes = this.loadFromStorage('mb_showtimes', null);
    if (!this.showtimes || this.showtimes.length === 0) {
      this.showtimes = generateInitialShowtimes();
    }
    // Always ensure showtimes exist for all movies, cinemas and upcoming dates
    this.ensureShowtimes();
    this.saveToStorage('mb_showtimes', this.showtimes);

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

  // Ensure that all movies have showtimes across all cinemas and available dates
  ensureShowtimes() {
    const dates = getAvailableDates();
    if (!this.showtimes) this.showtimes = [];
    const existingKeys = new Set(
      this.showtimes.map(st => `${st.movieId}__${st.cinemaId}__${st.date}`)
    );

    let addedCount = 0;
    let idCounter = Date.now();

    this.movies.forEach(movie => {
      this.cinemas.forEach(cinema => {
        const halls = cinema.halls || ["Hall 1 (IMAX Laser)", "Hall 2 (Dolby Atmos)"];
        const times = [
          { time: "11:30", hall: halls[0] || "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
          { time: "14:15", hall: halls[0] || "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
          { time: "17:00", hall: halls[0] || "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
          { time: "19:45", hall: halls[1] || halls[0], audio: "TH", format: "Dolby Atmos" },
          { time: "22:15", hall: halls[1] || halls[0], audio: "EN/TH", format: "Dolby Atmos" }
        ];

        dates.forEach(d => {
          const key = `${movie.id}__${cinema.id}__${d.dateStr}`;
          if (!existingKeys.has(key)) {
            times.forEach(t => {
              this.showtimes.push({
                id: `st-${idCounter++}`,
                movieId: movie.id,
                cinemaId: cinema.id,
                cinemaName: cinema.name,
                hall: t.hall,
                date: d.dateStr,
                time: t.time,
                audio: t.audio,
                format: t.format,
                occupiedSeats: generateRandomOccupiedSeats()
              });
            });
            existingKeys.add(key);
            addedCount++;
          }
        });
      });
    });

    if (addedCount > 0) {
      this.saveToStorage('mb_showtimes', this.showtimes);
    }
  }

  // Get showtimes with guaranteed fallback so a movie/cinema/date combination is never empty
  getShowtimes(movieId, cinemaId, date) {
    if (!movieId || !cinemaId || !date) return [];
    
    let matches = this.showtimes.filter(
      st => st.movieId === movieId &&
            st.cinemaId === cinemaId &&
            st.date === date
    );

    if (matches.length === 0) {
      const cinema = this.cinemas.find(c => c.id === cinemaId) || this.cinemas[0];
      const halls = cinema.halls || ["Hall 1 (IMAX Laser)", "Hall 2 (Dolby Atmos)"];
      const times = [
        { time: "11:30", hall: halls[0] || "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
        { time: "14:15", hall: halls[0] || "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
        { time: "17:00", hall: halls[0] || "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
        { time: "19:45", hall: halls[1] || halls[0], audio: "TH", format: "Dolby Atmos" },
        { time: "22:15", hall: halls[1] || halls[0], audio: "EN/TH", format: "Dolby Atmos" }
      ];

      const newSlots = times.map((t, idx) => ({
        id: `st-gen-${Date.now()}-${idx}`,
        movieId,
        cinemaId: cinema.id,
        cinemaName: cinema.name,
        hall: t.hall,
        date,
        time: t.time,
        audio: t.audio,
        format: t.format,
        occupiedSeats: generateRandomOccupiedSeats()
      }));

      this.showtimes.push(...newSlots);
      this.saveToStorage('mb_showtimes', this.showtimes);
      matches = newSlots;
    }

    return matches;
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
    this.selectedMovie = this.movies.find(m => m.id === movieId) || INITIAL_MOVIES.find(m => m.id === movieId) || null;
    this.selectedShowtime = null;
    this.selectedSeats = [];
    this.cancelHold();
    this.ensureShowtimes();
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
