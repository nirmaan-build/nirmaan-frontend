/**
 * UX-telemetry pipe (PRD-00 §3.12, PRD-02 §6) — screen views, scroll/funnel
 * micro-behavior. This goes to PostHog (self-hosted) and MUST NEVER be routed
 * through our backend. Keep it strictly separate from the business-signal
 * track() in ./analytics.
 *
 * `posthog-react-native` is an OPTIONAL native dependency. Until it's installed
 * and initialized (POSTHOG_API_KEY + self-hosted host), these calls are no-ops
 * — so the app builds and runs with zero new native linking. To enable, install
 * the SDK and call telemetry.init(client) once at startup (see Stage 4 notes).
 */
export interface TelemetryClient {
  capture(event: string, props?: Record<string, unknown>): void;
  screen(name: string, props?: Record<string, unknown>): void;
  identify(distinctId: string, props?: Record<string, unknown>): void;
}

let client: TelemetryClient | null = null;

export const telemetry = {
  /** Call once at startup with a configured PostHog client to activate. */
  init(c: TelemetryClient): void {
    client = c;
  },
  screen(name: string, props?: Record<string, unknown>): void {
    client?.screen(name, props);
  },
  capture(event: string, props?: Record<string, unknown>): void {
    client?.capture(event, props);
  },
  identify(userId: string, anonymousId: string): void {
    client?.identify(userId, { anonymousId });
  },
};
