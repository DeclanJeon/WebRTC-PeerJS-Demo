let screenMaxFrameRate = 30;

const getConstraints = (audio, video) => {
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
            deviceId: audio ? { exact: audio } : undefined,
        },
        video: {
            width: { min: 640, ideal: 1920 },
            height: { min: 400, ideal: 1080 },
            aspectRatio: { ideal: 1.7777777778 },
            deviceId: video ? { exact: video } : undefined,
        },
    };
    return constraints;
};

const displayMediaConfig = {
    audio: true, // enable tab audio
    video: {
        width: 1920,
        height: 1080,
        frameRate: { max: screenMaxFrameRate },
    },
};

export { getConstraints, displayMediaConfig };
