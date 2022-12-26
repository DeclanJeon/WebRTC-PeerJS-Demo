const peer = new Peer(undefined, {
    initiator: true,
    trickle: false,
    config: {
        iceServers: [
            { url: "stun:stun.l.google.com:19302" },
            {
                url: "turn:35.181.134.238:3478",
                username: "owake",
                credential: "1234",
            },
        ],
        sdpSemantics: "unified-plan",
    },
});

export { peer };
