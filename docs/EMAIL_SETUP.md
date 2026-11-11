# Gmail email notifications — complete setup

The contact form always saves a message to TiDB first. The email notification
is best-effort: if Gmail is unavailable, the submission is still stored and the
visitor still sees a success message.

This guide sets up the **Gmail API over HTTPS**, which is required on Render's
free tier because Render blocks outbound SMTP ports 25, 465, and 587.

> **Never commit `server/.env`.** It is gitignored. Only the variable names are
> documented in `server/.env.example`.

---

## 1. Prepare the Gmail account

Use the mailbox that should **send** the notifications. It does not have to be
the same address as `ADMIN_EMAIL` (the recipient), but it is simplest if both
are the same Gmail account.

1. Sign in at <https://console.cloud.google.com/> with that Gmail account.
2. Accept the terms and create a project, for example `portfolio-mail`.
3. Make sure the Gmail account has 2-Step Verification enabled.

## 2. Enable the Gmail API

1. Open **APIs & Services → Library**.
2. Search for **Gmail API**.
3. Open it and click **Enable**.

## 3. Configure the OAuth consent screen

1. Open **APIs & Services → OAuth consent screen**.
2. Choose **External** as the user type.
3. Fill in:
   - **App name:** `Portfolio Contact Form`
   - **User support email:** your Gmail address
   - **Developer contact email:** your Gmail address
4. Under **Scopes**, add:
   - `openid`
   - `email`
   - `https://www.googleapis.com/auth/gmail.send`
5. Under **Test users**, add the Gmail address that will send the mail
   (needed while the app is in **Testing**).
6. Set **Publishing status** to **In production**.

   Why: while the app is in **Testing**, Google expires refresh tokens after
   7 days. **In production** keeps the token valid until you revoke it. Google
   shows an "unverified app" warning for personal apps; that is expected and
   does not block sending.

## 4. Create the OAuth client

1. Open **APIs & Services → Credentials**.
2. Click **Create credentials → OAuth client ID**.
3. Application type: **Desktop app**.
4. Name it `Portfolio API` and click **Create**.
5. Copy the **Client ID** and **Client secret**. The secret starts with
   `GOCSPX-`.

> A **Desktop app** client is required. Do not create a Web application client:
> the local setup script uses `http://127.0.0.1` as its redirect URI and
> Google treats that differently for web clients.

## 5. Put the client values in `server/.env`

From the repository root:

```env
EMAIL_USER=your-real-gmail@gmail.com
GMAIL_CLIENT_ID=1234567890-abc.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-...
EMAIL_TRANSPORT=auto
```

`EMAIL_TRANSPORT=auto` uses the Gmail API when all three OAuth values exist and
falls back to SMTP only when an App Password is configured.

## 6. Generate the refresh token once

From the `server` directory:

```bash
npm install
npm run gmail:auth
```

The script:

1. Opens Google's consent page in your browser.
2. Starts a temporary callback server on `127.0.0.1`.
3. Exchanges the authorization code for a refresh token.
4. Writes `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`,
   `EMAIL_USER`, and `EMAIL_TRANSPORT=gmail-api` into `server/.env`.

The token is never printed in the terminal.

If the browser does not open, copy the URL printed in the terminal and open it
manually. The command waits up to 10 minutes for the callback.

## 7. Verify locally

```bash
npm run email:check   # checks configuration and token refresh, sends nothing
npm run email:test    # sends one real test email
```

`email:check` should report the Gmail API transport and the authorized address.
`email:test` should arrive at `ADMIN_EMAIL`.

## 8. Add the values to Render

In the Render dashboard open the `mk-portfolio-api` service →
**Environment** and add these individually (do not replace the whole env list):

| Key | Value |
|---|---|
| `EMAIL_USER` | the sending Gmail address |
| `GMAIL_CLIENT_ID` | from step 4 |
| `GMAIL_CLIENT_SECRET` | from step 4 |
| `GMAIL_REFRESH_TOKEN` | written by `npm run gmail:auth` |
| `EMAIL_TRANSPORT` | `gmail-api` (or `auto`) |

Save the changes. Render restarts the service automatically. Then redeploy the
latest commit from **Manual Deploy → Deploy latest commit** if needed.

`EMAIL_PASS` (Gmail App Password) is **not** needed on the free tier and will
time out because SMTP is blocked. Keep it blank in production.

## 9. Verify production

1. Open <https://mk-portfolio-phi-silk.vercel.app/contact>.
2. Send a test message.
3. Confirm:
   - the form shows "Message sent successfully.";
   - the message appears in the admin inbox;
   - the notification arrives at `ADMIN_EMAIL`;
   - the Render log no longer says
     `Email is not configured — contact messages are saved but no notification email is sent.`

After a successful send, the Render log contains a Gmail API request instead of
that warning.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Email is not configured` at startup | One or more OAuth values missing/placeholder | Set all five Render variables and restart |
| `invalid_grant` | Refresh token expired, revoked, or from a different OAuth client | Rerun `npm run gmail:auth`; keep the app **In production** |
| `redirect_uri_mismatch` | OAuth client is not type **Desktop app** | Create a new Desktop app client and rerun the script |
| `Access blocked: app has not completed verification` | Sender is not a test user while the app is in **Testing** | Add the address under **Test users**, or publish the app |
| `Gmail API has not been used in project...` | Gmail API not enabled | Enable it in **APIs & Services → Library** |
| `insufficientPermissions` / 403 | `gmail.send` scope was not granted | Rerun the script and approve the send permission |
| Token works locally but not on Render | Values copied incorrectly, or `EMAIL_USER` differs | Recheck each Render variable; no quotes or spaces |

To revoke access later, visit <https://myaccount.google.com/permissions> and
remove the app, then delete `GMAIL_REFRESH_TOKEN` from Render.

## Sending limits

A free Gmail account can send roughly 500 messages per day; Google Workspace
accounts have a higher limit. This is far above normal portfolio contact-form
traffic. The API already rate-limits contact submissions to 5 per 15 minutes
per IP address.
