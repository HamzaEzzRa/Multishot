var btnContainer = document.getElementById("bottom-navbar");

var btns = btnContainer.getElementsByClassName("tab-button");

btns[0].className += " active";

for (var i = 0; i < btns.length; i++) {
    btns[i].addEventListener("click", function() {
        var current = document.getElementsByClassName("active");

        if (current.length > 0)
            current[0].className = current[0].className.replace(" active", "");

        this.className += " active";
    });
}

let originalTab,
    currentZip,
    currentTab,
    resultWindowId,
    deviceList,
    currentDevice = 0;

const $ = (id) => document.getElementById(id);
const show = (element) => { element.style.display = 'block'; }
const hide = (element) => { element.style.display = 'none'; }

const getFilename = (url) => {
    const ext = $('screen-type').value;

    let name = $('screen-name').value;
    if (!name || name.length === 0) {
        name = url.split('?')[0].split('#')[0];
        name = name
            .replace(/^https?:\/\//, '')
            .replace(/[^A-z0-9]+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^[_\-]+/, '')
            .replace(/[_\-]+$/, '');
        name = '-' + name;
    }
    const device = deviceList[currentDevice];
    name = name + '-' + ($('screen-date').checked ? new Date().toISOString() : '') +
        '-' + device.width + 'x' + device.height + ext;
    return name;
}

const saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, type, name) {
        let blob = new Blob(data, {type: type}),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = name;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());

const displayCapture = (blobs, filenames) => {
    if (!filenames || !filenames.length) {
        console.warn('uh-oh');
        return;
    }

    createCaptureWindow(blobs, filenames);
}

const createCaptureWindow = (blobs, filenames, fileIndex = 0) => {
    let filename = filenames[fileIndex];
    let last = fileIndex === filenames.length - 1;

    // saveData(blobs, blobs[0].type, filename);
    const device = deviceList[currentDevice];
    let blob = new Blob(blobs, {type: blobs[0].type});
    let folder = currentZip.folder(device.width + "x" + device.height);
    folder.file(filename, blob, {base64: true});

    fileIndex += 1;
    currentDevice += 1;

    if (!last)
        createCaptureWindow(filenames, fileIndex);
    else {
        if (currentDevice < deviceList.length)
            captureDevice(currentDevice);
        else {
            chrome.windows.remove(resultWindowId);
            currentZip.generateAsync({type:"blob"}).then((content) => {
                saveAs(content, "Multishot.zip");
            });
        }
    }
}

const errorHandler = (reason) => {
    console.error(reason);
}

const progress = (complete) => {
    // console.warn(complete * 100 + '%');
}

const captureDevice = (index) => {
    if (index > 0)
        chrome.windows.remove(resultWindowId);
    const device = deviceList[index];
    const options = {
        focused: true,
        left: 0,
        top: 0,
        width: device.width,
        height: device.height,
        state: 'normal',
        url: originalTab.url,
        type: 'normal',
        setSelfAsOpener: true,
    };
    const listener = (tabId, changeInfo, tab) => {
        if (tab.url.indexOf(originalTab.url) != -1 && changeInfo.status == 'complete') {
            currentTab = tab;
            
            let filename = getFilename(tab.url);
            let format = $('screen-type').value;
            if (format !== '.png' && format !== '.jpeg')
                format = '.png';
            
            format = format.split('.')[1];
    
            const fullPage = $('screen-full').checked;
    
            captureToFiles(
                tab,
                filename,
                format,
                fullPage,
                displayCapture,
                errorHandler,
                progress
            );
            chrome.tabs.onUpdated.removeListener(listener);
        }
    };
    chrome.windows.create(options, (window) => {
        resultWindowId = window.id;
        chrome.tabs.onUpdated.addListener(listener);
    });
};

$('screen-button').onclick = () => {
    currentDevice = 0;
    currentZip = new JSZip();
    chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
        originalTab = tabs[0];
        deviceList = await getDevices();
        
        if (deviceList && deviceList.length > 0)
            captureDevice(currentDevice);
    });
};
