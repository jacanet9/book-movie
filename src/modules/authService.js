// Authentication & Google OAuth Service
export const ADMIN_EMAILS = ['seree999@gmail.com'];

class AuthService {
  constructor() {
    this.currentUser = this.loadUser();
    this.listeners = [];
  }

  loadUser() {
    try {
      const saved = localStorage.getItem('mb_auth_user');
      if (saved) {
        const user = JSON.parse(saved);
        user.isAdmin = this.checkIsAdmin(user.email);
        return user;
      }
    } catch (e) {
      console.warn("Failed to load auth user", e);
    }
    return null;
  }

  saveUser(user) {
    if (user) {
      localStorage.setItem('mb_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mb_auth_user');
    }
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

  loginWithGoogle({ email, name, avatar }) {
    const isAdmin = this.checkIsAdmin(email);
    this.currentUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: email.trim().toLowerCase(),
      name: name || email.split('@')[0],
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=f59e0b&color=000&bold=true`,
      isAdmin,
      role: isAdmin ? 'ADMIN' : 'CUSTOMER',
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
    this.notify('AUTH_STATE_CHANGED', null);
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  isAdmin() {
    return !!this.currentUser?.isAdmin;
  }
}

export const authService = new AuthService();
