# Security Policy

## Supported Versions

We support the latest release of evalmark (the newest `v1.x.y`, which `@v1` follows) with security
fixes.

## Reporting a Vulnerability

Do not open a GitHub issue for a security problem. Instead,
[report a vulnerability](https://github.com/jboix/evalmark/security/advisories/new) privately on
GitHub, and we will look into it as soon as we can.

We appreciate any responsible disclosure. We do not offer bounties, but if you wish we will credit
you in the release notes. Before reporting, make sure you are on the latest release.

## What counts

evalmark makes these guarantees. A way around any of them is a vulnerability:

- The action writes only to the branch and the folder its inputs name, in the repository it runs
  in. It never pushes elsewhere and never writes outside the folder.
- The token never appears in a stored file, an output, a log line, a remote URL or a command line.
- On a pull request from a fork, the action pushes nothing.
- An attachment path cannot read a file outside the result file's folder.
- The dashboard runs no code from the data: stored text is shown as text, never as HTML, and the
  page allows no inline script and no other origin.
- A logo is shown only from the folder's branding files, never from an address the data names.

Some behaviour is by design and not a vulnerability:

- The dashboard is published wherever its branch is served. On GitHub Pages, it is public unless
  your plan offers private Pages. A branch is fetched by every clone of the repository.
- Redaction removes common token shapes and the strings you list in `redact`. It cannot recognize
  every secret, and it does not look inside images: do not let your harness write secrets.
- Anyone who can push to the data branch can change what the dashboard shows.

## Using evalmark safely

- Pin the action to a commit SHA (`jboix/evalmark@<sha>`), and let Dependabot update it.
- Give the job only `contents: write`, and `pull-requests: write` for the comment.
- Keep the data on a branch of its own, or a non-branch ref, when the repository is public and the
  evals touch data that should not be.
- List in `redact` any secret your harness could echo into a transcript.
