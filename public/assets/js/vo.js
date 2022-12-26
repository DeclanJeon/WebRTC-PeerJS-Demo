const peerLoockupUrl = "https://extreme-ip-lookup.com/json/?key=demo2"; // get your API Key at https://extreme-ip-lookup.com

async function handleAddPeer(config) {
    // console.log("addPeer", JSON.stringify(config));
    let peers = config.peers;
    let peerArr = Object.entries(peers);
    sessionStorage.setItem("peerArr", JSON.stringify(peerArr));
}

function getSessionPeer() {
    let peerList = [];
    const peerArr = JSON.parse(sessionStorage.getItem("peerArr"));
    if (peerArr.length > 0) {
        peerArr.forEach((peer) => {
            peerList.push(peer[1]);
        });
    }
    return peerList;
}

/**
 * Get peer info using DetecRTC
 * https://github.com/muaz-khan/DetectRTC
 * @returns {object} peer info
 */
function getPeerInfo() {
    return {
        detectRTCversion: DetectRTC.version,
        isWebRTCSupported: DetectRTC.isWebRTCSupported,
        isDesktopDevice: !DetectRTC.isMobileDevice,
        isMobileDevice: DetectRTC.isMobileDevice,
        osName: DetectRTC.osName,
        osVersion: DetectRTC.osVersion,
        browserName: DetectRTC.browser.name,
        browserVersion: DetectRTC.browser.version,
    };
}

/**
 * Check if there is peer connections
 * @returns {boolean} true/false
 */
function thereIsPeerConnections() {
    if (Object.keys(peerConnections).length === 0) return false;
    return true;
}

/**
 * Count the peer connections
 * @returns peer connections count
 */
function countPeerConnections() {
    return Object.keys(peerConnections).length;
}

export { handleAddPeer, getPeerInfo };
