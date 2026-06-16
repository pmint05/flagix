import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter, finalize } from 'rxjs';
import { FlagChangeEvent, FlagChangeEventType } from './flag-change.types';

interface EnvironmentEntry {
  subject: Subject<FlagChangeEvent>;
  count: number;
}

@Injectable()
export class FlagChangePublisher {
  private readonly entries = new Map<string, EnvironmentEntry>();

  publish(environmentId: string, event: FlagChangeEvent): void {
    const entry = this.entries.get(environmentId);
    if (entry) {
      entry.subject.next(event);
    }
  }

  subscribe(
    environmentId: string,
    filterBy?: { eventTypes?: FlagChangeEventType[]; flagKey?: string },
  ): Observable<FlagChangeEvent> {
    let entry = this.entries.get(environmentId);
    if (!entry) {
      entry = { subject: new Subject<FlagChangeEvent>(), count: 0 };
      this.entries.set(environmentId, entry);
    }

    // Increment subscriber count
    entry.count++;

    let observable = entry.subject.asObservable().pipe(
      finalize(() => {
        const currentEntry = this.entries.get(environmentId);
        if (currentEntry) {
          currentEntry.count--;
          // Cleanup if no more subscribers
          if (currentEntry.count <= 0) {
            currentEntry.subject.complete();
            this.entries.delete(environmentId);
          }
        }
      }),
    );

    // Apply filters
    if (filterBy?.eventTypes?.length) {
      const types = new Set(filterBy.eventTypes);
      observable = observable.pipe(
        filter((event) => types.has(event.type)),
      );
    }

    if (filterBy?.flagKey) {
      const flagKey = filterBy.flagKey;
      observable = observable.pipe(
        filter((event) => event.flagKey === flagKey),
      );
    }

    return observable;
  }
}
