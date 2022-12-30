let screenMaxFrameRate = 30;

const constraints = {
    mandatory: {
        echoCancellation: true,
    },
    audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: false,
        echoCancellationType: "browser" || "system",
        channelCount: 2,
        latency: 0,
        sampleSize: 16,
    },
    video: true,
};

const displayMediaConfig = {
    audio: true, // enable tab audio
    video: {
        width: 1920,
        height: 1080,
        frameRate: { max: screenMaxFrameRate },
    },
};

export { constraints, displayMediaConfig };
