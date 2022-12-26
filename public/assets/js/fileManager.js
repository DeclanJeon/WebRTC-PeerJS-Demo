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
let fileAddBtn;
let reader;
let blob;
let url;

let fileStream;

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

    if (fileStream) {
        return;
    }
    if (localVideo.captureStream) {
        fileStream = localVideo.captureStream();
        console.log(
            "Captured stream from localVideo with captureStream",
            fileStream
        );
    } else if (localVideo.mozCaptureStream) {
        fileStream = localVideo.mozCaptureStream();
        console.log(
            "log stream from video with mozCaptureStream()",
            fileStream
        );
    } else {
        console.log("captureStream() not supported");
    }

    let streamInterval = setInterval(() => {
        if (currentPeer !== undefined) {
            clearInterval(streamInterval);
            replaceStream(currentPeer, fileStream);
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
        // let video = createDom("video");

        let localVideo = selectDom("#local__video");
        let saveCamStream = localVideo.srcObject;

        localVideo.srcObject = null;
        localVideo.src = url;
        // localVideo.src = url;

        // let videoGrid = selectDom("#video-grid");
        // let videoContainer = createDom("div");
        // videoContainer.id = "video__container";
        // appendDom(videoContainer, video);
        // appendDom(videoGrid, videoContainer);

        localVideo.oncanplay = maybeCreateStream;
        if (localVideo.readyState >= 3) {
            maybeCreateStream();
        }

        localVideo.play();

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

selectBtn.addEventListener("click", handleShowFileInventory);
