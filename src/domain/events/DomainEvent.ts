export abstract class DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly version: number;

  constructor(
    aggregateId: string,
    version: number,
    eventType?: string
  ) {
    this.eventId = this.generateEventId();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.version = version;
    this.eventType = eventType || this.constructor.name;
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convierte el evento a un objeto plano
   */
  abstract toObject(): Record<string, any>;
}
