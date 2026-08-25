// Development config — used by `ng serve` / `npm start` with no build flag.
export const environment = {
  production: false,
  // When true, BffClientService reads from src/assets/fixtures/*.json
  // instead of calling apiBaseUrl. Flip this to false once a real BFF
  // endpoint exists in dev.
  useMockFixtures: false,
  apiBaseUrl: 'http://localhost:3000/api',
  pollIntervalMs: 3000,
};
