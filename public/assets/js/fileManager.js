import {
    addDomBeforeEnd,
    createDom,
    selectDom,
    removeDom,
    appendDom,
    addDomBeforeBegin,
    niceBytes,
} from "./module.js";

import { currentPeer, replaceStream } from "./client.js";

let fileManagerEnabled = false;
let inventoryActive = false;
let selectFileManager;
let saveCamStream = {};
let saveFileStream = {};
let fileAddBtn;
let reader;
let blob;
let fileObjConvertURL;
let fileInfoArr = [];
let fileInfoObj = {};

const selectBtn = selectDom("#showFiles");

const handleShowFileInventory = () => {
    inventoryActive = !inventoryActive;
    inventoryActive ? inventoryEnable() : inventoryDisable();

    let fileSidebar = selectDom("#fileManager-sidebar");

    if (inventoryActive === true) {
        fileSidebar.style.setProperty("display", "flex");
        fileAddBtn = selectDom("#addFile");
        fileAddBtn.addEventListener("change", handleReadFile);
    }
};

const inventoryEnable = async () => {
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

    if (saveFileStream["file"]) {
        return;
    }
    if (localVideo.captureStream) {
        saveFileStream["file"] = localVideo.captureStream();
        console.log(
            "Captured stream from localVideo with captureStream",
            saveFileStream["file"]
        );
    } else if (localVideo.mozCaptureStream) {
        saveFileStream["file"] = localVideo.mozCaptureStream();
        console.log(
            "log stream from video with mozCaptureStream()",
            saveFileStream["file"]
        );
    } else {
        console.log("captureStream() not supported");
    }

    let streamInterval = setInterval(() => {
        if (currentPeer !== undefined) {
            clearInterval(streamInterval);
            replaceStream(currentPeer, saveFileStream["file"]);
        }
    }, 500);
};

const handleReadFile = (evt) => {
    let file = evt.target.files[0];
    registerFileInfo(file);
    FileReaderEvent(file);
};

const registerFileInfo = (file) => {
    const getPeer = getFindIdEggshells();

    let pName;
    let fName;
    let fType;
    let fSize;
    let fDate = moment().format("YYYY/MM/DD/HH:MM");

    fileInfoObj = {
        peerInfo: getPeer,
        fileInfo: file,
    };

    fileInfoArr.push(fileInfoObj);

    pName = fileInfoObj.peerInfo.peer_name;
    fName = fileInfoObj.fileInfo.name;
    fType = fileInfoObj.fileInfo.type;
    fSize = fileInfoObj.fileInfo.size;
    fDate = fDate;

    inputCardData(pName, fName, fType, fSize, fDate);
};

const inputCardData = (pName, fName, fType, fSize, fDate) => {
    let f_size = niceBytes(fSize);

    let cardContainer = selectDom("#card_container");
    const fileCardElem = `
    <div class="card_wrapper">
        <div class="fileList_card card">
            <div class="file">
                <div class="hover">
                    <button type="button" class="btn btn-icon btn-danger">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
                <div class="icon">
                    <i class="fa fa-file text-info"></i>
                </div>
                <div class="file-info">
                    <div id="file-name" class="mb-2 text-muted">
                        <span>${fName}</span>
                        <span>${pName}</span>
                    </div>
                    <small><span class="file-size">Size: ${f_size}</span> <span class="date text-muted">${fDate}</span></small>
                </div>
            </div>
        </div>
    </div>
    `;

    addDomBeforeEnd(cardContainer, fileCardElem);
};

const getFindIdEggshells = () => {
    let getPeers = JSON.parse(sessionStorage.getItem("peerArr"));
    let getMyVideo = selectDom("#local__video");
    let result;
    getPeers.forEach((peer) => {
        if (getMyVideo.className.indexOf(peer[1].peer_id)) {
            result = peer[1];
        }
    });

    return result;
};

function FileReaderEvent(file) {
    reader = new FileReader();
    reader.onload = (e) => {
        fileObjConvertURL = URL.createObjectURL(blob);
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
    addDomBeforeEnd(video.parentElement, ctrlElem);

    handleFileMediaCtrl();

    // $(".circle-ctrl").on("click", () => {
    //     playing = !playing;
    //     let animation = playing ? "stop" : "play";
    //     $("#animate_to_" + animation)
    //         .get(0)
    //         .beginElement();

    //     handleStopAndStartMedia(animation, video);
    // });
};

const handleFileMediaCtrl = () => {
    let playing = true;
    let localVideo = selectDom("#local__video");

    let playCtrl = selectDom(".circle-ctrl");
    playCtrl.addEventListener("click", () => {
        playing = !playing;
        playing
            ? handleFileMediaStart(localVideo)
            : handleFileMediaPause(localVideo);
    });
};

const handleFileMediaStart = (elem) => {
    let ctrlBtn = selectDom(".circle-ctrl > i");
    ctrlBtn.classList.replace("fa-play", "fa-pause");
    elem.play();
};

const handleFileMediaPause = (elem) => {
    let ctrlBtn = selectDom(".circle-ctrl > i");
    ctrlBtn.classList.replace("fa-pause", "fa-play");
    elem.pause();
};

const handleFileMediaStop = (elem) => {};

const handleFileMediaPlay = (video) => {
    saveCamStream["cam"] = video.srcObject;
    video.srcObject = null;
    video.src = fileObjConvertURL;

    video.oncanplay = maybeCreateStream;
    if (video.readyState >= 3) {
        maybeCreateStream();
    }
    video.play();
};

const handleStopAndStartMedia = (state, video) => {
    if (state === "stop") {
        video.src = "";
        video.srcObject = saveCamStream["cam"];
        if (saveCamStream["cam"] !== undefined && currentPeer !== undefined) {
            replaceStream(currentPeer, saveCamStream["cam"]);
        }
    } else if (state === "play") {
        handleFileMediaPlay(video);
        if (saveFileStream["file"] !== undefined && currentPeer !== undefined) {
            replaceStream(currentPeer, saveFileStream["file"]);
        }
    }
};

const handleReadAudioFile = (audio) => {};

const handleReadPdfFile = (pdf) => {};

const handleReadImgFile = (img) => {};

const handleReadTextFile = (txt) => {};

const handleReadExcelFile = (excel) => {};

const handleDelFile = (elem) => {};

/********************* Element Variable ********************/

const ctrlElem = `
    <div class="circle-ctrl">
        <i class="fas fa-pause"></i>
    </div>
`;

const fileManagerElem = `
    <div class="file_manager_container">
        <nav class="p-3 navbar navbar-expand-lg navbar-light bg-light">
            <a class="navbar-brand" href="#">File Directory</a>
            <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
        
            <div class="d-flex justify-content-end collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav mr-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="#">File Home <span class="sr-only"></span></a>
                    </li>
                </ul>
                <form class="d-flex form-inline my-2 my-lg-0">
                    <input class="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search">
                    <button class="btn btn-outline-success my-2 my-sm-0" type="submit">Search</button>
                </form>
            </div>
        </nav>
        <div id="main-content" class="file_manager">
            <div class="container">
                <div class="row clearfix">
                    <div id="card_container">
                        
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

selectBtn.addEventListener("click", handleShowFileInventory);
