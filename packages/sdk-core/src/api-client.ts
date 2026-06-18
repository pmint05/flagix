import { EvaluationResult, EvaluationContext } from './types';

export class EvaluationClient {
  private readonly baseUrl: string;
  private readonly sdkKey: string;

  constructor(sdkKey: string, baseUrl: string) {
    this.sdkKey = sdkKey;
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async evaluateAll(context: EvaluationContext): Promise<Record<string, EvaluationResult>> {
    const response = await fetch(`${this.baseUrl}/evaluate/all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SDK-Key': this.sdkKey,
      },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid SDK Key');
      }
      throw new Error(`Failed to fetch flags: ${response.statusText}`);
    }

    const data = await response.json() as { flags: EvaluationResult[] };
    const flags: Record<string, EvaluationResult> = {};
    if (data.flags && Array.isArray(data.flags)) {
      data.flags.forEach((f) => {
        flags[f.flagKey] = f;
      });
    }
    return flags;
  }

  async evaluateFlag(flagKey: string, context: EvaluationContext): Promise<EvaluationResult> {
    const response = await fetch(`${this.baseUrl}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SDK-Key': this.sdkKey,
      },
      body: JSON.stringify({ flagKey, context }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid SDK Key');
      }
      throw new Error(`Failed to evaluate flag ${flagKey}: ${response.statusText}`);
    }

    return await response.json() as EvaluationResult;
  }
}
