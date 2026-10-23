import express from "express";
import { randomBytes } from "node:crypto";

export function createApp(){
    const app = express();
    const links = new Map<string, string>();
    const visitCounts = new Map<string, number>();

    app.use(express.json());

    app.get("/health", (_req, res) => {
        res.json({status: "ok", version: process.env.RENDER_GIT_COMMIT ?? "local"});
    });

    app.post("/links", (req, res) => {
        const url = req.body?.url;
        if (typeof url !== "string" || !URL.canParse(url)){
            res.status(400).json({error: "Body must include a valid url"});
            return;
        }
        const code = randomBytes(4).toString("hex");
        links.set(code, url);
        visitCounts.set(code, 0);
        res.status(201).json({code, shortUrl: `/${code}`});
    });

    app.get("/links/:code/stats", (req, res) => {
        const visits = visitCounts.get(req.params.code);
        if (visits === undefined) {
            res.status(404).json({error: "Link not found"});
            return;
        }
        res.json({code: req.params.code, visits});
    });

    app.get("/:code", (req, res)=> {
        const url = links.get(req.params.code);
        if (!url) {
            res.status(404).json({error: "Link not found"});
            return;
        }
        visitCounts.set(req.params.code, (visitCounts.get(req.params.code) ?? 0) + 1);
        res.redirect(302, url);
    });
    
    return app
}