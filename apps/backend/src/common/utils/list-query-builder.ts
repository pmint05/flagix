import {
  type SQL,
  and,
  or,
  eq,
  inArray,
  ilike,
  gte,
  lte,
  asc,
  desc,
} from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';

export type FilterValue = string | string[] | boolean | undefined;

export type FilterOperator =
  | 'eq'
  | 'in'
  | 'ilike'
  | 'boolean'
  | 'dateFrom'
  | 'dateTo';

export interface FilterConfig {
  column: AnyPgColumn;
  operator?: FilterOperator;
}

export interface SortConfig {
  column: AnyPgColumn;
}

export interface ListQueryConfig {
  base: SQL[];
  q?: { columns: AnyPgColumn[] };
  filters?: Record<string, FilterConfig>;
  sort?: Record<string, SortConfig>;
  defaultSort: SortConfig & { direction: 'asc' | 'desc' };
}

export interface FilterInput {
  q?: string;
  [key: string]: FilterValue | number;
}

export class ListQueryBuilder {
  private conditions: SQL[] = [];

  constructor(private readonly config: ListQueryConfig) {
    this.conditions.push(...config.base);
  }

  apply(filters: FilterInput): this {
    if (this.config.q && typeof filters.q === 'string' && filters.q.trim()) {
      const term = `%${filters.q.trim()}%`;
      const searchConditions = this.config.q.columns.map((col) =>
        ilike(col, term),
      );
      const searchClause = or(...searchConditions);
      if (searchClause) {
        this.conditions.push(searchClause);
      }
    }

    if (this.config.filters) {
      for (const [field, { column, operator }] of Object.entries(
        this.config.filters,
      )) {
        const value = filters[field];
        const clause = this.buildFilter(column, operator ?? 'eq', value);
        if (clause) {
          this.conditions.push(clause);
        }
      }
    }

    return this;
  }

  orderBy(sort?: string): SQL {
    if (sort) {
      const [field, direction] = sort.split('-');
      const cfg = this.config.sort?.[field];
      if (cfg) {
        return direction === 'desc' ? desc(cfg.column) : asc(cfg.column);
      }
    }
    const { column, direction } = this.config.defaultSort;
    return direction === 'desc' ? desc(column) : asc(column);
  }

  pagination(page = 1, pageSize = 20): { limit: number; offset: number } {
    const sanitizedPage = Math.max(1, Number(page) || 1);
    const sanitizedPageSize = Math.max(
      1,
      Math.min(200, Number(pageSize) || 20),
    );
    return {
      limit: sanitizedPageSize,
      offset: (sanitizedPage - 1) * sanitizedPageSize,
    };
  }

  get where(): SQL | undefined {
    return this.conditions.length > 0 ? and(...this.conditions) : undefined;
  }

  private buildFilter(
    column: AnyPgColumn,
    operator: FilterOperator,
    value: FilterValue | number,
  ): SQL | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    switch (operator) {
      case 'eq':
        return eq(column, value);
      case 'in': {
        const values = Array.isArray(value) ? value : [value];
        if (values.length === 0) return undefined;
        if (values.length === 1) return eq(column, values[0]);
        return inArray(column, values);
      }
      case 'ilike': {
        if (typeof value !== 'string') return undefined;
        return ilike(column, `%${value}%`);
      }
      case 'boolean': {
        const bool =
          typeof value === 'boolean'
            ? value
            : value === 'true'
              ? true
              : value === 'false'
                ? false
                : undefined;
        if (bool === undefined) return undefined;
        return eq(column, bool);
      }
      case 'dateFrom':
        return gte(column, new Date(value as any));
      case 'dateTo':
        return lte(column, new Date(value as any));
      default:
        return undefined;
    }
  }
}
