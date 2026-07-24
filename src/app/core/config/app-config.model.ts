import { StatusThresholds } from '../policies/status-thresholds.policy';

export interface AppConfig {
  // Base path the BFF client reads from. Today this points at the mock
  // fixtures folder; change it to a real BFF origin (e.g.
  // "https://cccx-bff.internal.company.com/api") once the backend exists.
  apiBaseUrl: string;
  // How often PollingDataSource re-fetches, in milliseconds.
  pollIntervalMs: number;
  // Warning/critical thresholds for every color-coded metric on the
  // board. Optional in the raw JSON file (assets/config.json) — anything
  // not specified falls back to DEFAULT_STATUS_THRESHOLDS, merged in by
  // AppConfigService.load(). Always fully populated on `config()` once
  // loaded, so components never need to null-check it.
  thresholds: StatusThresholds;
}
