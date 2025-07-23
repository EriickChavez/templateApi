import { DomainEvent } from './DomainEvent';

interface UserCreatedPayload {
  email: string;
  name: string;
  role: string;
}

export class UserCreatedEvent extends DomainEvent {
  public readonly payload: UserCreatedPayload;

  constructor(aggregateId: string, version: number, payload: UserCreatedPayload) {
    super(aggregateId, version, 'UserCreatedEvent');
    this.payload = payload;
  }

  toObject(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      version: this.version,
      occurredAt: this.occurredAt.toISOString(),
      payload: this.payload
    };
  }
}
