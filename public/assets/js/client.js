"use strict";

import { socket } from "./socketConnection.js";
import { peer } from "./peerConnection.js";
import { handlerMute } from "./mute.js";
import { constraints, displayMediaConfig } from "./rtc_config.js";
import { chat } from "./chat.js";
import {
    sendToServer,
    makeId,
    getConnectedDevices,
    createDom,
    selectDom,
    selectAllDom,
} from "./module.js";
import { getPeerInfo } from "./vo.js";

const shareScreenBtn = document.getElementById("shareScreen");
const showChat = selectDom("#showChat");

let myVideoStream;
let peers = {};
let allPeers;
let peerInfo;
let peerList = [];
let getPeers;
let myPeerId = null;
let userName = null;
let remotePeer = null;
export let currentPeer;
let currentPeerId;
let captureStream = null;
let myScreenStream = null;
let local__video;
let needToCreateOffer = false; // after session description answer

/** Use Status */
let useAudio = true;
let useVideo = true;

let camera = "user"; // user = front-facing camera on a smartphone. | environment = the back camera on a smartphone.

let myVideoChange = false;
let myHandStatus = false;
let myVideoStatus = false;
let myAudioStatus = false;
let myScreenStatus = false;
let mySocketId = null;
let myPeerName = null;

// VideoTrack, AudioTrack
let camVideoTrack = null;
let camAudioTrack = null;
let videoSender = null;
let audioSender = null;
let peerConnection = null; // RTCPeerConnection
let peerConnections = {}; // keep track of our peer connections, indexed by peer_id == socket.io id

let peerMediaElements = {};

let conn = null;
let conns = [];

let localMediaStream; // my microphone / webcam
let remoteMediaStream; // peers microphone / webcam

let video_storage = [];

const isWebRTCSupported = DetectRTC.isWebRTCSupported;
const isMobileDevice = DetectRTC.isMobileDevice;
const myBrowserName = DetectRTC.browser.name;

// video: { facingMode: "user" }
// facingMode: { exact: "environment" }
// 참고 : https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia

peer.on("open", async (id) => {
    peerList.push(id);
    myPeerId = id;

    local__video = selectDom("#local__video");
    if (local__video) {
        local__video.classList.add(id);
    }

    console.log("voice chat on!");

    sessionStorage.setItem("peer-name", myPeerName);
    sessionStorage.setItem("peer-id", myPeerId);
    sessionStorage.setItem("socket-id", mySocketId);

    if (!myVideoStream) {
        await joinToChannel();
    }
    await videoCall();
});

async function videoCall() {
    getConnectedDevices();

    const stream = await navigator.mediaDevices
        .getUserMedia(constraints)
        .catch((err) => {
            alert(err.message);
        });

    const lVideo = createDom("video");
    lVideo.id = "local__video";
    lVideo.muted = true;
    lVideo.volume = 0;

    let nameInterval = setInterval(() => {
        if (myPeerName !== null || myPeerName !== "") {
            lVideo.classList.add(myPeerName, peer.id);
            clearInterval(nameInterval);
        }
    }, 100);

    myVideoStream = stream;
    addVideoStream(lVideo, stream);
    handlerMute(stream);

    try {
        peer.on("call", (call) => {
            console.log("peer Call");

            const video = createDom("video");
            video.id = "remote__video";
            remotePeer = call.peer;

            getPeers = JSON.parse(sessionStorage.getItem("peerArr"));

            getPeers.forEach((peer) => {
                if (peer[1].peer_id === call.peer) {
                    video.classList.add(peer[1].peer_name, remotePeer);
                }
            });

            call.answer(stream);

            call.on("stream", (userVideoStream) => {
                if (!peerList.includes(call.peer)) {
                    currentPeer = call.peerConnection;
                    currentPeerId = call.peer;
                    userName = video.classList[0];
                    addVideoStream(video, userVideoStream);
                }
            });
        });

        peer.on("close", () => {
            console.log("Peer Close");
        });

        peer.on("disconnected", () => {
            console.log("Peer Disconnected");
        });

        peer.on("error", (e) => {
            console.error(e.message);
        });
    } catch (err) {
        console.log(err.message);
    }
}

