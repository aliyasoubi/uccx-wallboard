export interface AppConfig {
  // Base path the BFF client reads from. Today this points at the mock
  // fixtures folder; change it to a real BFF origin (e.g.
  // "https://cccx-bff.internal.company.com/api") once the backend exists.
  apiBaseUrl: string;
  // How often PollingDataSource re-fetches, in milliseconds.
  pollIntervalMs: number;
}
