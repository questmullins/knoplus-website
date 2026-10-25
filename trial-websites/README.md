# Client website trials

Place each real client website in its own folder here, with an `index.html` and relative assets. Templates remain in `nextjs-elements/public/templates`.

The build copies this directory to `/trials/`. The Worker checks the signed-in account and its project grant before serving **every** trial request, including photographs, scripts and styles. The old Houseplant Nation URL is also protected and redirects to its new location after sign-in.

Do not put passwords, email allowlists, client feedback or private documents here. This repository's visibility applies to source files and Git history; the website sign-in protects the deployed trial routes, not GitHub's source viewer. If a future trial's source itself must be confidential, use a private repository.

## Add a trial

1. Add `trial-websites/project-slug/index.html` and its assets.
2. Publish through the existing GitHub/Cloudflare workflow.
3. Sign in at `https://kno.plus/clients/` as administrator.
4. Add the project using the same slug and `/trials/project-slug/` as its trial address.
5. Add a client or grant an existing account access. Share its credentials privately.

## Updates and passwords

The client workspace lets administrators post dated project updates, create clients, grant/remove access and disable accounts. Clients only receive their assigned projects and updates.

“Request a password reset” records a request in the administrator workspace. It does **not** automatically send an email. The administrator creates a one-time link, valid for one hour, and shares it privately. Using that link replaces the password and revokes all sessions. Issuing a link also signs out existing sessions.

The database is Cloudflare D1 `knoplus-clients`, bound as `CLIENT_DB`. Password hashes, session hashes and grants are stored there, never in this repository. The initial administrator's credentials are in a local ignored file supplied to the owner; no bootstrap endpoint exists on the website.

The public consulting folder is deliberately empty. Add future public consulting items in `nextjs-elements/app/revamp/services.ts`; private client progress belongs in the client workspace.
