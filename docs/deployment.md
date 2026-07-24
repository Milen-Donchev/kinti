# Kinti Deployment

This document describes the current production deployment flow for Kinti.

## Production Context

- Kubernetes runs on the DigitalOcean Droplet through k3s.
- The Helm release is `kinti`.
- The production namespace is `kinti-prod`.
- Container images are stored in GHCR:
  - `ghcr.io/milen-donchev/kinti-api`
  - `ghcr.io/milen-donchev/kinti-web`
- GitHub Actions builds images on push to `main`.
- Image tags are published as both `latest` and the full commit SHA.

Use the commit SHA tag for production deploys. Avoid relying on `latest`.

The local machine has this alias:

```bash
kinti="kubectl --kubeconfig ~/.kube/kinti-do.yaml"
```

## Pre-Deploy Checklist

1. Make sure the relevant changes are committed and pushed to `main`.
2. Confirm GitHub Actions built both images successfully.
3. Copy the full commit hash from the successful CI run.
4. Check whether the API changes include Prisma migrations.
5. If migrations exist, run production migrations before the API rollout.

## Local Validation

Run these before pushing or deploying when possible:

```bash
bun --cwd apps/api lint
bun --cwd apps/api build
bun --cwd apps/web lint
bun --cwd apps/web build
```

The web build may warn about a large bundle. That is currently known and does not block deploys.

## Prisma Migrations

If the deployed API image expects a newer Prisma schema, production DB migrations must run before the API rollout.

Use the production direct database URL:

```bash
DATABASE_URL="$DIRECT_URL" bun --cwd apps/api prisma migrate deploy
```

Important:

- Run migrations with the direct Supabase connection, not the pooled PgBouncer URL.
- If the API returns `Database error: PrismaClientKnownRequestError` after deploy, first check whether migrations were missed.

## Standard Full Deploy

Use this when deploying API and Web from the same commit:

```bash
export IMAGE_TAG="<full_commit_sha>"
```

```bash
helm upgrade kinti infra/helm/kinti \
  --kubeconfig ~/.kube/kinti-do.yaml \
  --namespace kinti-prod \
  --reuse-values \
  --set-string api.image.tag="$IMAGE_TAG" \
  --set-string web.image.tag="$IMAGE_TAG" \
  --set-string api.image.pullPolicy=Always \
  --set-string web.image.pullPolicy=Always \
  --wait \
  --timeout 5m
```

## Web-Only Deploy

Use this when only the frontend changed:

```bash
export WEB_IMAGE_TAG="<full_commit_sha>"
```

```bash
helm upgrade kinti infra/helm/kinti \
  --kubeconfig ~/.kube/kinti-do.yaml \
  --namespace kinti-prod \
  --reuse-values \
  --set-string web.image.tag="$WEB_IMAGE_TAG" \
  --set-string web.image.pullPolicy=Always \
  --wait \
  --timeout 5m
```

Check the rollout:

```bash
kinti -n kinti-prod rollout status deployment/kinti-web --timeout=180s
```

## API-Only Deploy

Use this when only the backend changed.

Run migrations first if needed, then:

```bash
export API_IMAGE_TAG="<full_commit_sha>"
```

```bash
helm upgrade kinti infra/helm/kinti \
  --kubeconfig ~/.kube/kinti-do.yaml \
  --namespace kinti-prod \
  --reuse-values \
  --set-string api.image.tag="$API_IMAGE_TAG" \
  --set-string api.image.pullPolicy=Always \
  --wait \
  --timeout 5m
```

Check the rollout:

```bash
kinti -n kinti-prod rollout status deployment/kinti-api --timeout=180s
```

## Runtime Web Config

The web app uses runtime config in Kubernetes.

ConfigMap values:

- `web.config.VITE_API_URL`
- `web.config.VITE_SUPABASE_URL`

Secret values:

- `web.secrets.VITE_SUPABASE_ANON_KEY`

The nginx container generates `/config.js` on startup, and the React app reads `window.__KINTI_CONFIG__`.

For local development, the app falls back to `apps/web/.env`.

Supabase anon key note:

- The anon key is still sent to the browser, so it is not a true private secret.
- Keeping it in a Kubernetes Secret is useful operational hygiene.
- Real data protection must come from Supabase Auth, database permissions, and RLS policies.

## Updating Web Runtime Config

If changing only web runtime config or the Supabase anon key, run Helm upgrade and restart the web deployment.

```bash
helm upgrade kinti infra/helm/kinti \
  --kubeconfig ~/.kube/kinti-do.yaml \
  --namespace kinti-prod \
  --reuse-values \
  --set-string web.config.VITE_API_URL="http://46.101.230.169.sslip.io/api" \
  --set-string web.config.VITE_SUPABASE_URL="https://auzgqefookfzxmbejpjx.supabase.co" \
  --set-string web.secrets.VITE_SUPABASE_ANON_KEY="$VITE_SUPABASE_ANON_KEY" \
  --wait \
  --timeout 5m
```

Then restart web pods so `/config.js` is regenerated:

```bash
kinti -n kinti-prod rollout restart deployment/kinti-web
kinti -n kinti-prod rollout status deployment/kinti-web --timeout=180s
```

## Restarting Both Apps

```bash
kinti -n kinti-prod rollout restart deployment/kinti-api deployment/kinti-web
```

Then:

```bash
kinti -n kinti-prod rollout status deployment/kinti-api --timeout=180s
kinti -n kinti-prod rollout status deployment/kinti-web --timeout=180s
```

## Smoke Tests

