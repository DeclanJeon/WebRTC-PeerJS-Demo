let myVideoStatus = null;
let myAudioStatus = null;

const videoBtn = document.getElementById("muteVideo");
const audioBtn = document.getElementById("muteAudio");

const videoIcon = document.getElementById("videoIcon");
const audioIcon = document.getElementById("audioIcon");

const handlerMute = (stream) => {
    videoBtn.addEventListener("click", () => {
        handlerVideoMute(stream);
    });
    audioBtn.addEventListener("click", () => {
        handlerAudioMute(stream);
    });
};

const handlerAudioMute = (stream) => {
    const enabled = stream.getAudioTracks()[0].enabled;
    if (enabled) {
        stream.getAudioTracks()[0].enabled = false;
        audioIcon.className = "fa fa-microphone-slash";
        myAudioStatus = enabled;
        console.log("AudioTrack Mute : " + enabled);
    } else {
        stream.getAudioTracks()[0].enabled = true;
        audioIcon.className = "fa fa-microphone";
        myAudioStatus = enabled;
        console.log("AudioTrack Mute : " + enabled);
    }
};

const handlerVideoMute = (stream) => {
    const enabled = stream.getVideoTracks()[0].enabled;
    if (enabled) {
        stream.getVideoTracks()[0].enabled = false;
        videoIcon.className = "fas fa-video-slash";
        myVideoStatus = enabled;
        console.log("VideoTrack Mute : " + enabled);
    } else {
        stream.getVideoTracks()[0].enabled = true;
        videoIcon.className = "fas fa-video";
        myVideoStatus = enabled;
        console.log("VideoTrack Mute : " + enabled);
    }
};

const sendToServerMuteStatus = () => {
    const muteStatus = {
        audio: myAudioStatus,
        video: myVideoStatus,
    };

    return muteStatus;
};

export { handlerMute, sendToServerMuteStatus };
