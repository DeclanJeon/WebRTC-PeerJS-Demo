setTimeout(() => {
    let stream;
    const video = document.querySelector("video");
    const stopRtc = () => {
        if (stream) stream.getTracks().forEach((track) => track.stop());
        video.style.setProperty("display", "none");
    };
    const runRtc = (constraints) => {
        stopRtc();
        navigator.mediaDevices
            .getUserMedia(constraints)
            .then((mediaStream) => {
                video.style.setProperty("display", "block");
                stream = window.stream = mediaStream;
                video.srcObject = mediaStream;
                video.play();
            })
            .catch((err) => {
                if (
                    err.name == "NotFoundError" ||
                    err.name == "DevicesNotFoundError"
                ) {
                    //required track is missing
                } else if (
                    err.name == "NotReadableError" ||
                    err.name == "TrackStartError"
                ) {
                    //webcam or mic are already in use
                } else if (
                    err.name == "OverconstrainedError" ||
                    err.name == "ConstraintNotSatisfiedError"
                ) {
                    alert(
                        "Please check the resolution supported by the camcorder. The selected resolution is not supported."
                    );
                    //constraints can not be satisfied by avb. devices
                } else if (
                    err.name == "NotAllowedError" ||
                    err.name == "PermissionDeniedError"
                ) {
                    //permission denied in browser
                } else if (err.name == "TypeError" || err.name == "TypeError") {
                    //empty constraints object
                } else {
                    //other errors
                }
            });
    };
    const setConstraints = (w, h) => {
        const constraints = {
            audio: false,
            video: { width: { exact: w }, height: { exact: h } },
        };
        return constraints;
    };

    const params = {
        runQVGA: () => runRtc(setConstraints(320, 240)),
        runVGA: () => runRtc(setConstraints(640, 480)),
        runWVGA: () => runRtc(setConstraints(800, 480)),
        runSVGA: () => runRtc(setConstraints(800, 600)),
        runXGA: () => runRtc(setConstraints(1024, 768)),
        runSXGA: () => runRtc(setConstraints(1280, 1024)),
        runUXGA: () => runRtc(setConstraints(1600, 1200)),
        runQXGA: () => runRtc(setConstraints(2048, 1536)),
        width: 300,
        height: 300,
        runCustom: () => runRtc(setConstraints(params.width, params.height)),
        stopRTC: () => stopRtc(),
    };
    const gui = new dat.GUI();
    const rtcFolder = gui.addFolder("WebRTC");
    const rtcCustom = rtcFolder.addFolder("Custom");
    rtcCustom.add(params, "width");
    rtcCustom.add(params, "height");
    rtcCustom.add(params, "runCustom").name("Run Custom");
    rtcFolder.add(params, "runQVGA").name("QVGA(320x240)");
    rtcFolder.add(params, "runVGA").name("VGA(640x480)");
    rtcFolder.add(params, "runWVGA").name("WVGA(800x480)");
    rtcFolder.add(params, "runSVGA").name("SVGA(800x600)");
    rtcFolder.add(params, "runXGA").name("XGA(1024x768)");
    rtcFolder.add(params, "runSXGA").name("SXGA(1280x1024)");
    rtcFolder.add(params, "runUXGA").name("UXGA(1600x1200)");
    rtcFolder.add(params, "runQXGA").name("QXGA(2048x1536)");
    rtcFolder.add(params, "stopRTC").name("Stop Stream");
    rtcFolder.open();
}, 5000);
