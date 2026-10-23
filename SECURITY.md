# Security Policy

## Reporting a vulnerability

Please report security issues **privately** through GitHub Security
Advisories for this repository:

https://github.com/changvn2002/dichbome/security/advisories/new

Do not open a public issue for a vulnerability. Reports are read by the
maintainer; expect an acknowledgement, an assessment, and a fix or a
reasoned response. There is no bug-bounty program.

Machine-readable contact (RFC 9116): `/.well-known/security.txt` on the
production site.

## Scope notes

- The app has **no accounts and no sign-in**. Browsing history, saved
  results and preferences live only in the visitor's own browser
  storage — there is no user database to breach.
- The translate API accepts a small, strictly validated JSON body
  (unknown fields are rejected) and stores nothing server-side.
- Brand assets are excluded from the MIT license — see `NOTICE`.
