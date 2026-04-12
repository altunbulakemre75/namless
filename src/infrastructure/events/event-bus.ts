// Event-Driven Omurga
// v0: In-memory event bus
// v1: Postgres LISTEN/NOTIFY
// v2: Redis Streams

export type EventType =
  | "UserRegistered"
  | "DiagnosticCompleted"
  | "AnswerSubmitted"
  | "MasteryThresholdCrossed"
  | "DailyPlanCompleted"
  | "WeeklyReviewDue"
  | "PaymentFailed";

export interface DomainEvent<T = unknown> {
  id: string;
  type: EventType;
  payload: T;
  timestamp: Date;
  userId: string | null;
}

type EventHandler<T = unknown> = (event: DomainEvent<T>) => Promise<void>;

class EventBus {
  private handlers = new Map<EventType, EventHandler[]>();

  on<T>(type: EventType, handler: EventHandler<T>): void {
    const existing = this.handlers.get(type) || [];
    existing.push(handler as EventHandler);
    this.handlers.set(type, existing);
  }

  async emit<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.allSettled(handlers.map((handler) => handler(event)));
  }
}

// Singleton — uygulama boyunca tek event bus
export const eventBus = new EventBus();
