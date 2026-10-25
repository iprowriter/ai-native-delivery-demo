# AI-native delivery demo

A small link shortener API, built to show how AI agents can ship code safely
inside a normal GitHub workflow. You label an issue, an agent opens a pull
request, an AI reviewer checks it, and CI makes sure the agent didn't break
any rules before anything reaches `main`.

The app itself is kept small on purpose. The interesting part is the delivery
pipeline in [`.github/workflows`](.github/workflows).

## The API

Express 5 and TypeScript. Links are stored in memory, so they reset whenever
the server restarts.

| Method | Path                 | What it does                                        |
| ------ | -------------------- | --------------------------------------------------- |
| `GET`  | `/health`            | Returns `{ status, version }`                       |
| `POST` | `/links`             | Takes `{ "url": "..." }`, returns `{ code, shortUrl }` |
| `GET`  | `/:code`             | Redirects (302) to the original URL                 |
| `GET`  | `/links/:code/stats` | Returns how many times the link was visited         |

```bash
curl -X POST localhost:3000/links \
  -H "content-type: application/json" \
  -d '{"url":"https://www.freecodecamp.org"}'
# {"code":"3f9a1c2b","shortUrl":"/3f9a1c2b"}
```

## Run it locally

You need Node.js 22.

```bash
npm install
npm run dev        # starts on http://localhost:3000
npm run check      # lint, typecheck and tests
```

## The delivery pipeline

| Workflow          | Runs when                                | What it does                                                                                     |
| ----------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `agent.yml`       | An issue gets the `agent` label, or someone mentions `@claude` | Claude Code works on the issue and opens a pull request          |
| `ci.yml`          | Every pull request and push to `main`    | Runs lint, typecheck and tests, and blocks agent branches from changing protected files          |
| `ai-review.yml`   | Every pull request                       | Claude reviews the change against [`CLAUDE.md`](CLAUDE.md) and fails the check on blocking issues |
| `deploy.yml`      | Push to `main`                           | Deploys to Render, then runs a smoke test against the new version                                |
| `smoke.yml`       | Every 6 hours                            | Checks production is up and opens an issue if it isn't                                           |

The rules the agent follows live in [`CLAUDE.md`](CLAUDE.md). The
`protected-paths` job in CI enforces the most important rule: agent branches
(`claude/*`) can't change `.github/`, `CLAUDE.md` or `package-lock.json`.

## Using it in your own repo

1. Fork the repo.
2. Add a `CLAUDE_CODE_OAUTH_TOKEN` repository secret (run `claude setup-token`
   to get one).
3. Create an `agent` label, open an issue, and apply the label.

Deploys are optional. `deploy` and `smoke` skip themselves until you set them
up. To turn them on, add a `RENDER_DEPLOY_HOOK_URL` secret and a
`PRODUCTION_URL` variable.
