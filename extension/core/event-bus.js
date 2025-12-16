/**
 * 事件总线 - 用于组件间通信
 */
class EventBus {
  constructor() {
    this.events = new Map();
  }

  /**
   * 订阅事件
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event).push(callback);
    return () => this.off(event, callback);
  }

  /**
   * 取消订阅
   */
  off(event, callback) {
    if (!this.events.has(event)) return;
    
    const callbacks = this.events.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
    
    if (callbacks.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * 触发事件
   */
  emit(event, ...args) {
    if (!this.events.has(event)) return;
    
    const callbacks = this.events.get(event);
    callbacks.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`事件处理器错误 [${event}]:`, error);
      }
    });
  }

  /**
   * 一次性订阅
   */
  once(event, callback) {
    const unsubscribe = this.on(event, (...args) => {
      unsubscribe();
      callback(...args);
    });
    return unsubscribe;
  }

  /**
   * 清除所有事件
   */
  clear() {
    this.events.clear();
  }
}

// 全局事件总线实例
window.ZiliuEventBus = new EventBus();