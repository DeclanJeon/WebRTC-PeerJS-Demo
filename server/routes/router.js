import express from "express";
const router = express.Router();

import { customAlphabet } from "nanoid";
const nanoid = customAlphabet("ABCDEFG1234567890", 7);
const roomID = nanoid();

router.get("/", (req, res) => {
    res.redirect(`${roomID}`);
});

router.get("/:roomId", (req, res, next) => {
    res.render("index", {
        title: "PeerJS - WebRTC - Demo",
        roomId: req.params.roomId,
    });
});

export { router };