socket.on("user-connected", async (config) => {
    if (myPeerName !== config.peer_name) {
        userName = config.peer_name;
    }

    const userId = config.peer_id;
    console.log(config);
    await connectToNewUser(userId, userName, myVideoStream);
});

async function connectToNewUser(userId, userName, stream) {
    console.log("Connect To New User...");
    const call = await peer.call(userId, stream);

    if (call !== undefined) {
        const video = createDom("video");
        video.setAttribute("id", "remote__video");
        call.on("stream", (userVideoStream) => {
            if (!peerList.includes(call.peer)) {
                video.classList.add(userName, call.peer);
                remotePeer = call.peer;
                addVideoStream(video, userVideoStream);
                currentPeer = call.peerConnection;
                currentPeerId = call.peer;
                peerList.push(call.peer);
            }
        });

        call.on("close", () => {
            video.remove();
        });

        call.on("disconnected", () => {
            console.log("Call Peer Disconnected");
        });

        peers[userId] = call;
    }
}

let peerInterval = setInterval(() => {
    if (remotePeer !== null) {
        conn = peer.connect(`${remotePeer}`);
        conn.on("open", () => {
            // here you have conn.id
            conn.send("hi!");
        });

        conns.push(conn);
        clearInterval(peerInterval);
    }
}, 500);

peer.on("connection", (conn) => {
    conn.on("data", (data) => {
        console.log(data);
    });
});

function addVideoStream(elem, stream) {
    const videoGrid = selectDom("#video-grid");

    if (elem.tagName === "VIDEO") {
        elem.srcObject = stream;
        elem.setAttribute("playsinline", true);

        elem.addEventListener("loadedmetadata", () => {
            console.log(
                "The duration and dimensions " +
                    "of the media and tracks are now known. "
            );
            elem.play();
        });

        const videoCtr = createDom("div");
        const nameSpan = createDom("span");
        videoCtr.id = "video__container";
        nameSpan.id = "userName";
        videoCtr.append(elem, nameSpan);

        getPeerMediaElements(videoCtr);

        videoGrid.append(videoCtr);

        if (elem.id === "local__video") {
            nameSpan.textContent = myPeerName;
        } else {
            nameSpan.textContent = userName;
        }
    }

    selectAllDom("#video__container").forEach((elem) => {
        if (elem.children.length === 0 || elem.children.length === 1) {
            elem.remove();
        }
    });
}

const getPeerMediaElements = (elem) => {
    const peerId = sessionStorage.getItem("peer-id");
    peerMediaElements[peerId] = elem;
    console.log(peerMediaElements[peerId]);
};

/************************** Cam GUI ********************************** */
// const stopRtc = () => {
//     const lVideo = selectDom("#local__video");
//     if (myVideoStream)
//         myVideoStream.getTracks().forEach((track) => track.stop());
//     lVideo.style.setProperty("display", "none");
// };
// const runRtc = (constraints) => {
//     const lVideo = selectDom("#local__video");
//     stopRtc();
//     navigator.mediaDevices
//         .getUserMedia(constraints)
//         .then((mediaStream) => {
//             lVideo.style.setProperty("display", "block");
//             stream = window.stream = mediaStream;
//             lVideo.srcObject = mediaStream;
//             lVideo.play();
//         })
//         .catch((err) => {
//             if (
//                 err.name == "NotFoundError" ||
//                 err.name == "DevicesNotFoundError"
//             ) {
//                 //required track is missing
//             } else if (
//                 err.name == "NotReadableError" ||
//                 err.name == "TrackStartError"
//             ) {
//                 //webcam or mic are already in use
//             } else if (
//                 err.name == "OverconstrainedError" ||
//                 err.name == "ConstraintNotSatisfiedError"
//             ) {
//                 alert(
//                     "Please check the resolution supported by the camcorder. The selected resolution is not supported."
//                 );
//                 //constraints can not be satisfied by avb. devices
//             } else if (
//                 err.name == "NotAllowedError" ||
//                 err.name == "PermissionDeniedError"
//             ) {
//                 //permission denied in browser
//             } else if (err.name == "TypeError" || err.name == "TypeError") {
//                 //empty constraints object
//             } else {
//                 //other errors
//             }
//         });
// };
// const setConstraints = (w, h, mode) => {
//     let constraints;

