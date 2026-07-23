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
curl -i http://46.101.230.169.sslip.io/
curl -i http://46.101.230.169.sslip.io/api/health
curl -i http://46.101.230.169.sslip.io/api/health/db
```

For authenticated endpoints, test through the web app or with a valid Supabase access token.

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
