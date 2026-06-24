/**
 * UX-telemetry pipe (PRD-00 §3.12, PRD-03 §7) — screen views, scroll/funnel
 * micro-behavior. Goes to PostHog (self-hosted) and MUST NEVER be routed
 * through our backend. Kept separate from the business-signal track() in
 * ./analytics.
 *
 * posthog-js is an OPTIONAL dependency. Until it's installed + initialized
 * (NEXT_PUBLIC_POSTHOG_KEY + self-hosted host), these calls are no-ops — so the
 * app builds with zero extra setup. Call telemetry.init(client) once at startup
 * to activate.
 */
export interface TelemetryClient {
  capture(event: string, props?: Record<string, unknown>): void;
  identify(distinctId: string, props?: Record<string, unknown>): void;
}

let client: TelemetryClient | null = null;

export const telemetry = {
  init(c: TelemetryClient): void {
    client = c;
  },
  capture(event: string, props?: Record<string, unknown>): void {
    client?.capture(event, props);
  },
  identify(userId: string, anonymousId: string): void {
    client?.identify(userId, { anonymousId });
  },
};