//     if (mode === null) {
//         constraints = {
//             audio: false,
//             video: {
//                 width: { exact: w },
//                 height: { exact: h },
//                 facingMode: { exact: mode },
//             },
//         };
//     } else {
//         constraints = {
//             audio: false,
//             video: {
//                 width: { exact: w },
//                 height: { exact: h },
//             },
//         };
//     }

//     return constraints;
// };

// const params = {
//     runQVGA: () => runRtc(setConstraints(320, 240, null)),
//     runVGA: () => runRtc(setConstraints(640, 480, null)),
//     runWVGA: () => runRtc(setConstraints(800, 480, null)),
//     runSVGA: () => runRtc(setConstraints(800, 600, null)),
//     runXGA: () => runRtc(setConstraints(1024, 768, null)),
//     runSXGA: () => runRtc(setConstraints(1280, 1024, null)),
//     runUXGA: () => runRtc(setConstraints(1600, 1200, null)),
//     runQXGA: () => runRtc(setConstraints(2048, 1536, null)),

//     rtcFront: () => runRtc(setConstraints(640, 480, "user")),
//     rtcBack: () => runRtc(setConstraints(640, 480, "environment")),
//     stopRTC: () => stopRtc(),
// };
// const gui = new dat.GUI();
// const rtcFolder = gui.addFolder("WebRTC");

// rtcFolder.add(params, "runQVGA").name("QVGA(320x240)");
// rtcFolder.add(params, "runVGA").name("VGA(640x480)");
// rtcFolder.add(params, "runWVGA").name("WVGA(800x480)");
// rtcFolder.add(params, "runSVGA").name("SVGA(800x600)");
// rtcFolder.add(params, "runXGA").name("XGA(1024x768)");
// rtcFolder.add(params, "runSXGA").name("SXGA(1280x1024)");
// rtcFolder.add(params, "runUXGA").name("UXGA(1600x1200)");
// rtcFolder.add(params, "runQXGA").name("QXGA(2048x1536)");
// rtcFolder.add(params, "rtcFront").name("Camera Front");
// rtcFolder.add(params, "rtcBack").name("Camera Back");
// rtcFolder.add(params, "stopRTC").name("Stop Stream");
// rtcFolder.open();
/************************** Cam GUI END ****************************** */

/************************** Screen Share Code ************************ */

const shareScreen = async () => {
    let screenActivate = false;
    try {
        captureStream = await getDisplayMedia(displayMediaConfig);
        myScreenStream = captureStream;
    } catch (err) {
        console.error("unable to get display media: " + err.message);
    }

    local__video = selectDom("#local__video");

    video_storage.push(local__video.srcObject);
    local__video.srcObject = captureStream;

    if (currentPeer !== undefined) {
        replaceStream(currentPeer, myScreenStream);
        screenActivate = true;
    } else {
        alert("Current Peer is Empty.");
        local__video.srcObject = video_storage[0];
    }

    captureStream.getVideoTracks()[0].addEventListener("ended", () => {
        local__video.srcObject = video_storage[0];
        if (currentPeer !== undefined) {
            replaceStream(currentPeer, video_storage[0]);
            screenActivate = false;
            video_storage = [];
        }
    });
};

async function getDisplayMedia(options) {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia(options);
    }
    if (navigator.mediaDevices.getDisplayMedia) {
        return navigator.mediaDevices.getDisplayMedia(options);
    }
    if (navigator.mediaDevices.webkitGetDisplayMedia) {
        return navigator.mediaDevices.webkitGetDisplayMedia(options);
    }
    if (navigator.mediaDevices.mozGetDisplayMedia) {
        return navigator.mediaDevices.mozGetDisplayMedia(options);
    }
    throw new Error("getDisplayMedia is not defined");
}

