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
    this.minNotificationInterval = 15000;
    this.soundEnabled = true;
    this.swRegistration = null;
  }

  // Initialize service worker
  async initServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.ready;
        console.log('Service Worker ready for notifications');
        return true;
      } catch (error) {
        console.error('Service Worker not ready:', error);
        return false;
      }
    }
    return false;
  }

  generateSound(type) {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      if (type === 'urgent') {
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        oscillator.type = 'square';
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
        setTimeout(() => {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          osc2.frequency.value = 600;
          gain2.gain.value = 0.3;
          osc2.type = 'square';
          osc2.start();
          setTimeout(() => osc2.stop(), 300);
        }, 200);
      } else if (type === 'reminder') {
        oscillator.frequency.value = 523.25;
        gainNode.gain.value = 0.2;
        oscillator.type = 'sine';
        oscillator.start();
        setTimeout(() => oscillator.stop(), 400);
      } else {
        oscillator.frequency.value = 659.25;
        gainNode.gain.value = 0.15;
        oscillator.type = 'sine';
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
      }
    } catch (error) {}
  }

  playSound(type = 'reminder') {
    if (!this.soundEnabled) return;
    try { this.generateSound(type); } catch (e) {}
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      console.warn('Notifications blocked');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  getIconUrl() {
    const icons = ['/images/logo.png', '/favicon.svg', '/favicon.ico'];
    return icons.find(() => true) || '/favicon.ico';
  }

  // Send notification using Service Worker if available
  async sendBrowserNotification(title, body, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      this.showToastNotification(`${title}: ${body}`, 'warning', 8000);
      return;
    }

    this.playSound(options.type || 'reminder');

    const now = Date.now();
    if (now - this.lastNotificationTime < this.minNotificationInterval) {
      if (options.type !== 'urgent') return;
    }
    this.lastNotificationTime = now;

    const notificationOptions = {
      body: body,
      icon: this.getIconUrl(),
      tag: options.tag || `netmark-${Date.now()}`,
      data: { url: '/followups' },
      vibrate: [200, 100, 200],
      requireInteraction: true
    };

    try {
      // Try using Service Worker first (better for mobile background)
      if (this.swRegistration && this.swRegistration.showNotification) {
        await this.swRegistration.showNotification(title, notificationOptions);
        console.log('Notification sent via Service Worker');
        return;
      }

      // Fallback to standard Notification API
      const notification = new Notification(title, notificationOptions);
      setTimeout(() => notification.close(), 30000);
      notification.onclick = () => {
        window.focus();
        notification.close();
        window.location.href = '/followups';
      };
    } catch (error) {
      console.error('Notification error:', error);
      // Fallback: standard notification without vibrate
      try {
        const simpleOptions = { ...notificationOptions };
        delete simpleOptions.vibrate;
        if (this.swRegistration) {
          await this.swRegistration.showNotification(title, simpleOptions);
        } else {
          const notification = new Notification(title, simpleOptions);
          setTimeout(() => notification.close(), 30000);
          notification.onclick = () => {
            window.focus();
            notification.close();
            window.location.href = '/followups';
          };
        }
      } catch (fallbackError) {
        console.error('Fallback notification failed:', fallbackError);
        this.showToastNotification(`${title}: ${body}`, 'warning', 8000);
      }
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
      const response = await api.get('/notifications');
      const data = response.data.data;
      this.urgentCount = data.urgentCount || 0;
      return data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
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
        title = `í´´ ${mostUrgent.count} Follow-up(s) OVERDUE!`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - ${days} day(s) overdue! Contact now!`
          : `${mostUrgent.count} prospects need immediate attention!`;
        type = 'urgent';
        this.showToastNotification(title, 'error', 8000);
      } else if (mostUrgent.type === 'due_today') {
        title = `í´” ${mostUrgent.count} Follow-up(s) Due TODAY`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - Due today!`
          : `${mostUrgent.count} follow-ups scheduled for today`;
        type = 'reminder';
        this.showToastNotification(title, 'warning', 5000);
      } else if (mostUrgent.type === 'upcoming') {
        const days = mostUrgent.first.days;
        title = `ï¿½ï¿½ ${mostUrgent.count} Upcoming Follow-up(s)`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - in ${days} day(s)`
          : `${mostUrgent.count} follow-ups in next 3 days`;
        type = 'info';
        this.showToastNotification(title, 'info', 4000);
      }

      this.sendBrowserNotification(title, body, { type, tag: `netmark-${Date.now()}` });
    }
  }

  startPolling(intervalSeconds = 30) {
    if (this.intervalId) clearInterval(this.intervalId);
    this.isInitialized = true;

    // Initialize service worker first
    this.initServiceWorker().then(() => {
      console.log('Service Worker initialized for notifications');
    });

    setTimeout(() => this.checkAndNotify(), 2000);
    this.intervalId = setInterval(() => this.checkAndNotify(), intervalSeconds * 1000);
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
        this.updateBadgeCount(data.urgentCount);
        this.notificationCallbacks.forEach(cb => cb(data));
      }
    } catch (error) {
      console.error('Notification check failed:', error);
    }
  }

  updateBadgeCount(count) {
    this.urgentCount = count;
    if (navigator.setAppBadge) {
      if (count > 0) navigator.setAppBadge(count);
      else navigator.clearAppBadge();
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
