let saveIceServer = [];
let iceServers;

const getIceServers = async () => {
    let result = await axios.get("/api/v1/getIceServer");
    return saveIceServer.push(result.data.iceServers);
};

getIceServers();

if (saveIceServer.length > 0) {
    iceServers = saveIceServer[0];
}

const peer = new Peer(undefined, {
    initiator: true,
    trickle: false,
    config: {
        iceServers: iceServers,
        sdpSemantics: "unified-plan",
    },
});

export { peer };
