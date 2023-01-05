import { selectDom } from "./module.js";
import { getConstraints } from "./rtc_config.js";

("use strict");

const audioInputSelect = document.querySelector("select#audioSource");
const audioOutputSelect = document.querySelector("select#audioOutput");
const videoSelect = document.querySelector("select#videoSource");
const selectors = [audioInputSelect, audioOutputSelect, videoSelect];

let deviceSettingActivate = false;

audioOutputSelect.disabled = !("sinkId" in HTMLMediaElement.prototype);

const settingBtn = selectDom("#deviceSettings");
settingBtn.addEventListener("click", () => {
    deviceSettingActivate = !deviceSettingActivate;
    deviceSettingActivate ? settingWrapperEnable() : settingWrapperDisable();
});

const settingWrapperEnable = () => {
    const s_ctr = selectDom(".settings-container");
    s_ctr.hidden = false;
    getDevice();
};

const settingWrapperDisable = () => {
    const s_ctr = selectDom(".settings-container");
    s_ctr.hidden = true;
};

const getDevice = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    gotDevices(devices);
};

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    const values = selectors.map((select) => select.value);
    selectors.forEach((select) => {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (let i = 0; i !== deviceInfos.length; ++i) {
        const deviceInfo = deviceInfos[i];
        const option = document.createElement("option");
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === "audioinput") {
            option.text =
                deviceInfo.label || `microphone ${audioInputSelect.length + 1}`;
            audioInputSelect.appendChild(option);
        } else if (deviceInfo.kind === "audiooutput") {
            option.text =
                deviceInfo.label || `speaker ${audioOutputSelect.length + 1}`;
            audioOutputSelect.appendChild(option);
        } else if (deviceInfo.kind === "videoinput") {
            option.text =
                deviceInfo.label || `camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        } else {
            console.log("Some other kind of source/device: ", deviceInfo);
        }
    }
    selectors.forEach((select, selectorIndex) => {
        if (
            Array.prototype.slice
                .call(select.childNodes)
                .some((n) => n.value === values[selectorIndex])
        ) {
            select.value = values[selectorIndex];
        }
    });
}

// Attach audio output device to video element using device/sink ID.
function attachSinkId(element, sinkId) {
    if (typeof element.sinkId !== "undefined") {
        element
            .setSinkId(sinkId)
            .then(() => {
                console.log(`Success, audio output device attached: ${sinkId}`);
            })
            .catch((error) => {
                let errorMessage = error;
                if (error.name === "SecurityError") {
                    errorMessage = `You need to use HTTPS for selecting audio output device: ${error}`;
                }
                console.error(errorMessage);
                // Jump back to first output device in the list as it's the default.
                audioOutputSelect.selectedIndex = 0;
            });
    } else {
        console.warn("Browser does not support output device selection.");
    }
}

function changeAudioDestination() {
    const audioDestination = audioOutputSelect.value;
    const l_video = selectDom("#local__video");
    attachSinkId(l_video, audioDestination);
}

function gotStream(stream) {
    const l_video = selectDom("#local__video");
    if (l_video) {
        window.stream = stream; // make stream available to console
        l_video.srcObject = stream;
    }
    // Refresh button list in case labels have become available
    // return navigator.mediaDevices.enumerateDevices();
}

function handleError(error) {
    console.log(
        "navigator.MediaDevices.getUserMedia error: ",
        error.message,
        error.name
    );
}

const trackStop = () => {
    if (window.stream) {
        window.stream.getTracks().forEach((track) => {
            track.stop();
        });
    }
};

async function deviceChange() {
    trackStop();

    const audioSource = audioInputSelect.value;
    const videoSource = videoSelect.value;

    const config = getConstraints(audioSource, videoSource);

    const stream = await navigator.mediaDevices
        .getUserMedia(config)
        .catch(handleError);

    gotStream(stream);
}

audioInputSelect.onchange = deviceChange;
audioOutputSelect.onchange = changeAudioDestination;

videoSelect.onchange = deviceChange;
