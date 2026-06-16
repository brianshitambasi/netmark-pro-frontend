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
    this.minNotificationInterval = 30000;
    this.soundEnabled = true;
    this.audioCache = {};
  }

  preloadSound() {
    try {
      const soundFiles = {
        urgent: '/sounds/urgent.mp3',
        reminder: '/sounds/reminder.mp3',
        info: '/sounds/info.mp3'
      };
      
      for (const [key, src] of Object.entries(soundFiles)) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        this.audioCache[key] = audio;
      }
    } catch (error) {
      console.warn('Could not preload sounds:', error);
    }
  }

  playSound(type = 'reminder') {
    if (!this.soundEnabled) return;
    
    try {
      if (this.audioCache[type]) {
        const audio = this.audioCache[type];
        audio.currentTime = 0;
        audio.play().catch(err => console.warn('Sound play failed:', err));
        return;
      }

      const soundFiles = {
        urgent: '/sounds/urgent.mp3',
        reminder: '/sounds/reminder.mp3',
        info: '/sounds/info.mp3'
      };
      
      const src = soundFiles[type] || soundFiles.reminder;
      const audio = new Audio(src);
      audio.play().catch(err => console.warn('Sound play failed:', err));
    } catch (error) {
      // Silently fail
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('Browser notifications not supported');
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  sendBrowserNotification(title, body, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const soundType = options.type || 'reminder';
    this.playSound(soundType);

    const now = Date.now();
    if (now - this.lastNotificationTime < this.minNotificationInterval) {
      if (options.type !== 'urgent') return;
    }
    this.lastNotificationTime = now;

    try {
      const notification = new Notification(title, {
        body: body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag || 'netmark-notification',
        requireInteraction: options.requireInteraction || true,
        silent: true,
        ...options
      });

      setTimeout(() => notification.close(), 15000);

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) options.onClick();
        window.location.href = '/followups';
      };
    } catch (error) {
      console.error('Browser notification error:', error);
    }
  }

  showToastNotification(message, type = 'info', duration = 5000) {
    if (type === 'error' || type === 'danger') {
      this.playSound('urgent');
    } else if (type === 'warning') {
      this.playSound('reminder');
    } else {
      this.playSound('info');
    }

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
      let title = '';
      let body = '';
      let type = '';
      let requireInteraction = false;

      if (mostUrgent.type === 'overdue') {
        const days = mostUrgent.first.days;
        title = ` ${mostUrgent.count} Follow-up(s) OVERDUE!`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - ${days} day(s) overdue! Contact now!`
          : `${mostUrgent.count} prospects need immediate attention!`;
        type = 'urgent';
        requireInteraction = true;
        this.showToastNotification(title, 'error', 8000);
      } else if (mostUrgent.type === 'due_today') {
        title = ` ${mostUrgent.count} Follow-up(s) Due TODAY`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - Due today!`
          : `${mostUrgent.count} follow-ups scheduled for today`;
        type = 'reminder';
        this.showToastNotification(title, 'warning', 500);
      } else if (mostUrgent.type === 'upcoming') {
        const days = mostUrgent.first.days;
        title = `h ${mostUrgent.count} Upcoming Follow-up(s)`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - in ${days} day(s)`
          : `${mostUrgent.count} follow-ups in next 3 days`;
        type = 'info';
        this.showToastNotification(title, 'info', 4000);
      }

      this.sendBrowserNotification(
        title,
        body,
        { 
          type: type,
          requireInteraction: requireInteraction,
          tag: `netmark-${Date.now()}`
        }
      );
    }
  }

  startPolling(intervalSeconds = 30) {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isInitialized = true;
    
    setTimeout(() => {
      this.checkAndNotify();
    }, 3000);
    
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
      if (count > 0) {
        navigator.setAppBadge(count);
      } else {
        navigator.clearAppBadge();
      }
    }
    if (count > 0) {
      document.title = `(${count}) NetMark Pro`;
    } else {
      document.title = 'NetMark Pro';
    }
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
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
    return this.soundEnabled;
  }
}

const notificationService = new NotificationService();
export default notificationService;
