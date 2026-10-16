// Mock Data and Seed State for Movie Booking System

export const INITIAL_MOVIES = [
  {
    id: "mov-01",
    title: "NEO CHRONO 2099",
    thaiTitle: "นีโอ โครโน 2099: สงครามเวลาข้ามมิติ",
    poster: "/posters/cyberpunk.jpg",
    backdrop: "/posters/cyberpunk.jpg",
    genre: ["Sci-Fi", "Action", "Cyberpunk"],
    duration: 148,
    rating: "15+",
    imdbScore: 8.9,
    format: ["IMAX 3D", "Dolby Atmos", "4K Digital"],
    status: "NOW_SHOWING",
    synopsis: "ในมหานครกรุงเทพยุคอนาคตปี 2099 ที่ขับเคลื่อนด้วยเทคโนโลยีไซเบอร์เนติกส์ เจ้าหน้าที่หน่วยพิเศษต้องหยุดยั้งกลุ่มก่อการร้ายกาลเวลาที่หวังจะรีเซ็ตประวัติศาสตร์ของมนุษยชาติ",
    director: "Elias Threde",
    cast: "Liam Cheng, Anna Voight, Kenji Tanaka",
    releaseDate: "2026-10-12"
  },
  {
    id: "mov-02",
    title: "SHADOW OF THE SHRINE",
    thaiTitle: "เงาอาถรรพ์ ศาลมรณะ",
    poster: "/posters/haunting.jpg",
    backdrop: "/posters/haunting.jpg",
    genre: ["Horror", "Mystery", "Thriller"],
    duration: 115,
    rating: "18+",
    imdbScore: 8.2,
    format: ["Dolby Atmos", "4K Digital"],
    status: "NOW_SHOWING",
    synopsis: "เรื่องราวลี้ลับเหนือธรรมชาติในวัดร้างโบราณริมแม่น้ำเจ้าพระยา เมื่อกลุ่มนักโบราณคดีเผลอปลดปล่อยคำสาปโบราณอายุ 200 ปีที่ต้องการเอาชีวิตทุกคนที่ล่วงล้ำเข้ามา",
    director: "Thanat Sinsawat",
    cast: "Phinya Chaow, Surajit Prasad, Nopadol R.",
    releaseDate: "2026-10-05"
  },
  {
    id: "mov-03",
    title: "STARLIGHT ODYSSEY",
    thaiTitle: "สตาร์ไลท์ โอดิสซี: การเดินทางข้ามดวงดาว",
    poster: "/posters/starlight.jpg",
    backdrop: "/posters/starlight.jpg",
    genre: ["Animation", "Adventure", "Family"],
    duration: 102,
    rating: "G",
    imdbScore: 9.1,
    format: ["Digital 3D", "4K Digital"],
    status: "NOW_SHOWING",
    synopsis: "การผจญภัยสุดมหัศจรรย์ของเด็กหญิงนักบินอวกาศฝึกหัดกับสิ่งมีชีวิตเรืองแสงลึกลับข้ามกาแล็กซีเนบิวลาหลากสี เพื่อค้นหาคริสตัลดวงดาวที่สามารถกอบกู้บ้านเกิดของเธอ",
    director: "Renier Benaney",
    cast: "Voice: Holimian Thnagron, Jarkg Loschom",
    releaseDate: "2026-10-15"
  },
  {
    id: "mov-04",
    title: "THE LAST HORIZON",
    thaiTitle: "ขอบฟ้าไร้สิ้นสุด: ภารกิจกู้วิกฤตจักรวาล",
    poster: "/posters/horizon.jpg",
    backdrop: "/posters/horizon.jpg",
    genre: ["Sci-Fi", "Drama", "Adventure"],
    duration: 165,
    rating: "13+",
    imdbScore: 9.3,
    format: ["IMAX Laser 70mm", "Dolby Atmos"],
    status: "NOW_SHOWING",
    synopsis: "เมื่อทรัพยากรบนโลกกำลังจะหมดสิ้น ทีมสำรวจอวกาศต้องเดินทางผ่านหลุมดำมหึมาเพื่อค้นหาดาวเคราะห์ดวงใหม่ที่มีสภาพแวดล้อมเหมาะสมต่อการดำรงชีวิตของมนุษยชาติ",
    director: "Eliza Vance",
    cast: "Anya Sharma, Caleb Cross, Elias Thorne",
    releaseDate: "2026-10-18"
  }
];

export const CINEMAS = [
  { id: "cinema-01", name: "Paragon Cineplex", location: "Siam Paragon ชั้น 5", halls: ["Hall 1 (IMAX Laser)", "Hall 2 (Dolby Atmos)", "Hall 3 (Standard)"] },
  { id: "cinema-02", name: "Icon Cineconic", location: "ICONSIAM ชั้น 6", halls: ["Hall 1 (VIP Living)", "Hall 2 (4K Laser)"] },
  { id: "cinema-03", name: "Mega Cineplex", location: "Megabangna ชั้น 2", halls: ["Hall 1 (Dolby Atmos)", "Hall 2 (Standard)"] }
];

export const SEAT_PRICING = {
  SOFA: { name: "Sofa Sweet (Pair)", price: 600, color: "#ec4899", desc: "ที่นั่งโซฟาคู่พรีเมียมแถวหลังสุด พร้อมหมอนและผ้าห่ม" },
  PREMIUM: { name: "Premium Seat", price: 260, color: "#f59e0b", desc: "ที่นั่งมุมมองดีเยี่ยม แถว B-C เบาะกว้างปรับเอนได้" },
  STANDARD: { name: "Standard Seat", price: 220, color: "#3b82f6", desc: "ที่นั่งมาตรฐาน แถว D-G สบายตา มองเห็นจอชัดเจน" }
};

// Generates dynamic dates for Today, Tomorrow, +2, +3 days
export function getAvailableDates() {
  const dates = [];
  const daysTh = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
  const monthsTh = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  for (let i = 0; i < 5; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    dates.push({
      dateStr,
      dayName: i === 0 ? "วันนี้" : i === 1 ? "พรุ่งนี้" : daysTh[d.getDay()],
      dateNumber: d.getDate(),
      monthName: monthsTh[d.getMonth()]
    });
  }
  return dates;
}

// Generates default showtimes for each movie and cinema
export function generateInitialShowtimes() {
  const dates = getAvailableDates();
  const showtimes = [];
  let idCounter = 1;

  const times = [
    { time: "11:30", hall: "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
    { time: "14:15", hall: "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
    { time: "17:00", hall: "Hall 1 (IMAX Laser)", audio: "EN/TH", format: "IMAX 3D" },
    { time: "19:45", hall: "Hall 2 (Dolby Atmos)", audio: "TH", format: "Dolby Atmos" },
    { time: "22:15", hall: "Hall 2 (Dolby Atmos)", audio: "EN/TH", format: "Dolby Atmos" }
  ];

  INITIAL_MOVIES.forEach(movie => {
    CINEMAS.forEach(cinema => {
      dates.forEach(d => {
        times.forEach(t => {
          showtimes.push({
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
      });
    });
  });

  return showtimes;
}

// Generate realistic occupied seats for seed
function generateRandomOccupiedSeats() {
  const sampleSeats = ["C4", "C5", "C6", "D5", "D6", "E7", "E8", "F3", "F4", "B5", "B6"];
  const count = Math.floor(Math.random() * 6) + 3;
  return sampleSeats.slice(0, count);
}
