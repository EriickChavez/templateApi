import { DomainEvent } from './DomainEvent';

interface UserUpdatedPayload {
  field: string;
  oldValue: any;
  newValue: any;
}

export class UserUpdatedEvent extends DomainEvent {
  public readonly payload: UserUpdatedPayload;

  constructor(aggregateId: string, version: number, payload: UserUpdatedPayload) {
    super(aggregateId, version, 'UserUpdatedEvent');
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