/************************** Screen Share End ************************ */

/*************************** Common Modules ************************* */

export function replaceStream(peerConnection, mediaStream) {
    for (let sender of peerConnection.getSenders()) {
        if (sender.track.kind == "video") {
            if (mediaStream.getVideoTracks().length > 0) {
                sender.replaceTrack(mediaStream.getVideoTracks()[0]);
            }
        }

        if (sender.track.kind == "audio") {
            if (mediaStream.getAudioTracks().length > 0) {
                sender.replaceTrack(mediaStream.getAudioTracks()[0]);
            }
        }
    }
}

function errorMsg(msg, error) {
    console.log(msg, error);
}

/**
 * Send async data through RTC Data Channels
 * @param {object} config data
 */
async function sendToDataChannel(config) {
    if (
        thereIsPeerConnections() &&
        typeof config === "object" &&
        config !== null
    ) {
        for (let peer_id in chatDataChannels) {
            if (chatDataChannels[peer_id].readyState === "open")
                await chatDataChannels[peer_id].send(JSON.stringify(config));
        }
    }
}

/**
 * On Body load Get started
 */

async function initClientPeer() {
    if (!isWebRTCSupported) {
        return userLog("error", "This browser seems not supported WebRTC!");
    }

    peerInfo = getPeerInfo();

    console.log("01. Connecting to signaling server");
    const transport = socket.io.engine.transport.name; // in most cases, "polling"
    console.log("02. Connection transport", transport);

    // Check upgrade transport
    socket.io.engine.on("upgrade", () => {
        const upgradedTransport = socket.io.engine.transport.name; // in most cases, "websocket"
        console.log("Connection upgraded transport", upgradedTransport);
    });

    await socket.on("connect", handleConnect);
    await socket.on("addPeer", handleAddPeer);
    await socket.on("disconnect", handleDisconnect);
    await socket.on("removePeer", handleRemovePeer);
}

/**
 * Connected to Signaling Server. Once the user has given us access to their
 * microphone/cam, join the channel and start peering up
 */
async function handleConnect() {
    console.log("03. Connected to signaling server");

    mySocketId = socket.id;
    console.log("04. My Socket id [ " + mySocketId + " ]");

    // myPeerName = prompt("Input the Name");

    if (myPeerName === null || myPeerName === "") {
        myPeerName = makeId(10);
    }
}

async function handleAddPeer(config) {
    // console.log("addPeer", JSON.stringify(config));
    let peers = config.peers;
    let peerArr = Object.entries(peers);
    sessionStorage.setItem("peerArr", JSON.stringify(peerArr));
}

/**
 * join to channel and send some peer info
 */
async function joinToChannel() {
    const roomId = ROOM_ID;
    console.log("05. join to channel", roomId);

    sessionStorage.setItem("channel", roomId);

    await sendToServer("join", {
        channel: roomId,
        peerName: myPeerName,
        peer_id: peer.id,
        peer_info: peerInfo,
        socket_id: mySocketId,
    });
}

function handleDisconnect(reason) {
    console.log("Disconnected from signaling server", { reason: reason });
}

function handleRemovePeer(config) {
    console.log("Signaling server said to remove peer:", config);
    let remoteVideos = null;
    if (peers[config.peer_name]) peers[config.peer_name].close();

    if (
        config.peer_id !== "" ||
        config.peer_id !== null ||
        config.peer_id !== undefined
    ) {
        remoteVideos = selectAllDom("#remote__video");
        remoteVideos.forEach((item) => {
            if (item.classList.value.includes(config.peer_id)) {
                item.remove();
                peerList.pop(config.peer_id);
            }
        });

        conns.forEach((item) => {
            if (item.peer === config.peer_id) {
                conns.pop(item.peer);
            }
        });
    }

    selectAllDom("#video__container").forEach((elem) => {
        if (elem.children.length === 0 || elem.children.length === 1) {
            elem.remove();
        }
    });
}

/*************************** Common Modules End ************************* */

initClientPeer();

shareScreenBtn.addEventListener("click", shareScreen);
showChat.addEventListener("click", chat);
