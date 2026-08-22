# CCCX Call Center Dashboard

Angular 18 standalone-component wallboard for a call center: signals-based
state, a mapper layer that isolates the app from backend contract drift,
and a runtime-configurable API endpoint.

## Quick start

```bash
npm install
npm start
```

Then open http://localhost:4200. Full "what's real vs. mocked" detail in
[`SETUP.md`](./SETUP.md).

## Docs map

| Doc                                              | What's in it                                                                                              |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| [`SETUP.md`](./SETUP.md)                         | Run it locally, what's mocked vs. real right now                                                          |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | Module mapping, tech stack, data layer, component rules, layout, open items — the current-state reference |
| [`CONFIGURATION.md`](./CONFIGURATION.md)         | Point it at a real backend, change poll interval/thresholds, env files vs. runtime config                 |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md)       | Implementation history, pass by pass                                                                      |

## Testing

```bash
npm test        # interactive (Karma watch)
npm run test:ci # headless, single run, with coverage
npm run lint     # ESLint
```
