import { socket } from "./socketConnection.js";

let isHttps = false;
let body = document.body;

const groupBy = (data, key) => {
    return data.reduce(function (carry, el) {
        let group = el[key];

        if (carry[group] === undefined) {
            carry[group] = [];
        }

        carry[group].push(el);

        return carry;
    }, {});
};

/**
 * Generate random Room id if not set
 * @returns {string} Room Id
 */
function getRoomId() {
    const signalingServer = window.location.href;

    let roomId = makeId(5);
    const newUrl = signalingServer + roomId;
    window.history.pushState({ url: newUrl }, roomId, newUrl);
    return roomId;
}

/**
 * Generate random Id
 * @param {integer} length
 * @returns {string} random id
 */
function makeId(length) {
    let result = "";
    let characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    return result;
}

// 타켓 요소 끝나는 태그 바로 직전(자식요소로)에 요소를 생성 - 종료 태그 앞(자식 요소로)
function addDomBeforeEnd(dom, element) {
    if (dom === null) {
        body.insertAdjacentHTML("beforeend", element);
    } else {
        dom.insertAdjacentHTML("beforeend", element);
    }
}

// 타켓 요소 전(형제레벨)에 생성- 시작 태그의 앞(형제 레벨로)
function addDomBeforeBegin(dom, element) {
    if (dom === null) {
        body.insertAdjacentHTML("beforebegin", element);
    } else {
        dom.insertAdjacentHTML("beforebegin", element);
    }
}

// 타켓 요소 다음(자식요소)에 생성 - 시작 태그의 뒤(자식 요소로)
function addDomAfterBegin(dom, element) {
    if (dom === null) {
        body.insertAdjacentHTML("afterbegin", element);
    } else {
        dom.insertAdjacentHTML("afterbegin", element);
    }
}

// 타켓 요소의 끝나는 태그 바로 다음(형제레벨)에 요소를 생성 - 종료 태그 뒤(형제 레벨로)
function addDomAfterEnd(dom, element) {
    if (dom === null) {
        body.insertAdjacentHTML("afterend", element);
    } else {
        dom.insertAdjacentHTML("afterend", element);
    }
}

function appendDom(dom, element) {
    if (element !== undefined) {
        dom.append(element);
    }
}

function appendChildDom(dom, element) {
    if (element !== undefined) {
        dom.appendChild(element);
    }
}

function createDom(element) {
    let dom = document.createElement(element);
    return dom;
}

function selectDom(element) {
    let dom = document.querySelector(element);
    return dom;
}

function selectAllDom(element) {
    let dom = document.querySelectorAll(element);
    return dom;
}

function removeDom(element) {
    let dom = document.querySelector(element);
    dom.remove();
}

const draggable = (target) => {
    let isPress = false,
        prevPosX = 0,
        prevPosY = 0;

    if (target !== null) {
        target.onmousedown = start;
        target.onmouseup = end;

        // 상위 영역
        window.onmousemove = move;

        function start(e) {
            prevPosX = e.clientX;
            prevPosY = e.clientY;

            isPress = true;
        }

        function move(e) {
            if (!isPress) return;

            const posX = prevPosX - e.clientX;
            const posY = prevPosY - e.clientY;

            prevPosX = e.clientX;
            prevPosY = e.clientY;

            target.style.left = target.offsetLeft - posX + "px";
            target.style.top = target.offsetTop - posY + "px";
        }

        function end() {
            isPress = false;
        }
    }
};

function scrollToBottom(elem) {
    let d = document.querySelector(`.${elem}`);
    d.scrollTop = d.scrollHeight;
}

const getConnectedDevices = async () => {
    let devices = await navigator.mediaDevices.enumerateDevices();
    return devices;
};

function niceBytes(x) {
    const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let l = 0,
        n = parseInt(x, 10) || 0;

    while (n >= 1024 && ++l) {
        n = n / 1024;
    }

    return n.toFixed(n < 10 && l > 0 ? 1 : 0) + " " + units[l];
}

/**
 * Send async data to signaling server (server.js)
 * @param {string} msg msg to send to signaling server
 * @param {object} config data to send to signaling server
 */
async function sendToServer(msg, config = {}) {
    await socket.emit(msg, config);
}

export {
    getRoomId,
    makeId,
    addDomBeforeEnd,
    addDomBeforeBegin,
    addDomAfterBegin,
    addDomAfterEnd,
    appendDom,
    appendChildDom,
    createDom,
    selectDom,
    selectAllDom,
    removeDom,
    draggable,
    scrollToBottom,
    sendToServer,
    getConnectedDevices,
    niceBytes,
    groupBy,
};
