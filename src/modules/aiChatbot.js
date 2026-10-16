// AI Cinema Assistant (CINEBOT) - Specialized Domain Chatbot for CINEPASS
import { INITIAL_MOVIES, CINEMAS, SEAT_PRICING } from '../data/mockData.js';
import { bookingEngine } from './bookingEngine.js';

// Predefined Quick Suggestion Prompts
export const QUICK_PROMPTS = [
  "🎬 ตอนนี้มีหนังเรื่องอะไรฉายอยู่บ้าง?",
  "🎟️ บัตรชมภาพยนตร์ราคาเท่าไหร่?",
  "🏢 มีสาขาและระบบฉายอะไรบ้าง?",
  "⏱️ ระบบล็อกที่นั่ง 10 นาทีทำงานอย่างไร?",
  "📱 สแกนเข้าโรงด้วย E-Ticket อย่างไร?"
];

/**
 * Intelligent domain-scoped response generator
 * @param {string} rawQuery - User input message
 * @returns {object} { text: string, actions?: Array<{ label: string, action: string, payload?: any }> }
 */
export function answerCinemaQuery(rawQuery) {
  const query = (rawQuery || '').trim().toLowerCase();
  if (!query) {
    return {
      text: "สวัสดีครับ! ผมคือ **CINEBOT** ผู้ช่วยอัจฉริยะของ CINEPASS ยินดีให้บริการข้อมูลภาพยนตร์ รอบฉาย สาขาโรงหนัง ราคาที่นั่ง และขั้นตอนการจองตั๋วครับ มีอะไรให้ผมช่วยเหลือไหมครับ? 🎬"
    };
  }

  // 1. Specific movie inquiries
  if (query.includes('chrono') || query.includes('นีโอ') || query.includes('2099')) {
    const m = INITIAL_MOVIES.find(x => x.id === 'mov-01');
    return {
      text: `🎬 **${m.title}** (${m.thaiTitle})\n\n` +
            `• **เรื่องย่อ:** ${m.synopsis}\n` +
            `• **แนวภาพยนตร์:** ${m.genre.join(', ')}\n` +
            `• **ความยาว:** ${m.duration} นาที | **เรตติ้ง:** ${m.rating} | **IMDb:** ★ ${m.imdbScore}\n` +
            `• **ระบบฉาย:** ${m.format.join(', ')}\n` +
            `• **ผู้กำกับ/นักแสดง:** ${m.director} (${m.cast})`,
      actions: [{ label: "🎟️ จองตั๋ว NEO CHRONO 2099", action: "BOOK_MOVIE", payload: "mov-01" }]
    };
  }

  if (query.includes('shrine') || query.includes('ศาล') || query.includes('เงาอาถรรพ์') || query.includes('ผี') || query.includes('สยองขวัญ')) {
    const m = INITIAL_MOVIES.find(x => x.id === 'mov-02');
    return {
      text: `👻 **${m.title}** (${m.thaiTitle})\n\n` +
            `• **เรื่องย่อ:** ${m.synopsis}\n` +
            `• **แนวภาพยนตร์:** ${m.genre.join(', ')}\n` +
            `• **ความยาว:** ${m.duration} นาที | **เรตติ้ง:** ${m.rating} | **IMDb:** ★ ${m.imdbScore}\n` +
            `• **ระบบฉาย:** ${m.format.join(', ')}\n` +
            `• **ผู้กำกับ/นักแสดง:** ${m.director} (${m.cast})`,
      actions: [{ label: "🎟️ จองตั๋ว SHADOW OF THE SHRINE", action: "BOOK_MOVIE", payload: "mov-02" }]
    };
  }

  if (query.includes('starlight') || query.includes('สตาร์ไลท์') || query.includes('การ์ตูน') || query.includes('อนิเมะ') || query.includes('animation')) {
    const m = INITIAL_MOVIES.find(x => x.id === 'mov-03');
    return {
      text: `✨ **${m.title}** (${m.thaiTitle})\n\n` +
            `• **เรื่องย่อ:** ${m.synopsis}\n` +
            `• **แนวภาพยนตร์:** ${m.genre.join(', ')} (เหมาะสำหรับครอบครัว)\n` +
            `• **ความยาว:** ${m.duration} นาที | **เรตติ้ง:** ${m.rating} | **IMDb:** ★ ${m.imdbScore}\n` +
            `• **ระบบฉาย:** ${m.format.join(', ')}\n` +
            `• **ผู้กำกับ:** ${m.director}`,
      actions: [{ label: "🎟️ จองตั๋ว STARLIGHT ODYSSEY", action: "BOOK_MOVIE", payload: "mov-03" }]
    };
  }

  if (query.includes('horizon') || query.includes('ขอบฟ้า') || query.includes('หลุมดำ') || query.includes('อวกาศ') || query.includes('imax 70mm')) {
    const m = INITIAL_MOVIES.find(x => x.id === 'mov-04');
    return {
      text: `🚀 **${m.title}** (${m.thaiTitle})\n\n` +
            `• **เรื่องย่อ:** ${m.synopsis}\n` +
            `• **แนวภาพยนตร์:** ${m.genre.join(', ')}\n` +
            `• **ความยาว:** ${m.duration} นาที | **เรตติ้ง:** ${m.rating} | **IMDb:** ★ ${m.imdbScore} (คะแนนสูงสุดในสัปดาห์นี้)\n` +
            `• **ระบบฉาย:** ${m.format.join(', ')}\n` +
            `• **ผู้กำกับ/นักแสดง:** ${m.director} (${m.cast})`,
      actions: [{ label: "🎟️ จองตั๋ว THE LAST HORIZON", action: "BOOK_MOVIE", payload: "mov-04" }]
    };
  }

  // 2. Hold Timer (10 minutes)
  if (query.includes('ล็อก') || query.includes('hold') || query.includes('10 นาที') || query.includes('หมดเวลา') || query.includes('จองซ้ำ') || query.includes('timer')) {
    return {
      text: `⏱️ **ระบบล็อกที่นั่งชั่วคราว 10 นาที (Seat Hold Timer):**\n\n` +
            `• เมื่อท่านคลิกเลือกที่นั่งในผัง ระบบจะทำการ **Hold ล็อกที่นั่งไว้ให้ท่านทันที 10 นาที (600 วินาที)**\n` +
            `• ระหว่างที่เวลานับถอยหลัง ผู้อื่นจะไม่สามารถเลือกหรือแย่งที่นั่งเดียวกันนี้ได้\n` +
            `• หากท่านชำระเงินไม่ทันภายใน 10 นาที ระบบจะปลดล็อกที่นั่งคืนสู่ระบบโดยอัตโนมัติ เพื่อให้โอกาสผู้อื่นได้เลือกชมครับ`
    };
  }

  // 3. E-Ticket & Entry check-in
  if (query.includes('e-ticket') || query.includes('eticket') || query.includes('สแกน') || query.includes('qrcode') || query.includes('qr') && query.includes('ตั๋ว') || query.includes('เข้าโรง') || query.includes('ปฏิทิน') || query.includes('ics') || query.includes('ตรวจตั๋ว')) {
    return {
      text: `🎟️ **การใช้งานบัตรดิจิทัล E-Ticket:**\n\n` +
            `• หลังชำระเงินสำเร็จ ระบบจะออก **E-Ticket Cinema Pass** ให้ทันที\n` +
            `• บนตั๋วจะมี **QR Code ที่ลงลายมือชื่อดิจิทัล (HMAC-SHA256 Signed)** ป้องกันการปลอมแปลง\n` +
            `• ท่านสามารถนำหน้าจอมือถือแสดงต่อเจ้าหน้าที่ ณ ประตูทางเข้าโรงภาพยนตร์ก่อนรอบฉาย 15 นาที เพื่อสแกนเข้าชมได้เลย ไม่ต้องต่อคิวพิมพ์บัตรกระดาษ\n` +
            `• มีปุ่ม **"📅 บันทึกลงปฏิทิน (.ics)"** เพิ่มเวลารอบฉายลง Google/Apple Calendar อัตโนมัติ\n` +
            `• สามารถเรียกดูตั๋วทุกเรื่องที่เคยจองได้ตลอดเวลาที่เมนู **"ตั๋วของฉัน"** ด้านบนครับ`
    };
  }

  // 4. Cinema Branches & Technology
  if (query.includes('สาขา') || query.includes('branch') || query.includes('พารากอน') || query.includes('ไอคอน') || query.includes('เมกา') || query.includes('paragon') || query.includes('iconsiam') || query.includes('mega') || (query.includes('โรง') && (query.includes('ที่ไหน') || query.includes('กี่โรง')))) {
    const branchesStr = CINEMAS.map(c => 
      `🏢 **${c.name}**\n   • ที่ตั้ง: ${c.location}\n   • โรงฉาย: ${c.halls.join(', ')}`
    ).join('\n\n');

    return {
      text: `🏢 **สาขาโรงภาพยนตร์ในเครือ CINEPASS เปิดบริการ 10:00 - 24:00 น.:**\n\n${branchesStr}\n\nทุกสาขารองรับระบบฉายเลเซอร์ 4K และระบบเสียงสามมิติ Dolby Atmos / IMAX Laser ครับ`,
      actions: [{ label: "🏢 ดูรายละเอียดสาขา", action: "VIEW_CINEMAS" }]
    };
  }

  // 5. Pricing & Seat types
  if (query.includes('ราคา') || query.includes('กี่บาท') || query.includes('แพง') || query.includes('ค่าตั๋ว') || query.includes('ที่นั่ง') || query.includes('seat') || query.includes('price') || query.includes('โซฟา') || query.includes('sofa') || query.includes('standard') || query.includes('premium')) {
    return {
      text: `🎟️ **ผังที่นั่งและอัตราค่าบริการ CINEPASS:**\n\n` +
            `1. 🛋️ **Sofa Sweet (Pair): ฿600** ต่อคู่ (ตกคนละ ฿300)\n` +
            `   • แถวหลังสุด A1-A8 เบาะโซฟากว้างพิเศษ ปรับเอนได้ พร้อมหมอนและผ้าห่มพรีเมียม\n\n` +
            `2. 💺 **Premium Seat: ฿260** ต่อที่นั่ง\n` +
            `   • แถว B-C มุมมองกึ่งกลางจอภาพ เบาะหนานุ่มสบายตา\n\n` +
            `3. 💺 **Standard Seat: ฿220** ต่อที่นั่ง\n` +
            `   • แถว D-G ที่นั่งมาตรฐาน มองเห็นจอภาพยนตร์คมชัดระดับ IMAX\n\n` +
            `*(ราคาทั้งหมดรวมภาษีมูลค่าเพิ่ม VAT 7% เรียบร้อยแล้ว และสามารถเลือกได้สูงสุด 8 ที่นั่งต่อครั้งครับ)*`,
      actions: [{ label: "🎟️ เลือกที่นั่งและจองตั๋ว", action: "BOOK_NOW" }]
    };
  }

  // 6. Payment Methods
  if (query.includes('จ่าย') || query.includes('ชำระ') || query.includes('payment') || query.includes('พร้อมเพย์') || query.includes('promptpay') || query.includes('บัตรเครดิต') || query.includes('บัตรเดบิต') || query.includes('โอน')) {
    return {
      text: `💳 **ช่องทางการชำระเงินที่รองรับ:**\n\n` +
            `1. 📱 **PromptPay QR Code:** สแกนชำระเงินผ่าน Mobile Banking ทุกธนาคาร สะดวกรวดเร็ว ยอดตรงตามจริง\n` +
            `2. 💳 **บัตรเครดิต/เดบิต:** รองรับ VISA, Mastercard ทุกสถาบันการเงิน เข้ารหัสปลอดภัยสูงสุด\n\n` +
            `🧾 ยอดชำระจะคำนวณราคาบัตรและภาษีมูลค่าเพิ่ม (VAT 7%) แจกแจงอย่างโปร่งใสก่อนยืนยันครับ`
    };
  }

  // 7. Movies in General / Now Showing catalog
  if (
    query.includes('หนัง') || query.includes('ภาพยนตร์') || query.includes('เรื่อง') || 
    query.includes('ฉาย') || query.includes('movie') || query.includes('film') ||
    query.includes('แนว') || query.includes('หมวด')
  ) {
    const movieListStr = bookingEngine.movies.map((m, idx) => 
      `${idx + 1}. **${m.title}** (${m.thaiTitle || ''})\n   • แนว: ${m.genre.join(', ')} | ⏱️ ${m.duration} นาที | ★ ${m.imdbScore}`
    ).join('\n\n');

    return {
      text: `🎬 **ภาพยนตร์ที่กำลังเข้าฉายใน CINEPASS สัปดาห์นี้:**\n\n${movieListStr}\n\nคุณสามารถกดเลือกจองตั๋วหรือสอบถามเรื่องย่อของแต่ละเรื่องได้เลยครับ!`,
      actions: [
        { label: "🎟️ จอง NEO CHRONO", action: "BOOK_MOVIE", payload: "mov-01" },
        { label: "🎟️ จอง THE LAST HORIZON", action: "BOOK_MOVIE", payload: "mov-04" }
      ]
    };
  }

  // 8. Login & Super Admin
  if (query.includes('login') || query.includes('เข้าสู่ระบบ') || query.includes('ล็อกอิน') || query.includes('สมัคร') || query.includes('admin') || query.includes('แอดมิน') || query.includes('google')) {
    return {
      text: `🔐 **ระบบสมาชิกและการเข้าสู่ระบบ:**\n\n` +
            `• CINEPASS เชื่อมต่อกับระบบ **Google Identity Services (OAuth)** อย่างเป็นทางการ\n` +
            `• ลูกค้าต้องเข้าสู่ระบบด้วยบัญชี Google ก่อนทำรายการจองตั๋ว เพื่อผูกชื่อและอีเมลกับ E-Ticket อัตโนมัติ\n` +
            `• **ผู้ดูแลระบบสูงสุด (Super Admin):** \`674295049@parichat.skru.ac.th\` ได้รับสิทธิ์บริหารจัดการรอบฉาย ภาพยนตร์ และตรวจตั๋ว\n` +
            `• ลูกค้าทั่วไปจะไม่เห็นเมนูผู้จัดการระบบเพื่อความปลอดภัยครับ`,
      actions: [{ label: "🔐 เข้าสู่ระบบ Google", action: "OPEN_LOGIN" }]
    };
  }

  // 9. Contact & Theater Policy
  if (query.includes('ติดต่อ') || query.includes('ยกเลิก') || query.includes('คืนเงิน') || query.includes('นโยบาย') || query.includes('กฎ')) {
    return {
      text: `ℹ️ **ข้อกำหนดและการเข้าชมภาพยนตร์ CINEPASS:**\n\n` +
            `• ประตูโรงภาพยนตร์จะเปิดให้เข้าชมก่อนเวลาเริ่มฉาย 15 นาที\n` +
            `• ไม่อนุญาตให้นำอาหารหรือเครื่องดื่มจากภายนอกโรงภาพยนตร์เข้ามาในโรงฉาย\n` +
            `• ตั๋วภาพยนตร์ที่ออกสำเร็จไม่สามารถยกเลิกเป็นเงินสดได้ แต่สามารถติดต่อเจ้าหน้าที่หน้าสาขาเพื่อขอเลื่อนรอบฉายล่วงหน้าอย่างน้อย 2 ชั่วโมงได้ครับ`
    };
  }

  // 10. Greeting / Identity
  if (query.includes('หวัดดี') || query.includes('สวัสดี') || query.includes('hello') || query.includes('hi') || query.includes('ใคร') || query.includes('ชื่อ')) {
    return {
      text: `สวัสดีครับ! ผมคือ **CINEBOT** 🤖 ผู้ช่วย AI ประจำระบบจองตั๋วภาพยนตร์ **CINEPASS**\n\n` +
            `ผมพร้อมให้คำแนะนำเรื่อง:\n` +
            `• รอบฉายและข้อมูลภาพยนตร์ 4 เรื่องล่าสุด\n` +
            `• แนะนำประเภทที่นั่งและราคา\n` +
            `• สาขาโรงภาพยนตร์และระบบเสียง IMAX / Dolby Atmos\n` +
            `• วิธีการจอง ชำระเงิน และการใช้ E-Ticket สแกนเข้าโรง\n\n` +
            `สอบถามสิ่งที่ต้องการได้เลยครับ! 🍿`
    };
  }

  // 11. Strict Domain Scope Guard (Rejects irrelevant questions politely)
  return {
    text: `ขออภัยครับ 🙏 ผมคือ **CINEBOT** ผู้ช่วย AI ประจำโรงภาพยนตร์ **CINEPASS**\n\n` +
          `ผมได้รับการฝึกฝนมาเพื่อให้ข้อมูลเฉพาะ **ภาพยนตร์, รอบฉาย, สาขาโรงหนัง, ราคาที่นั่ง, การชำระเงิน และการจองตั๋วของเว็บไซต์นี้เท่านั้น** ครับ\n\n` +
          `ท่านสามารถลองสอบถามเรื่องเหล่านี้ได้เลยครับ:\n` +
          `• "ตอนนี้มีหนังเรื่องอะไรฉายอยู่บ้าง?"\n` +
          `• "ตั๋วหนังโซฟาแถวหลังราคาเท่าไหร่?"\n` +
          `• "โรงหนัง Paragon Cineplex มีโรงฉายอะไรบ้าง?"\n` +
          `• "ชำระเงินด้วย PromptPay ทำอย่างไร?"`,
    actions: [
      { label: "🎬 ดูภาพยนตร์กำลังฉาย", action: "VIEW_MOVIES" },
      { label: "🏢 ดูสาขาโรงภาพยนตร์", action: "VIEW_CINEMAS" }
    ]
  };
}

