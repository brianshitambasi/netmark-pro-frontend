import api from './api';
import toast from 'react-hot-toast';

class NotificationService {
  constructor() {
    this.lastCheck = null;
    this.intervalId = null;
    this.notificationCallbacks = [];
    this.urgentCount = 0;
    this.isInitialized = false;
    this.lastNotificationTime = 0;
    this.minNotificationInterval = 30000; // 30 seconds
    this.soundEnabled = true;
    this.swRegistration = null;
    this.audioContext = null;
    this.notificationCooldown = {};
  }

  // Get or create audio context
  getAudioContext() {
    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
      // Resume if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return this.audioContext;
    } catch (error) {
      console.warn('AudioContext not available:', error);
      return null;
    }
  }

  generateSound(type) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'urgent') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.15;
        oscillator.type = 'square';
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
        // Second beep
        setTimeout(() => {
          try {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.frequency.value = 600;
            gain2.gain.value = 0.15;
            osc2.type = 'square';
            osc2.start();
            osc2.stop(ctx.currentTime + 0.3);
          } catch (e) {}
        }, 200);
      } else if (type === 'reminder') {
        oscillator.frequency.value = 523.25;
        gainNode.gain.value = 0.1;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.4);
      } else {
        oscillator.frequency.value = 659.25;
        gainNode.gain.value = 0.08;
        oscillator.type = 'sine';
        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.3);
      }
    } catch (error) {
      // Silently fail
    }
  }

  playSound(type = 'reminder') {
    if (!this.soundEnabled) return;
    try { this.generateSound(type); } catch (e) {}
  }

  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready;
        return true;
      } catch (error) {
        console.warn('Service Worker not ready:', error);
        return false;
      }
    }
    return false;
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  getIconUrl() {
    return '/favicon.svg';
  }

  async sendBrowserNotification(title, body, options = {}) {
    if (Notification.permission !== 'granted') {
      this.showToastNotification(`${title}: ${body}`, 'warning', 8000);
      return;
    }

    this.playSound(options.type || 'reminder');

    const now = Date.now();
    const key = options.tag || 'default';
    if (this.notificationCooldown[key] && now - this.notificationCooldown[key] < this.minNotificationInterval) {
      if (options.type !== 'urgent') return;
    }
    this.notificationCooldown[key] = now;

    const notificationOptions = {
      body: body,
      icon: this.getIconUrl(),
      tag: options.tag || `netmark-${Date.now()}`,
      data: { url: '/followups' },
      requireInteraction: true
    };

    try {
      // Try using Service Worker first
      if (this.swRegistration && this.swRegistration.showNotification) {
        await this.swRegistration.showNotification(title, notificationOptions);
        return;
      }

      // Fallback to standard Notification API
      const notification = new Notification(title, notificationOptions);
      setTimeout(() => notification.close(), 20000);
      notification.onclick = () => {
        window.focus();
        notification.close();
        window.location.href = '/followups';
      };
    } catch (error) {
      // Silent fallback - just show toast
      this.showToastNotification(`${title}: ${body}`, 'warning', 6000);
    }
  }

  showToastNotification(message, type = 'info', duration = 5000) {
    if (type === 'error' || type === 'danger') this.playSound('urgent');
    else if (type === 'warning') this.playSound('reminder');
    else this.playSound('info');

    const toastFn = type === 'info' ? toast :
                    type === 'success' ? toast.success :
                    type === 'error' ? toast.error :
                    type === 'warning' ? toast : toast;
    toastFn(message, { duration });
  }

  async fetchNotifications() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const response = await api.get('/notifications', {
        timeout: 10000
      });
      return response.data.data;
    } catch (error) {
      // Silent fail - don't spam console
      return null;
    }
  }

  processNotifications(data) {
    if (!data) return;
    const { mostUrgent } = data;

    if (mostUrgent) {
      let title = '', body = '', type = '';

      if (mostUrgent.type === 'overdue') {
        const days = mostUrgent.first.days;
        title = ` ${mostUrgent.count} Follow-up(s) OVERDUE!`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - ${days} day(s) overdue!`
          : `${mostUrgent.count} prospects need attention!`;
        type = 'urgent';
        this.showToastNotification(title, 'error', 8000);
      } else if (mostUrgent.type === 'due_today') {
        title = ` ${mostUrgent.count} Follow-up(s) Due TODAY`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - Due today!`
          : `${mostUrgent.count} follow-ups scheduled for today`;
        type = 'reminder';
        this.showToastNotification(title, 'warning', 5000);
      } else if (mostUrgent.type === 'upcoming') {
        const days = mostUrgent.first.days;
        title = ` ${mostUrgent.count} Upcoming Follow-up(s)`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - in ${days} day(s)`
          : `${mostUrgent.count} follow-ups in next 3 days`;
        type = 'info';
        this.showToastNotification(title, 'info', 4000);
      }

      this.sendBrowserNotification(title, body, { type, tag: `netmark-${Date.now()}` });
    }
  }

  startPolling(intervalSeconds = 45) {
    if (this.intervalId) clearInterval(this.intervalId);
    this.isInitialized = true;

    this.initServiceWorker().then(() => {
      console.log('Service Worker initialized');
    });

    // Initial check after 5 seconds (give time for page to load)
    setTimeout(() => {
      this.checkAndNotify();
    }, 5000);
    
    this.intervalId = setInterval(() => {
      this.checkAndNotify();
    }, intervalSeconds * 1000);
  }

  async checkAndNotify() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.urgentCount = 0;
      return;
    }
    
    try {
      const data = await this.fetchNotifications();
      if (data) {
        this.processNotifications(data);
        this.updateBadgeCount(data.urgentCount || 0);
        this.notificationCallbacks.forEach(cb => cb(data));
      }
    } catch (error) {
      // Silent fail
    }
  }

  updateBadgeCount(count) {
    this.urgentCount = count;
    if (navigator.setAppBadge) {
      try {
        if (count > 0) navigator.setAppBadge(count);
        else navigator.clearAppBadge();
      } catch (e) {}
    }
    document.title = count > 0 ? `(${count}) NetMark Pro` : 'NetMark Pro';
  }

  onNotification(callback) {
    this.notificationCallbacks.push(callback);
  }

  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isInitialized = false;
    this.updateBadgeCount(0);
    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
    }
  }

  async refresh() {
    await this.checkAndNotify();
  }

  toggleSound(enabled) {
    this.soundEnabled = enabled;
    localStorage.setItem('notificationSound', enabled ? 'true' : 'false');
  }

  getSoundState() {
    const saved = localStorage.getItem('notificationSound');
    if (saved !== null) this.soundEnabled = saved === 'true';
    return this.soundEnabled;
  }
}

const notificationService = new NotificationService();
export default notificationService;
