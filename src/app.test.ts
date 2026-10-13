import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app";

describe("link shortener", () => {
    it("reports health", async () => {
        const res = await request(createApp()).get("/health");
        expect(res.status).toBe(200);
        expect(res.body.status).toBe("ok");
    });

    it("creates a short link and redirects to it", async ()=> {
        const app = createApp();
        const created = await request(app)
            .post("/links")
            .send({url: "https://www.freecodecamp.org"});
        expect(created.status).toBe(201);

        const followed = await request(app).get(created.body.shortUrl);
        expect(followed.status).toBe(302);
        expect(followed.headers.location).toBe("https://www.freecodecamp.org");
    });

    it("rejects an invalid url", async () => {
        const res = await request(createApp()).post("/links").send({ url: "nope" });
        expect(res.status).toBe(400);
    });

    it("returns 404 for an unknown code", async () => {
        const res = await request(createApp()).get("/doesnotexist");
        expect(res.status).toBe(404);
    });
})