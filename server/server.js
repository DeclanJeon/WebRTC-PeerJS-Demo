import { Server } from "socket.io";

import express from "express";
const app = express();
import cors from "cors";
import morgan from "morgan";
import http from "http";
import https from "https";
import path from "path";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import Logger from "./Logger.js";
import fs from "fs";
import { router } from "./routes/router.js";

const log = new Logger("server");

const isHttps = false; // must be the same on client.js
const port = process.env.PORT || 3000; // must be the same to client.js signalingServerPort

let channels = {}; // collect channels
let sockets = {}; // collect sockets
let peers = {}; // collect peers info grp by channels

let io, server, host;

const options = {
    key: fs.readFileSync(
        path.join(__dirname, "../public/ssl/key.pem"),
        "utf-8"
    ),
    cert: fs.readFileSync(
        path.join(__dirname, "../public/ssl/cert.pem"),
        "utf-8"
    ),
};

if (isHttps) {
    server = https.createServer(app);
    host = "http://" + "localhost" + ":" + port;
} else {
    server = https.createServer(options, app);
    host = "https://" + "localhost" + ":" + port;
}

server = https.createServer(options, app);
host = "https://" + "localhost" + ":" + port;

// directory
const dir = {
    public: path.join(__dirname, "../", "public"),
    assets: path.join(__dirname, "../", "public/assets"),
    views: path.join(__dirname, "../", "public/src/views"),
    module: path.join(__dirname, "../", "node_modules"),
};

app.set("view engine", "ejs");
app.set("views", dir.views);

app.use(router);

app.use(morgan("dev"));
app.use(express.json()); // Api parse body data as json
app.use(express.urlencoded({ extended: true })); // urlencoded

// dir Access
app.use(express.static(dir.public)); // Use all static files from the public folder
app.use(express.static(dir.assets));
app.use(express.static(dir.module));

app.use(
    cors({
        origin: "*",
        credential: true,
    })
);

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.setHeader("Access-Control-Allow-Credentials", true);
    res.setHeader("Access-Control-Max-Age", "3600");

    next();
});

io = new Server({
    maxHttpBufferSize: 1e7,
    cors: {
        // Front Domain
        origin: "*",
        methods: ["GET", "POST"],
        transports: ["websocket", "polling"],
        credentials: true,
    },
    allowEIO3: true,
}).listen(server);

