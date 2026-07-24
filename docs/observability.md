# Observability

## Request IDs

Every API response includes an `x-request-id` header.

When debugging production issues, copy this value from the browser network tab or `curl -i` output and search for it in API logs.

```bash
curl -i https://levko.bg/api/health
```

## API Logs

Follow API logs:

```bash
kinti -n kinti-prod logs deployment/kinti-api -f --tail=200
```

Search recent logs for a request id:

```bash
kinti -n kinti-prod logs deployment/kinti-api --tail=1000 | grep "<request-id>"
```

The API logs:

- request method;
- request path without query string;
- response status;
- request duration;
- request id;
- slow requests above `SLOW_REQUEST_MS`, default `500`.

## Uptime Checks

Minimum external checks:

```text
https://levko.bg/
https://levko.bg/api/health
https://levko.bg/api/health/db
```

Recommended alert behavior:

- `https://levko.bg/`: alerts if the public site is down.
- `https://levko.bg/api/health`: alerts if the API process is unavailable.
- `https://levko.bg/api/health/db`: alerts if API cannot reach the database.

## Future

Add Sentry when the app starts collecting real user traffic.

Add OpenTelemetry/Prometheus only when Kubernetes-level metrics and plain logs are no longer enough.
