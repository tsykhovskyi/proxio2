export class EventEmitter {
  private listeners = new Map<string, Function[]>();

  on(event: string, listener: Function) {
    let listeners = this.listeners.get(event);
    if (listeners === undefined) {
      listeners = [];
    }
    listeners = [...listeners, listener];

    this.listeners.set(event, listeners);
  }

  removeAllListeners(event: string) {
    this.listeners.delete(event);
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.listeners.get(event);
    if (listeners === undefined) {
      return;
    }
    for (const listener of listeners) {
      listener(...args);
    }
  }
}
