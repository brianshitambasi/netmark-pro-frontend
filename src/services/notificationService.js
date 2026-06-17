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
    this.minNotificationInterval = 15000; // 15 seconds
    this.soundEnabled = true;
    this.audioCache = {};
    this.notificationShownToday = {};
  }

  preloadSound() {
    try {
      // Use online notification sounds if local files not available
      const soundFiles = {
        urgent: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
        reminder: 'https://www.soundjay.com/buttons/sounds/button-09.mp3',
        info: 'https://www.soundjay.com/button/beep-07.wav'
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
      // Try cached audio first
      if (this.audioCache[type]) {
        const audio = this.audioCache[type];
        audio.currentTime = 0;
        audio.volume = 0.7;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
        return;
      }

      // Fallback to online sound
      const soundFiles = {
        urgent: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
        reminder: 'https://www.soundjay.com/buttons/sounds/button-09.mp3',
        info: 'https://www.soundjay.com/button/beep-07.wav'
      };
      
      const src = soundFiles[type] || soundFiles.reminder;
      const audio = new Audio(src);
      audio.volume = 0.7;
      audio.play().catch(() => {});
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

  // Get the app icon URL
  getIconUrl() {
    // Try multiple sources for icon
    const icons = [
      '/images/logo.png',
      '/favicon.svg',
      '/favicon.ico',
      'https://netmark-pro-frontend.vercel.app/favicon.svg'
    ];
    return icons.find(src => {
      // Check if the resource exists (simple check)
      return true; // Return first available
    }) || '/favicon.ico';
  }

  sendBrowserNotification(title, body, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      // Fallback to toast
      this.showToastNotification(`${title}: ${body}`, 'warning', 8000);
      return;
    }

    // Play sound first
    const soundType = options.type || 'reminder';
    this.playSound(soundType);

    // Prevent too many notifications
    const now = Date.now();
    if (now - this.lastNotificationTime < this.minNotificationInterval) {
      if (options.type !== 'urgent') return;
    }
    this.lastNotificationTime = now;

    try {
      // Create persistent notification like WhatsApp
      const notification = new Notification(title, {
        body: body,
        icon: this.getIconUrl(),
        tag: options.tag || `netmark-${Date.now()}`,
        requireInteraction: true, // Stays until user clicks or dismisses
        silent: true, // We handle sound separately
        badge: this.getIconUrl(),
        timestamp: now,
        vibrate: [200, 100, 200], // Vibrate pattern for mobile
        actions: [
          { action: 'view', title: ' View Follow-ups' },
          { action: 'dismiss', title: '❌ Dismiss' }
        ]
      });

      // Auto-close after 30 seconds (less intrusive if user ignores)
      setTimeout(() => {
        if (notification) notification.close();
      }, 30000);

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        // Navigate to follow-ups
        window.location.href = '/followups';
      };

      // Handle action buttons
      notification.onaction = (event) => {
        if (event.action === 'view') {
          window.focus();
          window.location.href = '/followups';
        }
        notification.close();
      };

      // Handle close
      notification.onclose = () => {
        console.log('Notification dismissed');
      };

    } catch (error) {
      console.error('Browser notification error:', error);
      // Fallback to toast
      this.showToastNotification(`${title}: ${body}`, 'warning', 8000);
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
      let requireInteraction = true;

      if (mostUrgent.type === 'overdue') {
        const days = mostUrgent.first.days;
        title = ` ${mostUrgent.count} Follow-up(s) OVERDUE!`;
        body = mostUrgent.count === 1 
          ? `${mostUrgent.first.name} - ${days} day(s) overdue! Contact now!`
          : `${mostUrgent.count} prospects need immediate attention!`;
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

      // Send system notification (like WhatsApp)
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
    
    // Initial check after 2 seconds
    setTimeout(() => {
      this.checkAndNotify();
    }, 2000);
    
    // Polling
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
