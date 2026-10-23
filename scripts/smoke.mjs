// Usage: node scripts/smoke.mjs <base-url> [expected-version]
const [baseUrl, expectedVersion] = process.argv.slice(2);
if (!baseUrl) {
  console.error("Usage: node scripts/smoke.mjs <base-url> [expected-version]");
  process.exit(1);
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForVersion() {
  const deadline = Date.now() + 10 * 60 * 1000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${baseUrl}/health`);
      const body = await res.json();
      if (res.ok && (!expectedVersion || body.version === expectedVersion)) {
        console.log(`Healthy, running version ${body.version}`);
        return;
      }
      console.log(`Waiting: running version ${body.version}`);
    } catch (error) {
      console.log(`Waiting: ${error.message}`);
    }
    await sleep(15_000);
  }
  throw new Error("Timed out waiting for the new version to go live");
}

async function checkShortLink() {
  const target = "https://www.freecodecamp.org";
  const created = await fetch(`${baseUrl}/links`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: target }),
  });
  if (created.status !== 201) {
    throw new Error(`POST /links returned ${created.status}`);
  }
  const { shortUrl } = await created.json();

  const followed = await fetch(`${baseUrl}${shortUrl}`, { redirect: "manual" });
  if (followed.status !== 302 || followed.headers.get("location") !== target) {
    throw new Error(`Redirect check failed with status ${followed.status}`);
  }
  console.log("Short link round trip works");
}

await waitForVersion();
await checkShortLink();