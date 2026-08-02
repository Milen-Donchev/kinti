# Auth Configuration

Levko uses Supabase Auth in the web app. Both email confirmation and Google OAuth should redirect through the frontend callback route:

- Production callback: `https://levko.bg/auth/callback`
- Production confirm fallback: `https://levko.bg/auth/confirm`
- Local callback: `http://localhost:5173/auth/callback`
- Local confirm fallback: `http://localhost:5173/auth/confirm`

## Supabase URL Configuration

In Supabase Dashboard, open Authentication -> URL Configuration.

Recommended production values:

- Site URL: `https://levko.bg`
- Redirect URLs:
  - `https://levko.bg/auth/callback`
  - `https://levko.bg/auth/confirm`
  - `https://www.levko.bg/auth/callback`
  - `https://www.levko.bg/auth/confirm`
  - `http://localhost:5173/auth/callback`
  - `http://localhost:5173/auth/confirm`

## Email Templates

Prefer Supabase's default `{{ .ConfirmationURL }}` template when possible.

If using a custom confirmation link with token hash, point it to the callback URL:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">
  Confirm email address
</a>
```

The app supports both `/auth/callback` and `/auth/confirm` for compatibility.

## Google OAuth

In Supabase Dashboard, open Authentication -> Providers -> Google and enable the provider.

In Google Cloud, create an OAuth Client ID with application type `Web application`.

Authorized JavaScript origins:

- `https://levko.bg`
- `http://localhost:5173`

Authorized redirect URIs:

- Use the callback URL shown in the Supabase Google provider page.
- For production Supabase project this usually looks like:
  `https://<project-ref>.supabase.co/auth/v1/callback`

Then copy the Google Client ID and Client Secret back into the Supabase Google provider settings.
