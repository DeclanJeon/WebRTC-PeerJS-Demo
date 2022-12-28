import {
    addDomBeforeEnd,
    createDom,
    selectDom,
    removeDom,
    appendDom,
    addDomBeforeBegin,
} from "./module.js";

import { currentPeer, replaceStream } from "./client.js";

let fileManagerEnabled = false;
let inventoryActive = false;
let selectFileManager;
let saveCamStream;
let saveFileStream;
let fileAddBtn;
let reader;
let blob;
let url;

const selectBtn = selectDom("#showFiles");

const handleShowFileInventory = () => {
    inventoryActive = !inventoryActive;
    inventoryActive ? inventoryEnable() : inventoryDisable();

    if (inventoryActive === true) {
        fileAddBtn = selectDom("#addFile");
        fileAddBtn.addEventListener("change", handleReadFile);
    }
};

const inventoryEnable = async () => {
    const fileManagerElem = `
    <div class="file_manager_container">
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
            <a class="navbar-brand" href="#">File Directory</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
        
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="#">File Home <span class="sr-only"></span></a>
                    </li>
                </ul>
                <form class="form-inline my-2 my-lg-0">
                    <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
                    <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
                </form>
            </div>
        </nav>
        <div id="main-content" class="file_manager">
            <div class="container">
                <div class="row clearfix">
                    <div class="col-lg-3 col-md-4 col-sm-12">
                        <div class="fileList_card card">
                            <div class="file">
                                <a href="javascript:void(0);">
                                    <div class="hover">
                                        <button type="button" class="btn btn-icon btn-danger">
                                            <i class="fa fa-trash"></i>
                                        </button>
                                    </div>
                                    <div class="icon">
                                        <i class="fa fa-file text-info"></i>
                                    </div>
                                    <div class="file-name">
                                        <p class="m-b-5 text-muted">Document_2017.doc</p>
                                        <small>Size: 42KB <span class="date text-muted">Nov 02, 2017</span></small>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="file_manager_footer mb-3">
                    <label for="addFile" id="addFile_label" class="form-label btn btn-primary">Add File</label>
                    <input class="form-control border border-2 border-success" type="file" id="addFile" hidden="true">
                </div> 
            </div>
        </div>
    </div>
`;

    selectFileManager = selectDom(".file_manager_container");
    if (!selectFileManager) {
        addDomBeforeEnd(document.body, fileManagerElem);
    } else {
        selectFileManager.hidden = false;
    }

    fileManagerEnabled = true;
};

const inventoryDisable = () => {
    if (fileManagerEnabled) {
        selectFileManager = selectDom(".file_manager_container");
        selectFileManager.hidden = true;
    } else {
        alert("Empty File Manger Container");
    }

    fileManagerEnabled = false;
};

const maybeCreateStream = () => {
    let localVideo = selectDom("#local__video");

    if (saveFileStream) {
        return;
    }
    if (localVideo.captureStream) {
        saveFileStream = localVideo.captureStream();
        console.log(
            "Captured stream from localVideo with captureStream",
            saveFileStream
        );
    } else if (localVideo.mozCaptureStream) {
        saveFileStream = localVideo.mozCaptureStream();
        console.log(
            "log stream from video with mozCaptureStream()",
            saveFileStream
        );
    } else {
        console.log("captureStream() not supported");
    }

    let streamInterval = setInterval(() => {
        if (currentPeer !== undefined) {
            clearInterval(streamInterval);
            replaceStream(currentPeer, saveFileStream);
        }
    }, 500);
};

const handleReadFile = (evt) => {
    let file = evt.target.files[0];
    FileReaderEvent(file);
};

function FileReaderEvent(file) {
    reader = new FileReader();
    reader.onload = (e) => {
        url = window.URL.createObjectURL(blob);
    };

    seek();

    function seek() {
        const chunks = [];
        const numberOfSlices = 1000;
        const chunkSize = Math.ceil(file.size / numberOfSlices);

        for (let i = 0; i < numberOfSlices; i += 1) {
            const startByte = chunkSize * i;
            chunks.push(
                file.slice(startByte, startByte + chunkSize, file.type)
            );
        }

        blob = new Blob(chunks);
        reader.readAsArrayBuffer(blob);
    }

    reader.onprogress = (e) => {
        console.log("Progress", ~~((e.loaded / e.total) * 100), "%");
    };

    reader.onloadend = (e) => {
        let localVideo = selectDom("#local__video");
        handleReadVideoFile(localVideo);
        console.log("File load completed successfully loaded.");
    };

    reader.onerror = (e) => {
        let errorCode = reader.error.code;
        if (errorCode === reader.error.NOT_READABLE_ERR) {
            alert("You do not have permission to read files.");
        } else if (errorCode === reader.error.ABORT_ERR) {
            alert("File read has been stopped.");
        } else {
            alert("Failed to read file.", errorCode);
            console.log(e);
        }
    };
}

const handleReadVideoFile = (video) => {
    handleFileMediaPlay(video);
    addDomBeforeEnd(video.parentElement, controllerElem);

    let playing = false;

    $(".circle-ctrl").on("click", () => {
        playing = !playing;
        let animation = playing ? "stop" : "play";
        $("#animate_to_" + animation)
            .get(0)
            .beginElement();

        handleStopAndStartMedia(animation, video);
    });
};

const handleFileMediaPlay = (video) => {
    saveCamStream = video.srcObject;
    video.srcObject = null;
    video.src = url;

    video.oncanplay = maybeCreateStream;
    if (video.readyState >= 3) {
        maybeCreateStream();
    }

    video.play();
};

const handleStopAndStartMedia = (state, video) => {
    if (state === "stop") {
        video.src = "";
        video.srcObject = saveCamStream;
        if (saveCamStream !== undefined && currentPeer !== undefined) {
            replaceStream(currentPeer, saveCamStream);
        }
    } else if (state === "play") {
        handleFileMediaPlay(video);
        if (saveFileStream !== undefined && currentPeer !== undefined) {
            replaceStream(currentPeer, saveFileStream);
        }
    }
};

const controllerElem = `
<svg class="circle-ctrl" viewbox="0 0 140 140">
    <circle cx="70" cy="70" r="65" style="fill:#161d29;stroke:#1d2635"/>
    <polygon id="shape" points="50,40 100,70 100,70 50,100, 50,40" style="fill:#fff;">
    <animate 
        id="animate_to_stop" 
        begin="indefinite" 
        fill="freeze" 
        attributeName="points" 
        dur="500ms" 
        to="45,45 95,45 95,95, 45,95 45,45"
        keySplines="
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1"
        keyTimes="0;0.22;0.33;0.55;0.66;0.88;1" 
        calcMode="spline"
    />
    
    <animate 
        id="animate_to_play" 
        begin="indefinite" 
        fill="freeze" 
        attributeName="points" 
        dur="500ms" 
        to="50,40 100,70 100,70 50,100, 50,40" 
        keySplines="
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1; 
        0.1 0.8 0.2 1"
        keyTimes="0;0.22;0.33;0.55;0.66;0.88;1" 
        calcMode="spline"
    />
    </polygon>
</svg>
`;

const handleReadAudioFile = (audio) => {};

const handleReadPdfFile = (pdf) => {};

const handleReadImgFile = (img) => {};

const handleReadTextFile = (txt) => {};

const handleReadExcelFile = (excel) => {};

const handleDelFile = (elem) => {};

selectBtn.addEventListener("click", handleShowFileInventory);