/**
 * Format markdown-like text to safe HTML
 */
function formatBotMarkdown(text) {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Lists
  html = html.replace(/\n• (.*?)(?=\n|$)/g, '<br>• $1');
  
  // Line breaks
  html = html.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');
  
  // Backticks `code`
  html = html.replace(/`(.*?)`/g, '<code style="background: rgba(255,255,255,0.1); padding: 0.1rem 0.35rem; border-radius: 4px; font-family: monospace;">$1</code>');

  return html;
}

/**
 * Initialize AI Chatbot interactive widget
 * @param {object} callbacks
 */
export function initChatbotWidget(callbacks = {}) {
  const launcherBtn = document.getElementById('cinebot-launcher-btn');
  const chatWindow = document.getElementById('cinebot-chat-window');
  const closeBtn = document.getElementById('cinebot-close-btn');
  const clearBtn = document.getElementById('cinebot-clear-btn');
  const messagesArea = document.getElementById('cinebot-messages-area');
  const quickChipsContainer = document.getElementById('cinebot-quick-chips');
  const inputForm = document.getElementById('cinebot-input-form');
  const textInput = document.getElementById('cinebot-text-input');

  if (!launcherBtn || !chatWindow || !messagesArea) return;

  let hasGreeted = false;

  // Toggle window
  const toggleChat = () => {
    const isHidden = chatWindow.style.display === 'none';
    chatWindow.style.display = isHidden ? 'flex' : 'none';
    if (isHidden) {
      if (!hasGreeted) {
        addBotMessage("สวัสดีครับ! ผมคือ **CINEBOT** 🤖 ผู้ช่วย AI ประจำ CINEPASS ยินดีให้ข้อมูลภาพยนตร์ รอบฉาย สาขาโรงหนัง และช่วยเหลือการจองตั๋วครับ สอบถามผมได้เลยครับ! 🍿", [
          { label: "🎬 หนังกำลังฉาย", action: "SEND_TEXT", payload: "ตอนนี้มีหนังเรื่องอะไรฉายอยู่บ้าง?" },
          { label: "🎟️ ราคาตั๋ว", action: "SEND_TEXT", payload: "บัตรชมภาพยนตร์ราคาเท่าไหร่?" },
          { label: "🏢 สาขาโรงหนัง", action: "VIEW_CINEMAS" }
        ]);
        hasGreeted = true;
      }
      setTimeout(() => textInput?.focus(), 100);
      scrollToBottom();
    }
  };

  launcherBtn.addEventListener('click', toggleChat);
  closeBtn?.addEventListener('click', () => {
    chatWindow.style.display = 'none';
  });

  // Render quick chips
  if (quickChipsContainer) {
    quickChipsContainer.innerHTML = QUICK_PROMPTS.map(p => `
      <button type="button" class="cinebot-chip" data-prompt="${p}">${p}</button>
    `).join('');

    quickChipsContainer.querySelectorAll('.cinebot-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        handleUserSend(chip.dataset.prompt);
      });
    });
  }

  // Clear chat
  clearBtn?.addEventListener('click', () => {
    messagesArea.innerHTML = '';
    hasGreeted = false;
    addBotMessage("ล้างประวัติการสนทนาเรียบร้อยครับ มีเรื่องอะไรเกี่ยวกับภาพยนตร์ให้ CINEBOT ช่วยเหลือสอบถามได้เลยครับ ✨");
  });

  function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }

  function addUserMessage(text) {
    const msgEl = document.createElement('div');
    msgEl.className = 'cinebot-msg msg-user';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    msgEl.innerHTML = `
      <div class="msg-bubble">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <span class="msg-time">${time}</span>
    `;
    messagesArea.appendChild(msgEl);
    scrollToBottom();
  }

  function addBotMessage(text, actions = []) {
    const msgEl = document.createElement('div');
    msgEl.className = 'cinebot-msg msg-bot';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    let actionsHtml = '';
    if (actions && actions.length > 0) {
      actionsHtml = `
        <div class="bot-actions-row">
          ${actions.map((act, i) => `
            <button type="button" class="bot-action-pill" data-index="${i}">
              ${act.label}
            </button>
          `).join('')}
        </div>
      `;
    }

    msgEl.innerHTML = `
      <div class="msg-bubble">
        ${formatBotMarkdown(text)}
        ${actionsHtml}
      </div>
      <span class="msg-time">CINEBOT • ${time}</span>
    `;

    // Attach actions
    msgEl.querySelectorAll('.bot-action-pill').forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const act = actions[idx];
        if (!act) return;
        if (act.action === 'BOOK_MOVIE' && callbacks.onBookMovie) {
          callbacks.onBookMovie(act.payload);
        } else if (act.action === 'BOOK_NOW' && callbacks.onBookNow) {
          callbacks.onBookNow();
        } else if (act.action === 'VIEW_CINEMAS' && callbacks.onViewCinemas) {
          callbacks.onViewCinemas();
        } else if (act.action === 'VIEW_MOVIES' && callbacks.onViewMovies) {
          callbacks.onViewMovies();
        } else if (act.action === 'OPEN_LOGIN' && callbacks.onOpenLogin) {
          callbacks.onOpenLogin();
        } else if (act.action === 'SEND_TEXT') {
          handleUserSend(act.payload);
        }
      });
    });

    messagesArea.appendChild(msgEl);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const indicatorEl = document.createElement('div');
    indicatorEl.id = 'bot-typing-indicator';
    indicatorEl.className = 'cinebot-msg msg-bot';
    indicatorEl.innerHTML = `
      <div class="msg-bubble" style="padding: 0.6rem 0.9rem;">
        <div class="typing-dots">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    messagesArea.appendChild(indicatorEl);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const el = document.getElementById('bot-typing-indicator');
    if (el) el.remove();
  }

  function handleUserSend(text) {
    const cleanText = text.trim();
    if (!cleanText) return;

    addUserMessage(cleanText);
    showTypingIndicator();

    setTimeout(() => {
      hideTypingIndicator();
      const botResponse = answerCinemaQuery(cleanText);
      addBotMessage(botResponse.text, botResponse.actions);
    }, 350);
  }

  inputForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = textInput.value;
    textInput.value = '';
    handleUserSend(text);
  });
}
