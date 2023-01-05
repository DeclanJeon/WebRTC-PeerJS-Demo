import { draggable, sendToServer, scrollToBottom } from "./module.js";
import { socket } from "./socketConnection.js";

let chatActivate = false;
let msgPopup;
let date;
let file;

const chat = () => {
    chatActivate = !chatActivate;
    chatActivate ? chatEnable() : chatDisable();
};

const chatEnable = () => {
    const chatElem = `
    <div class="popup__message" hidden="false">
        <div class="popup__chat_window">
            <div class="messages" id="messages"></div>
        </div>
        <div class="popup__message_container">
            <input id="chat_message" type="text" autocomplete="off" placeholder="Type message here...">
            <div id="chat__send" class="options__button">
                <i class="fas fa-paper-plane" aria-hidden="true"></i>
            </div>
        </div>
    </div>`;

    msgPopup = document.querySelector(".popup__message");

    if (!msgPopup) {
        document.body.insertAdjacentHTML("beforeend", chatElem);

        msgPopup = document.querySelector(".popup__message");
        msgPopup.hidden = false;
        // msgPopup.style.setProperty("display", "flex");
    } else {
        // msgPopup.style.setProperty("display", "flex");
        msgPopup.hidden = false;
    }
    draggable(msgPopup);
    handleChatEvent();
};

const chatDisable = () => {
    msgPopup = document.querySelector(".popup__message");
    msgPopup.hidden = true;
    // msgPopup.style.setProperty("display", "none");
};

const handleChatEvent = () => {
    const text = document.getElementById("chat_message");
    const send = document.getElementById("chat__send");

    // const peerArr = JSON.parse(localStorage.getItem("peerArr"));

    let msgObj = {};

    send.addEventListener("click", (e) => {
        date = moment().format("YYYY/MM/DD/HH:MM");
        if (text.value.length !== 0) {
            sendToServer("message", {
                peer_name: sessionStorage.getItem("peer-name"),
                channel: sessionStorage.getItem("channel"),
                socket_id: sessionStorage.getItem("socket-id"),
                msg: text.value,
                date: date,
            });

            msgObj = {
                peer_name: sessionStorage.getItem("peer-name"),
                channel: sessionStorage.getItem("channel"),
                socket_id: sessionStorage.getItem("socket-id"),
                msg: text.value,
                date: date,
            };

            handleMessage(msgObj);
            text.value = "";
        }
    });

    text.addEventListener("keydown", (e) => {
        date = moment().format("YYYY/MM/DD/HH:MM");
        if (e.key === "Enter" && text.value.length !== 0) {
            sendToServer("message", {
                peer_name: sessionStorage.getItem("peer-name"),
                channel: sessionStorage.getItem("channel"),
                socket_id: sessionStorage.getItem("socket-id"),
                msg: text.value,
                date: date,
            });

            msgObj = {
                peer_name: sessionStorage.getItem("peer-name"),
                channel: sessionStorage.getItem("channel"),
                socket_id: sessionStorage.getItem("socket-id"),
                msg: text.value,
                date: date,
            };
            handleMessage(msgObj);
            text.value = "";
        }
    });
};

const handleMessage = (params) => {
    const messageList = document.getElementById("messages");
    const userNameArea = document.createElement("div");
    const messageArea = document.createElement("div");
    const msgText = document.createElement("pre");
    const dateArea = document.createElement("span");

    userNameArea.className = "userName";
    messageArea.className = "message-container";
    msgText.className = "message";
    dateArea.className = "date";
    messageArea.append(msgText, dateArea);

    if (params.peer_name !== sessionStorage.getItem("peer-name")) {
        userNameArea.style.setProperty("margin-right", "auto");
        messageArea.style.setProperty("margin-right", "auto");
        dateArea.style.setProperty("margin-right", "auto");
    } else {
        userNameArea.style.setProperty("margin-left", "auto");
        messageArea.style.setProperty("margin-left", "auto");
        dateArea.style.setProperty("margin-left", "auto");
    }

    userNameArea.textContent = params.peer_name;
    msgText.textContent = params.msg;
    dateArea.textContent = params.date;

    if (messageList) {
        messageList.append(userNameArea, messageArea);
        scrollToBottom("popup__chat_window");
    }
};

socket.on("receiveMsg", (config) => {
    handleMessage(config);
});

export { chat };
