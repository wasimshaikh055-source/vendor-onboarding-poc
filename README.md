# First Advantage Vendor Registration Portal

A responsive, five-step supplier onboarding experience built with semantic HTML, CSS and vanilla JavaScript. The original First Advantage logo and repository artwork are retained. The original field identifiers and Power Automate attachment contract are preserved.

## What is included

- Premium responsive welcome page and five-step registration wizard.
- Company information, primary contact, compliance/tax, document uploads, and review/submit.
- Inline validation for required fields, email, website and phone number.
- Country selector, drag-and-drop uploads, file removal, 10 MB per-file and 20 MB total upload limits, with file-type checks.
- Form values auto-saved in browser local storage; selected documents are saved in IndexedDB on the same device.
- Review/edit controls and a success page shown only after an accepted HTTP response.
- Node.js server-side proxy. The Power Automate trigger URL is read from a server environment variable and is never sent to the browser.

## Original integration contract

The previous application posted a JSON object containing the original form keys:

`companyName`, `businessName`, `registrationNumber`, `country`, `website`, `contactName`, `jobTitle`, `email`, `phone`, `taxNumber`, `gst`, and `attachments`.

Each attachment remains `{ name, type, size, content }`, where `content` is the Base64 file content without the data-URL prefix. The former `supportingDocs` browser `File[]` is converted into the `attachments` array and is not sent as a separate field. The proxy forwards this JSON payload to Power Automate unchanged.

Document categories are used to organise uploads in the portal UI. The legacy attachment schema does not contain a category property, so category labels are not sent to the existing flow; filenames and file content are forwarded as before. If the downstream process needs category-level routing, extend and test the Power Automate trigger schema before adding a category property to the payload.

The exact response schema of the existing flow was not documented in the source repository. The frontend checks HTTP success and rejects explicit `success:false`, `status:"failed"` or `status:"error"` responses. If the flow returns a reference, the portal recognizes `registrationReference`, `referenceNumber`, `reference`, or `id`. Confirm these response conventions with the flow owner before production.

## Local setup (frontend + proxy)

Requirements: Node.js 18 or later.

1. Copy `.env.example` to `.env` (or set the variables in your hosting provider).
2. Set `POWER_AUTOMATE_URL` to the **newly rotated** Power Automate trigger URL. Do not commit `.env`.
3. Set `ALLOWED_ORIGINS` to the exact origins allowed to call this proxy.
4. Run:

   ```bash
   npm start
   ```

5. Open `http://localhost:8787`.

The frontend posts to `/api/vendor-registration` by default. The proxy forwards the request to the configured Power Automate URL and returns the upstream HTTP status/body. The proxy does not log registration payloads or the secret URL.

## GitHub Pages deployment

GitHub Pages can host the static frontend (`index.html`, `style.css`, `app.js`, `questions.js`, `config.js`, and `assets/`), but it cannot run the Node proxy or keep Power Automate secrets private.

For a production deployment:

1. Deploy `server.js` to a Node-capable host (or adapt the same proxy logic to your approved serverless platform).
2. Configure `POWER_AUTOMATE_URL` and `ALLOWED_ORIGINS` as backend environment variables.
3. Set `config.js` `submissionEndpoint` to the HTTPS proxy URL, e.g. `https://your-api.example.com/api/vendor-registration`.
4. Ensure the proxy CORS allowlist includes the exact GitHub Pages origin, e.g. `https://YOUR-USERNAME.github.io` (or your custom domain).
5. Deploy the static frontend to GitHub Pages.

Do not point the browser directly at Power Automate. Do not put the trigger URL/signature in `config.js`, `app.js`, GitHub Actions artifacts, or repository secrets that are exposed to a static build.

## Security actions required before production

- The original repository's Power Automate signature was embedded in `app.js`. Treat it as compromised and **regenerate/rotate the trigger signature** in Power Automate. Do not reuse the old signature.
- Store the newly generated URL only in the backend's `POWER_AUTOMATE_URL` environment variable.
- Use HTTPS for both frontend and proxy.
- Restrict CORS to the exact production frontend origin(s); do not use `*`.
- Confirm authentication/abuse controls, retention, file scanning, and data-protection requirements with your IT/security team. CORS is not authentication.
- Validate the exact upstream response contract with the Power Automate owner before enabling live submissions.

## Local saving and documents

Text fields and the current step are saved to local storage; selected documents are stored in IndexedDB on this device so they can be restored after a refresh in supported browsers. Clearing site data or using a different browser/device removes access to that local draft. Do not use a shared/public computer for sensitive vendor information.

## Verification

The static frontend can be opened directly for UI review, but live submission requires the Node proxy and a valid, rotated Power Automate URL. The proxy can be started without the URL; it will return an explicit 503 configuration error rather than displaying a false success.
