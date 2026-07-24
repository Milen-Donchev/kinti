# Security hardening checklist

## API

- Keep `WEB_ORIGIN=https://levko.bg` in production.
- Keep `DATABASE_URL` as the pooled Supabase runtime URL.
- Keep `DIRECT_URL` as the direct Supabase migration URL.
- Never accept `userId` from request bodies. Use the JWT `sub` from `AuthGuard`.
- Run migrations before deploying API images that depend on schema changes.

## Droplet

Check SSH password login:

```bash
sudo sshd -T | grep -E 'passwordauthentication|permitrootlogin|pubkeyauthentication'
```

Recommended values:

```text
passwordauthentication no
pubkeyauthentication yes
permitrootlogin prohibit-password
```

If changes are needed, edit `/etc/ssh/sshd_config` and restart SSH:

```bash
sudo systemctl restart ssh
```

Keep packages updated:

```bash
sudo apt update
sudo apt upgrade
```

Check firewall status:

```bash
sudo ufw status verbose
```

## Supabase

- Enable and monitor automatic backups according to the Supabase plan.
- Keep service role keys out of frontend, Helm values, and local committed files.
- Use least-privilege database users for runtime.
- Use the owner/postgres connection only for migrations and privileged maintenance.

## Monitoring

- Keep an external uptime monitor for `https://levko.bg`, `https://levko.bg/api/health`, and `https://levko.bg/api/health/db`.
- Review application logs after each deployment.
- Review Supabase connection and query metrics after traffic changes.
