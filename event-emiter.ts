type Listener = Function & { _?: Listener };
type EventName = string | symbol;
type EventMap = Map<EventName, Listener[]>;

export interface EventEmiter {
  constructor: Function;
  on(name: EventName, fn: Listener): this;
  only(name: EventName, fn: Listener): this;
  once(name: EventName, fn: Listener): this;
  emit(name: EventName, args?: any[]): Promise<any[]>;
  off(name: EventName, fn?: Listener): this;
  clear(): void;
}

function multiName(name: EventName) {
  if (typeof name === 'symbol') {
    return [name];
  }

  return name.trim().split(/\s+/);
}

class Emitter implements EventEmiter {
  private events: EventMap;

  constructor() {
    this.events = new Map();
  }

  on(name: EventName, fn: Listener) {
    const events = this.events;
    const names = multiName(name);

    names.forEach((n: EventName) => {
      if (!events.has(n)) {
        events.set(n, []);
      }

      events.get(n)!.push(fn);
    });

    return this;
  }

  // 只绑定一次，不会重复绑定
  only(name: string, fn: Listener) {
    return this.events.has(name) ? this : this.on(name, fn);
  }

  once(name: string, fn: Listener) {
    const self = this;

    const listener = (...args: any[]) => {
      self.off(name, listener);

      return fn(...args);
    };

    listener._ = fn;

    return this.on(name, listener);
  }

  emit(name: string, ...args: any[]) {
    const names = multiName(name);
    const tasks: any[] = [];

    names.forEach((n: EventName) => {
      const events = this.events.get(n);

      if (!events) {
        return;
      }

      events.map((fn) => tasks.push(fn(...args)));
    });

    return Promise.all(tasks);
  }

  off(name: string, fn: Listener) {
    const names = multiName(name);

    names.forEach((n: EventName) => {
      if (fn) {
        this.events.set(
          n,
          this.events.get(n)!.filter((item) => item !== fn && item._ !== fn),
        );
      } else {
        this.events.delete(n);
      }
    });

    return this;
  }

  clear() {
    this.events = new Map();
  }
}

export default Emitter;
