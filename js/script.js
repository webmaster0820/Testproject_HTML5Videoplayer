'use strict';
//var $ = document.querySelector.bind(document);
var sourceBuffer;

const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

let sources = [];
let loadedData = [], initSegment;
let played_index = 0;
var index = 0, nowSourceBuffer = 0;
const QULITY_OPTIONS = [
    { value: 'HD', label: 'High' },
    { value: 'HQ', label: 'Medium' },
    { value: 'LQ', label: 'Low' }
];
const SERVER_URL_ARR = [
    "https://sanjose.nagacdn.com",
    "https://washington.nagacdn.com",
    "https://dallas.nagacdn.com",
    "https://houston.nagacdn.com",
    "https://sydney.nagacdn.com",
    "https://tokyo.nagacdn.com",
    "https://singapore.nagacdn.com"
];
let prefixUrl;
var transmuxer = new muxjs.mp4.Transmuxer({
    remux: true
});
var oReq = new XMLHttpRequest();

const getVideoUrl = (data) => {
    // console.log(data);
    // let temp =["http://localhost/Git_directory/Temp/Testproject_HTML5Videoplayer/ts/1.med","http://localhost/Git_directory/Temp/Testproject_HTML5Videoplayer/ts/2.med", "http://localhost/Git_directory/Temp/Testproject_HTML5Videoplayer/ts/3.med", "http://localhost/Git_directory/Temp/Testproject_HTML5Videoplayer/ts/4.med"];
    // // alert(temp[Math.floor(Math.random(0,3)*3)]);

    // return temp[Math.floor(Math.random(0,3)*3)];
    // https://dallas.nagacdn.com/43216C84-98D6-44F3-AF68-B50951D1DCHQ636832719350000000.med?rcghG1qUmU65dH/sNcSvTw==
    let result = prefixUrl + data.split('|')[0] + ".med?" + encryptData(getNowTimestamp(), "cFyKl6d4HNkpLckd", "znj9yYjEg9yGqsdP");
    // console.log(result);
    return result;
}
const loadNext = () => {
    if (index < sources.length) {
        oReq.open("GET", getVideoUrl(sources[index]), true);
        oReq.responseType = "arraybuffer";
        oReq.onload = onreq_load;
        oReq.send();
    }
}


const onreq_load = (oEvent) => {
    transmuxer.push(new Uint8Array(oEvent.target.response));
    transmuxer.flush();
}
const transmuxer_data = (event) => {
    var c = new Uint8Array(event.data.length + event.initSegment.length);

    c.set(event.initSegment);
    // console.log(event.initSegment);
    c.set(event.data, event.initSegment.length);
    // console.log("-------Append buffer", c, index, event.initSegment);
    loadedData[index++] = c;
}


const transmuxer_done = () => {
    loadNext();
}
var video, mediaSource;

const appendVideoData = () => {
    if (played_index < index && !sourceBuffer.updating) {
        // console.log("------player", played_index, index, loadedData[played_index]);
        // console.log(mediaSource, sourceBuffer);
        sourceBuffer.appendBuffer(loadedData[played_index++]);
        // video.play();
        setTimeout(appendVideoData, 3000);
    } else setTimeout(appendVideoData, 100);
}



function init() {
    appendVideoData();


}
const on_initSegload = (oEvent) => {
    initSegment = oEvent.target.response;
    // console.log(initSegment);
}
const reset_video = () => {
    index = 0; played_index = 0; loadedData = [];
    // const sourceBuffer = mediaSource.sourceBuffers[0];
    // if (mediaSource.duration) {
    //     sourceBuffer.remove(0 /* start */, mediaSource.duration /* end*/);
    //     sourceBuffer.addEventListener('updateend', function () {
    //         alert("removed"); mediaSource.duration = 0;
    //     }, { once: true });
    // }
    video = document.createElement('video');
    video.controls = true;
    mediaSource = new MediaSource();
    video.src = URL.createObjectURL(mediaSource);

    $('#video-place').html("");
    $('#video-place').append(video);

    mediaSource.addEventListener('sourceopen', function () {
        mediaSource.duration = 0;
        var mimeCodec = 'video/mp4;codecs="avc1.64001f,mp4a.40.5"';
        sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
        // console.log(sourceBuffer);
        sourceBuffer.addEventListener('updateend', function (e) {
            // console.log("sourceBuffer updated");

        });

    });
    mediaSource.addEventListener('onsourceended', function () {

        // console.log("onsourceended");

    });

    mediaSource.addEventListener('onsourceclose', function () {
        // console.log("onsourceclose");
    });
    transmuxer = new muxjs.mp4.Transmuxer({
        remux: true
    });
    transmuxer.on('data', transmuxer_data);
    transmuxer.on('done', transmuxer_done);

    loadNext();
}
const encryptData = (text, newKey, newIv) => {
    const key = aesjs.utils.utf8.toBytes(newKey);
    const iv = aesjs.utils.utf8.toBytes(newIv);
    const textBytes = aesjs.padding.pkcs7.pad(aesjs.utils.utf8.toBytes(text));
    const aesCbc = new aesjs.ModeOfOperation.cbc(key, iv);
    const encryptedBytes = aesCbc.encrypt(textBytes);

    return arrayBufferToBase64(encryptedBytes);
};

const getTimeTick = (date) => {
    const d = new Date();
    const n = d.getTimezoneOffset() * 60;
    const datum = new Date(date);
    return (datum.getTime() - n * 1000) * 10000 + 621355968000000000;
}

const getNowTimestamp = () => {
    return Math.round((new Date()).getTime() / 1000);
}

const getUrl = (server_url_no, quality, start_dateTm, end_dateTm, _MEDIA_ID) => {
    prefixUrl = SERVER_URL_ARR[server_url_no * 1] + "/" + _MEDIA_ID + quality;
    const retUrl = prefixUrl + getTimeTick(start_dateTm) + getTimeTick(end_dateTm) + ".list?" + encryptData(getNowTimestamp(), "cFyKl6d4HNkpLckd", "znj9yYjEg9yGqsdP");
    // console.log(retUrl);
    return retUrl;
}
$(document).ready(function () {
    $("#startBtn").click(function (e) {
        let url = getUrl($("#server_url_no").val(), $("#quality").val(), $("#start_dateTm").val(), $("#end_dateTm").val(), $("#media_id").val());
        $.get(url, function (e) {
            sources = e.split("\r");
            reset_video();
        });
    });
});