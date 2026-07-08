import { Injectable } from '@nestjs/common';
import { Observable, Subject, filter, finalize } from 'rxjs';
import { FlagChangeEvent, FlagChangeEventType } from './flag-change.types';

interface EnvironmentEntry {
  subject: Subject<FlagChangeEvent>;
  count: number;
}

interface SubscribeFilter {
  eventTypes?: FlagChangeEventType[];
  flagKey?: string;
  keyType?: 'client' | 'server';
}

const VISIBILITY_BLOCKS: Record<string, string> = {
  client: 'server_only',
  server: 'client_only',
};

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
    filterBy?: SubscribeFilter,
  ): Observable<FlagChangeEvent> {
    let entry = this.entries.get(environmentId);
    if (!entry) {
      entry = { subject: new Subject<FlagChangeEvent>(), count: 0 };
      this.entries.set(environmentId, entry);
    }

    entry.count++;

    let observable = entry.subject.asObservable().pipe(
      finalize(() => {
        const currentEntry = this.entries.get(environmentId);
        if (currentEntry) {
          currentEntry.count--;
          if (currentEntry.count <= 0) {
            currentEntry.subject.complete();
            this.entries.delete(environmentId);
          }
        }
      }),
    );

    if (filterBy?.keyType && filterBy.keyType in VISIBILITY_BLOCKS) {
      const blocked = VISIBILITY_BLOCKS[filterBy.keyType];
      observable = observable.pipe(
        filter((event) => !event.visibility || event.visibility !== blocked),
      );
    }

    if (filterBy?.eventTypes?.length) {
      const types = new Set(filterBy.eventTypes);
      observable = observable.pipe(filter((event) => types.has(event.type)));
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
