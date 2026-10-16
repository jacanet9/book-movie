// Modern Premium Notification & Modal Popup System

/**
 * Show a sleek, non-intrusive Toast notification
 * @param {string} message - Message text
 * @param {'success'|'warning'|'error'|'info'} type - Toast type
 * @param {number} duration - Milliseconds before auto-dismiss
 */
export function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: '✓',
    warning: '⚠️',
    error: '✕',
    info: 'ℹ️'
  };

  const toast = document.createElement('div');
  toast.className = `custom-toast toast-${type} animate-slide-left`;
  toast.innerHTML = `
    <div class="toast-icon-wrap">${icons[type] || 'ℹ️'}</div>
    <div class="toast-content-wrap">
      <span class="toast-text">${message}</span>
    </div>
    <button class="toast-close-btn" title="ปิด">✕</button>
  `;

  container.appendChild(toast);

  const removeToast = () => {
    toast.classList.remove('animate-slide-left');
    toast.classList.add('animate-fade-out');
    setTimeout(() => toast.remove(), 250);
  };

  toast.querySelector('.toast-close-btn').addEventListener('click', removeToast);

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

/**
 * Show an elegant, cinematic Modal Dialog
 * @param {object} options
 * @param {string} options.title - Dialog Title
 * @param {string} options.message - Dialog message
 * @param {'warning'|'success'|'error'|'info'|'auth'} options.type - Visual theme
 * @param {string} options.confirmText - Primary button text
 * @param {string|null} options.cancelText - Secondary button text
 * @param {function} options.onConfirm - Callback on confirm
 * @param {function} options.onCancel - Callback on cancel
 */
export function showModal({
  title = 'แจ้งเตือน',
  message = '',
  type = 'info',
  confirmText = 'ตกลง',
  cancelText = null,
  onConfirm = null,
  onCancel = null
}) {
  const existing = document.getElementById('custom-popup-overlay');
  if (existing) existing.remove();

  const icons = {
    warning: '⚠️',
    success: '🎉',
    error: '🔒',
    info: '🎬',
    auth: '🔐'
  };

  const overlay = document.createElement('div');
  overlay.id = 'custom-popup-overlay';
  overlay.className = 'modal-overlay custom-popup-overlay animate-fade-in';

  overlay.innerHTML = `
    <div class="custom-popup-card type-${type} animate-scale-up">
      <div class="popup-glow"></div>
      
      <div class="popup-icon-container">
        <div class="popup-icon-ring">
          <span class="popup-icon-symbol">${icons[type] || 'ℹ️'}</span>
        </div>
      </div>

      <div class="popup-body">
        <h3 class="popup-title">${title}</h3>
        <p class="popup-message">${message}</p>
      </div>

      <div class="popup-actions">
        ${cancelText ? `<button class="btn btn-secondary popup-cancel-btn">${cancelText}</button>` : ''}
        <button class="btn btn-primary popup-confirm-btn">
          <span>${confirmText}</span>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => {
    overlay.classList.remove('animate-fade-in');
    overlay.classList.add('animate-fade-out');
    setTimeout(() => overlay.remove(), 200);
  };

  overlay.querySelector('.popup-confirm-btn').addEventListener('click', () => {
    close();
    if (onConfirm) onConfirm();
  });

  if (cancelText) {
    overlay.querySelector('.popup-cancel-btn')?.addEventListener('click', () => {
      close();
      if (onCancel) onCancel();
    });
  }

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      close();
      if (onCancel) onCancel();
    }
  });

  // Focus primary button
  overlay.querySelector('.popup-confirm-btn')?.focus();
}

/**
 * Specifically styled prompt when Google Login is required
 */
export function showAuthRequiredModal(onLoginClick) {
  showModal({
    title: 'เข้าสู่ระบบด้วย Google',
    message: 'กรุณาเข้าสู่ระบบด้วยบัญชี Google เพื่อดำเนินการเลือกที่นั่ง จองตั๋วภาพยนตร์ และรับ E-Ticket แบบดิจิทัล',
    type: 'auth',
    confirmText: '🚀 เข้าสู่ระบบ Google ทันที',
    cancelText: 'ไว้ภายหลัง',
    onConfirm: () => {
      if (onLoginClick) onLoginClick();
    }
  });
}
