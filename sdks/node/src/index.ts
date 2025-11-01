import type { ActionConfig, ActionConfigPayload } from "@pay2run/types";

export interface Pay2RunNodeOptions {
  apiKey: string;
  apiBaseUrl?: string; // Defaults to 'https://api.pay2.run'
}

export class Pay2Run {
  private options: Pay2RunNodeOptions;
  public actions: ActionManager;

  constructor(options: Pay2RunNodeOptions) {
    if (!options.apiKey) throw new Error("pay2.run: API key is required.");
    this.options = {
      apiBaseUrl: "https://api.pay2.run",
      ...options,
    };
    this.actions = new ActionManager(this.options);
  }
}

class ActionManager {
  private options: Pay2RunNodeOptions;

  constructor(options: Pay2RunNodeOptions) {
    this.options = options;
  }

  private async request<T>(method: string, path: string, body?: any): Promise<T> {
    const url = `${this.options.apiBaseUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.options.apiKey}`,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(`pay2.run API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async create(payload: ActionConfigPayload): Promise<ActionConfig> {
    return this.request<ActionConfig>("POST", "/v1/actions", payload);
  }

  async get(actionId: string): Promise<ActionConfig> {
    return this.request<ActionConfig>("GET", `/v1/actions/${actionId}`);
  }

  async list(): Promise<ActionConfig[]> {
    return this.request<ActionConfig[]>("GET", "/v1/actions");
  }

  async update(
    actionId: string,
    payload: Partial<ActionConfigPayload>
  ): Promise<ActionConfig> {
    return this.request<ActionConfig>("PATCH", `/v1/actions/${actionId}`, payload);
  }

  async delete(actionId: string): Promise<void> {
    await this.request<void>("DELETE", `/v1/actions/${actionId}`);
  }
}
