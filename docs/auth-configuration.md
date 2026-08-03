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

If confirmation emails open a dead link or redirect to the wrong place, check
this section first. The email template can generate a correct link only when the
target URL is allowed by Supabase.

## Email Templates

Use the custom confirmation template from:

```text
docs/supabase-confirm-signup-email-template.html
```

In Supabase Dashboard, open Authentication -> Email Templates -> Confirm signup
and paste the HTML.

The template intentionally sends users to the frontend callback route with the
token hash:

```html
{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email
```

This matches the frontend callback handler, which verifies the token in the
browser and then redirects the user to `/dashboard`.

For reference, the minimum confirmation link is:

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
- `https://www.levko.bg`
- `http://localhost:5173`

Authorized redirect URIs:

- Use the callback URL shown in the Supabase Google provider page.
- For production Supabase project this usually looks like:
  `https://auzgqefookfzxmbejpjx.supabase.co/auth/v1/callback`

Then copy the Google Client ID and Client Secret back into the Supabase Google provider settings.

Important distinction:

- Google Cloud redirect URI is the Supabase callback:
  `https://auzgqefookfzxmbejpjx.supabase.co/auth/v1/callback`
- Levko frontend redirect is passed from the app as:
  `https://levko.bg/auth/callback`

Supabase receives the Google OAuth callback first, then redirects the browser to
Levko's `/auth/callback` route.
