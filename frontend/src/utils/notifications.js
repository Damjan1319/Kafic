// Browser notifications utility
class NotificationService {
  constructor() {
    this.permission = 'default';
    this.init();
  }

  init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission === 'granted';
  }

  async showNotification(title, options = {}) {
    const hasPermission = await this.requestPermission();
    
    if (!hasPermission) {
      console.log('Notification permission denied');
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  showNewOrderNotification(order) {
    const title = 'Nova porudžbina!';
    const body = `Sto ${order.table_number} je poručio ${order.items?.length || 0} stavki`;
    
    return this.showNotification(title, {
      body,
      tag: `order-${order.id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Pogledaj'
        }
      ]
    });
  }

  showOrderUpdatedNotification(order) {
    const statusText = {
      'approved': 'odobrena',
      'completed': 'završena',
      'cancelled': 'otkazana'
    };

    const title = 'Porudžbina ažurirana';
    const body = `Porudžbina ${order.order_number} je ${statusText[order.status] || order.status}`;
    
    return this.showNotification(title, {
      body,
      tag: `order-update-${order.id}`
    });
  }

  showShiftStatsNotification(stats) {
    const title = 'Statistika smene';
    const body = `${stats.totalOrders} porudžbina, ${stats.totalRevenue} RSD`;
    
    return this.showNotification(title, {
      body,
      tag: 'shift-stats'
    });
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService; 