```bash
curl -i https://levko.bg/
curl -i https://levko.bg/api/health
curl -i https://levko.bg/api/health/db
```

For authenticated endpoints, test through the web app or with a valid Supabase access token.

## Production Hardening

### HTTPS and Domain

Production traffic should use the real domain:

```text
https://levko.bg
```

The production Helm values configure:

- `ingress.hosts`: `levko.bg` and `www.levko.bg`
- `ingress.tls.enabled`: `true`
- `ingress.tls.secretName`: `levko-bg-tls`
- `ingress.tls.clusterIssuer`: `letsencrypt-prod`
- `api.config.WEB_ORIGIN`: `https://levko.bg`
- `web.config.VITE_API_URL`: `https://levko.bg/api`

Avoid testing production through the old `sslip.io` URL unless you are debugging DNS or ingress directly.

### Basic Monitoring and Logging

For the current budget-conscious setup, use Kubernetes and DigitalOcean's built-in visibility before adding paid observability tools.

Quick health checks:

```bash
curl -fsS https://levko.bg/api/health
curl -fsS https://levko.bg/api/health/db
```

Current pods:

```bash
kinti -n kinti-prod get pods -o wide
```

Recent pod events:

```bash
kinti -n kinti-prod get events --sort-by=.lastTimestamp
```

API logs:

```bash
kinti -n kinti-prod logs deployment/kinti-api --tail=200
```

Web logs:

```bash
kinti -n kinti-prod logs deployment/kinti-web --tail=200
```

Follow logs while testing:

```bash
kinti -n kinti-prod logs deployment/kinti-api -f --tail=80
```

Resource usage:

```bash
kinti -n kinti-prod top pods
kinti top nodes
```

If `top` does not work, install or enable `metrics-server` in the cluster before relying on these commands.

Recommended lightweight external monitor:

- Add an uptime check for `https://levko.bg/api/health`.
- Add another check for `https://levko.bg/`.
- Keep alerting simple at first: email notification is enough.

Do not add Prometheus, Grafana, Loki, or paid log drains yet unless we need historical metrics, alert routing, or deeper debugging.

### Resource Limits

Current default resource profile:

- API requests: `100m` CPU, `128Mi` memory
- API limits: `500m` CPU, `512Mi` memory
- Web requests: `50m` CPU, `64Mi` memory
- Web limits: `250m` CPU, `256Mi` memory

This is reasonable for the current small app and single Droplet. Review it if:

- pods restart with `OOMKilled`;
- CPU throttling appears during normal use;
- API response time gets noticeably worse;
- the database is healthy but requests still feel slow.

Useful checks:

```bash
kinti -n kinti-prod describe pod <pod-name>
kinti -n kinti-prod top pods
```

The Helm chart uses rolling updates with:

- `maxUnavailable: 0`
- `maxSurge: 1`
- `revisionHistoryLimit: 3`

This keeps deploys safer while avoiding unnecessary rollout history.

### Supabase Backup Awareness

Supabase daily backups are available on paid plans. According to the official Supabase backup docs, Pro projects currently get 7 days of daily backups, Team projects get 14 days, and Enterprise projects can get up to 30 days. Free projects should be backed up manually with CLI/database dumps and kept outside Supabase.

For Levko right now:

- Do not enable PITR yet. It is powerful, but it is not budget-friendly for this stage.
- If the production Supabase project is on Free, create manual logical backups regularly.
- If real users start relying on the app, upgrade the production Supabase organization to Pro before the data becomes painful to lose.

Manual backup command pattern:

```bash
supabase db dump --db-url "$DIRECT_URL" -f "backups/levko-prod-$(date +%Y-%m-%d).sql"
```

Keep production backups out of git. Store them somewhere private and separate from the server.

## Useful Production Checks

Current images:

```bash
kinti -n kinti-prod get deployment kinti-api -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
kinti -n kinti-prod get deployment kinti-web -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
```

Pods:

```bash
kinti -n kinti-prod get pods -o wide
```

API logs:

```bash
kinti -n kinti-prod logs deployment/kinti-api --tail=160
```

Helm values:

```bash
helm --kubeconfig ~/.kube/kinti-do.yaml -n kinti-prod get values kinti
```

## Troubleshooting

### API Returns 404 For New Routes

Example:

```json
{
  "message": "Cannot GET /auth/me",
  "error": "Not Found",
  "statusCode": 404
}
```

Likely cause:

- The API deployment is running an old image tag, often `latest`, while the web app expects a newer API.

Check:

```bash
kinti -n kinti-prod get deployment kinti-api -o jsonpath='{.spec.template.spec.containers[0].image}{"\n"}'
kinti -n kinti-prod logs deployment/kinti-api --tail=160
```

The Nest logs show the mapped routes on startup.

### API Returns PrismaClientKnownRequestError

Likely causes:

- Production migrations were not applied.
- The database schema does not match the deployed Prisma Client.
- Database permissions are incomplete for the Prisma user.

First check:

```bash
DATABASE_URL="$DIRECT_URL" bun --cwd apps/api prisma migrate deploy
```

### Web Config Changes Do Not Appear

Likely cause:

- The Kubernetes Secret or ConfigMap changed, but existing nginx pods did not restart.

Fix:

```bash
kinti -n kinti-prod rollout restart deployment/kinti-web
kinti -n kinti-prod rollout status deployment/kinti-web --timeout=180s
```

### Do Not Use Smart Quotes

Shell commands must use normal quotes:

```bash
"value"
```

Do not use:

```bash
“value”
```

Also make sure each line continuation `\` is the final character on the line, with no spaces after it.
