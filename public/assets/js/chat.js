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
    <div class="popup__message">
        <div class="popup__chat_window">
            <div class="messages" id="messages"></div>
        </div>
        <div class="popup__message_container">
            <input id="chat_message" type="text" autocomplete="off" placeholder="Type message here...">
            <div id="chat__send" class="options__button">
                <i class="fas fa-paper-plane" aria-hidden="true"></i>
            </div>
        </div>
    </div>
`;

    document.body.insertAdjacentHTML("beforeend", chatElem);

    msgPopup = document.querySelector(".popup__message");
    msgPopup.style.setProperty("display", "flex");

    draggable(msgPopup);
    handleChatEvent();
};

const chatDisable = () => {
    msgPopup = document.querySelector(".popup__message");
    msgPopup.style.setProperty("display", "none");
};

const handleChatEvent = () => {
    const text = document.getElementById("chat_message");
    const send = document.getElementById("chat__send");

    // const peerArr = JSON.parse(localStorage.getItem("peerArr"));

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
            text.value = "";
        }
    });
};

socket.on("receiveMsg", (config) => {
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

    if (config.peer_name !== sessionStorage.getItem("peer-name")) {
        userNameArea.style.setProperty("margin-right", "auto");
        messageArea.style.setProperty("margin-right", "auto");
        dateArea.style.setProperty("margin-right", "auto");
    } else {
        userNameArea.style.setProperty("margin-left", "auto");
        messageArea.style.setProperty("margin-left", "auto");
        dateArea.style.setProperty("margin-left", "auto");
    }

    userNameArea.textContent = config.peer_name;
    msgText.textContent = config.msg;
    dateArea.textContent = config.date;

    if (messageList) {
        messageList.append(userNameArea, messageArea);
    }

    scrollToBottom("popup__chat_window");
});

export { chat };