io.sockets.on("connect", async (socket) => {
    const ip =
        socket.request.headers["x-forwarded-for"] ||
        socket.request.connection.remoteAddress;

    log.debug("[" + socket.id + "] connection accepted", {
        host: socket.handshake.headers.host.split(":")[0],
        ip: ip,
    });

    socket.channels = {};

    sockets[socket.id] = socket;

    const transport = socket.conn.transport.name; // in most cases, "polling"
    log.debug("[" + socket.id + "] Connection transport", transport);

    const count = io.engine.clientsCount;

    log.debug(`[ ${count} ] Access Socket Client`);

    /**
     * Check upgrade transport
     */
    socket.conn.on("upgrade", () => {
        const upgradedTransport = socket.conn.transport.name; // in most cases, "websocket"
        log.debug(
            "[" + socket.id + "] Connection upgraded transport",
            upgradedTransport
        );
    });

    socket.on("disconnect", async (reason) => {
        for (let channel in socket.channels) {
            await removePeerFrom(channel);
        }
        log.debug("[" + socket.id + "] disconnected", { reason: reason });
        delete sockets[socket.id];
    });

    socket.on("error", (error) => {
        log.debug("[" + socket.id + "] error", { error: error });
    });

    socket.on("join", async (config) => {
        log.debug("[" + socket.id + "] join ", config);

        let channel = config.channel;
        let peerId = config.peer_id;
        let peer_name = config.peerName;
        let peer_info = config.peer_info;
        let socket_id = config.socket_id;

        if (channel in socket.channels) {
            return log.debug(
                "[" + peer_name + "] [Warning] already joined",
                channel
            );
        }

        // no channel aka room in channels init
        if (!(channel in channels)) channels[channel] = {};

        // no channel aka room in peers init
        if (!(channel in peers)) peers[channel] = {};

        // collect peers info grp by channels
        peers[channel][socket_id] = {
            socket_id: socket_id,
            peer_id: peerId,
            peer_name: peer_name,
            peer_info: peer_info,
            video_status: true,
            audio_status: true,
        };

        log.debug("[Join] - connected peers grp by roomId", peers);

        await socket.join(channel);

        await addPeerTo(channel);

        channels[channel][peerId] = socket;
        socket.channels[channel] = channel;

        const socket_msg = "user-connected";

        sendToRoom(channel, socket_id, socket_msg, peers[channel][socket_id]);
    });

    socket.on("message", (config) => {
        console.log(config);
        const socketId = config.socket_id;
        const channel = config.channel;

        const socket_msg = "receiveMsg";

        sendToRoom(channel, socketId, socket_msg, config);
    });

    // socket.on("status")

    /**
     * Add peers to channel
     * @param {string} channel room id
     */
    async function addPeerTo(channel) {
        for (let id in channels[channel]) {
            // offer false
            await channels[channel][id].emit("addPeer", {
                peer_id: socket.id,
                peers: peers[channel],
                should_create_offer: false,
            });
            // offer true
            socket.emit("addPeer", {
                peer_id: id,
                socket_id: socket.id,
                peers: peers[channel],
                should_create_offer: true,
            });
            log.debug("[" + socket.id + "] emit addPeer [" + id + "]");
        }
    }

    /**
     * Remove peers from channel aka room
     * @param {*} channel
     */
    async function removePeerFrom(channel) {
        if (!(channel in socket.channels)) {
            log.debug("[" + socket.id + "] [Warning] not in ", channel);
            return;
        }

        log.debug("connected peers grp by roomId", peers);

        try {
            for (let id in channels[channel]) {
                await channels[channel][id].emit("removePeer", {
                    peer_id: peers[channel][socket.id].peer_id,
                });
                log.debug("[" + socket.id + "] emit removePeer [" + id + "]");
            }
        } catch (err) {
            log.debug(err.message);
        }

        try {
            switch (Object.keys(peers[channel]).length) {
                case 0:
                    // last peer disconnected from the room without room status set, delete room data
                    delete peers[channel];
                    break;
                case 1:
                    // last peer disconnected from the room having room status set, delete room data
                    if ("Locked" in peers[channel]) delete peers[channel];
                    break;
            }
        } catch (err) {
            log.error("Remove Peer", toJson(err));
        }

        delete socket.channels[channel];
        delete channels[channel][socket.id];
        delete peers[channel][socket.id];
    }
});

/**
 * Object to Json
 * @param {object} data object
 * @returns {json} indent 4 spaces
 */
function toJson(data) {
    return JSON.stringify(data, null, 4); // "\t"
}

/**
 * Send async data to all peers in the same room except yourself
 * @param {string} room_id id of the room to send data
 * @param {string} socket_id socket id of peer that send data
 * @param {string} msg message to send to the peers in the same room
 * @param {object} config data to send to the peers in the same room
 */
async function sendToRoom(room_id, socket_id, msg, config = {}) {
    console.log(room_id, socket_id, msg, config);
    for (let id in channels[room_id]) {
        // not send data to myself
        if (id != socket_id) {
            await channels[room_id][id].emit(msg, config);
            console.log("Send to room", { msg: msg, config: config });
        }
    }
}

/**
 * Send async data to specified peer
 * @param {string} peer_id id of the peer to send data
 * @param {object} sockets all peers connections
 * @param {string} msg message to send to the peer in the same room
 * @param {object} config data to send to the peer in the same room
 */
async function sendToPeer(peer_id, sockets, msg, config = {}) {
    if (peer_id in sockets) {
        await sockets[peer_id].emit(msg, config);
        //console.log('Send to peer', { msg: msg, config: config });
    }
}

server.listen(port, null, () => {
    log.debug(
        `%c
	███████╗██╗ ██████╗ ███╗   ██╗      ███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗ 
	██╔════╝██║██╔════╝ ████╗  ██║      ██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗
	███████╗██║██║  ███╗██╔██╗ ██║█████╗███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝
	╚════██║██║██║   ██║██║╚██╗██║╚════╝╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗
	███████║██║╚██████╔╝██║ ╚████║      ███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║
	╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝      ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝ started...
	`,
        "font-family:monospace"
    );

    log.debug("settings", {
        server: host,
        node_version: process.versions.node,
    });
});
