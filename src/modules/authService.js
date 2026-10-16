// Authentication & Official Google OAuth (Google Identity Services)
export const SUPERADMIN_EMAILS = ['674295049@parichat.skru.ac.th'];
export const ADMIN_EMAILS = ['674295049@parichat.skru.ac.th', 'seree999@gmail.com'];

// Helper to decode JWT token from Google Identity Services
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error("Google JWT Parse Error:", e);
    return null;
  }
}

class AuthService {
  constructor() {
    this.currentUser = this.loadUser();
    this.googleClientId = this.loadClientId();
    this.listeners = [];
  }

  loadUser() {
    try {
      const saved = localStorage.getItem('mb_auth_user');
      if (saved) {
        const user = JSON.parse(saved);
        user.isSuperAdmin = this.checkIsSuperAdmin(user.email);
        user.isAdmin = this.checkIsAdmin(user.email);
        user.role = user.isSuperAdmin ? 'SUPER_ADMIN' : user.isAdmin ? 'ADMIN' : 'CUSTOMER';
        return user;
      }
    } catch (e) {
      console.warn("Failed to load auth user", e);
    }
    return null;
  }

  loadClientId() {
    return (
      localStorage.getItem('mb_google_client_id') ||
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) ||
      ''
    );
  }

  setClientId(clientId) {
    this.googleClientId = clientId.trim();
    localStorage.setItem('mb_google_client_id', this.googleClientId);
    this.notify('CLIENT_ID_UPDATED', this.googleClientId);
  }

  saveUser(user) {
    if (user) {
      localStorage.setItem('mb_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mb_auth_user');
    }
  }

  checkIsSuperAdmin(email) {
    if (!email) return false;
    return SUPERADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.trim().toLowerCase());
  }

  checkIsAdmin(email) {
    if (!email) return false;
    return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.trim().toLowerCase());
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify(event, data) {
    this.listeners.forEach(l => l(event, data));
  }

  // Handle Real Google Credential returned from Google Identity Services
  handleGoogleCredential(credentialToken) {
    const payload = parseJwt(credentialToken);
    if (!payload || !payload.email) {
      throw new Error("Invalid Google Credential token");
    }

    const email = payload.email.trim().toLowerCase();
    const isSuperAdmin = this.checkIsSuperAdmin(email);
    const isAdmin = this.checkIsAdmin(email);

    this.currentUser = {
      id: payload.sub || ('usr_' + Math.random().toString(36).substring(2, 9)),
      email,
      name: payload.name || payload.given_name || email.split('@')[0],
      avatar: payload.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(payload.name || email)}&background=f59e0b&color=000&bold=true`,
      isSuperAdmin,
      isAdmin,
      role: isSuperAdmin ? 'SUPER_ADMIN' : isAdmin ? 'ADMIN' : 'CUSTOMER',
      provider: 'google',
      verified: payload.email_verified || true,
      loggedInAt: new Date().toISOString()
    };

    this.saveUser(this.currentUser);
    this.notify('AUTH_STATE_CHANGED', this.currentUser);
    return this.currentUser;
  }

  // Fallback or simulated Google login
  loginWithGoogle({ email, name, avatar }) {
    const trimmedEmail = email.trim().toLowerCase();
    const isSuperAdmin = this.checkIsSuperAdmin(trimmedEmail);
    const isAdmin = this.checkIsAdmin(trimmedEmail);

    this.currentUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: trimmedEmail,
      name: name || trimmedEmail.split('@')[0],
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || trimmedEmail)}&background=f59e0b&color=000&bold=true`,
      isSuperAdmin,
      isAdmin,
      role: isSuperAdmin ? 'SUPER_ADMIN' : isAdmin ? 'ADMIN' : 'CUSTOMER',
      provider: 'google',
      loggedInAt: new Date().toISOString()
    };

    this.saveUser(this.currentUser);
    this.notify('AUTH_STATE_CHANGED', this.currentUser);
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    this.saveUser(null);
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
    this.notify('AUTH_STATE_CHANGED', null);
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return !!this.currentUser?.isAdmin;
  }

  isSuperAdmin() {
    return !!this.currentUser?.isSuperAdmin;
  }

  // Initialize official Google Identity Services in browser
  initGoogleIdentityButton(containerElementId, onSuccess) {
    if (typeof window === 'undefined') return;

    const clientId = this.googleClientId;
    const container = document.getElementById(containerElementId);
    if (!container) return;

    if (!clientId) {
      container.innerHTML = `
        <div style="text-align: center; padding: 0.5rem; background: rgba(255,255,255,0.03); border: 1px dashed var(--border-glass); border-radius: 8px; font-size: 0.8rem; color: var(--text-muted);">
          ยังไม่ได้ระบุ <code>Google Client ID</code> สำหรับเชื่อมต่อกับ Google Cloud Console
          <button id="open-clientid-config-btn" style="display: block; margin: 0.4rem auto 0; background: none; border: none; color: var(--cyan-accent); cursor: pointer; text-decoration: underline; font-size: 0.8rem;">
            ⚙️ ตั้งค่า Google Client ID
          </button>
        </div>
      `;
      document.getElementById('open-clientid-config-btn')?.addEventListener('click', () => {
        const configBox = document.getElementById('google-config-box');
        if (configBox) configBox.style.display = configBox.style.display === 'none' ? 'block' : 'none';
      });
      return;
    }

    if (!window.google?.accounts?.id) {
      // Retry when SDK finishes loading
      setTimeout(() => this.initGoogleIdentityButton(containerElementId, onSuccess), 300);
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          try {
            const user = this.handleGoogleCredential(response.credential);
            if (onSuccess) onSuccess(user);
          } catch (err) {
            alert("Google Sign-In Error: " + err.message);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      });

      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        theme: 'filled_blue',
        size: 'large',
        type: 'standard',
        shape: 'rectangular',
        text: 'signin_with',
        logo_alignment: 'left',
        width: 320
      });
    } catch (err) {
      console.warn("GIS Button render warning:", err);
    }
  }
}

export const authService = new AuthService();
