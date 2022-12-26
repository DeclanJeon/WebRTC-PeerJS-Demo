let screenMaxFrameRate = 30;

const constraints = {
    mandatory: {
        echoCancellation: true,
    },
    audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
        echoCancellationType: "browser" || "system",
        channelCount: 2,
        latency: 0,
        sampleSize: 16,
    },
    video: {
        aspectRatio: { ideal: 1.7777777778 },
        width: { min: 640, ideal: 1920 },
        height: { min: 400, ideal: 1080 },
        frameRate: { max: 30 },
    },
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
