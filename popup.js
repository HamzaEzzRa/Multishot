const $ = (id) => document.getElementById(id);

var inputContainer = $('main-input');
var presetsMain = $('main-presets');
var presetsContainer = $('presets-container');
var screenButton = $('screen-button');

var screenshotting = false;

const removeItem = (arr, device) => {
    var index = arr.indexOf(device);
    if (index > -1)
        arr.splice(index, 1);
    return arr;
};

const createDevice = (name, width, height) => {
    const newDevice = {
        type: 'Custom',
        name: name,
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        zoom: 100,
        active: true,
    }
    currentDevices.unshift(newDevice);
    saveDevices(currentDevices);

    return newDevice;
};

(function setup() {
    getDevices().then((deviceList) => {
        deviceList.forEach((device) => {
            addPreset(presetsContainer, device);
        });
    });
    const formatSelect = $('screen-type');
    const formatOptions = [...formatSelect.getElementsByClassName('format-option')];
    getSettings().then((settings) => {
        formatOptions.forEach((option) => {
            if (option.value === settings.imageFormat)
                option.selected = true;
            else
                option.selected = false;
        });
    });
    const form = $('preset-form');
    $('add-button').addEventListener('click', (event) => {
        if (form.checkValidity()) {
            event.preventDefault();

            const newDevice = createDevice(
                $('device-name-input').value,
                $('device-width-input').value,
                $('device-height-input').value
            );
            addPreset(presetsContainer, newDevice, true);
    
            form.reset();
        }
    })
    $('settings-button').addEventListener('click', () => {
        chrome.tabs.create({ url: './options.html' });
    });
})();

(function setupNavBar() {
    var btnContainer = document.getElementById('bottom-navbar');

    var btns = btnContainer.getElementsByClassName('tab-button');

    btns[0].className += ' active';

    for (let i = 0; i < btns.length; i++) {
        btns[i].addEventListener('click', function() {
            const current = document.getElementsByClassName('active');

            if (current.length > 0)
                current[0].className = current[0].className.replace(' active', '');

            this.className += ' active';

            const href = this.href.split('#')[1].toLowerCase();
            if (href === 'home') {
                inputContainer.style.transitionDuration = '0.45s';
                presetsMain.style.transitionDuration = '0.45s';

                inputContainer.style.transform = 'translateX(0%)';
                presetsMain.style.transform = 'translateX(100%)';
            }
            else if (href === 'presets') {
                inputContainer.style.transitionDuration = '0.45s';
                presetsMain.style.transitionDuration = '0.45s';

                inputContainer.style.transform = 'translateX(-100%)';
                presetsMain.style.transform = 'translateX(0%)';
            }
        });
    }
})();

let originalTab,
    originalZoom,
    currentZip,
    resultWindowId,
    deviceList,
    currentDevice = 0;

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
    }
    const device = deviceList[currentDevice];
    name = `${name}-` + ($('screen-date').checked ? `${new Date().toISOString()}-` : '') +
        `${device.width}x${device.height}` + (device.zoom !== 100 ? `-${device.zoom}%` : '') + ext;
    return name;
}

const displayCapture = (blobs, filenames, settings) => {
    if (!filenames || !filenames.length) {
        console.warn('uh-oh');
        return;
    }

    createCaptureWindow(blobs, filenames, settings);
}

const createCaptureWindow = (blobs, filenames, settings, fileIndex = 0) => {
    let filename = filenames[fileIndex];
    let last = fileIndex === filenames.length - 1;

    const device = deviceList[currentDevice];
    let blob = new Blob(blobs, {type: blobs[0].type});

    if ($('screen-subfolder').checked) {
        const folderName = device.name.replaceAll('/', '_');
        let folder = currentZip.folder(`${folderName}-${device.width}x${device.height}-${device.zoom}%`);
        folder.file(filename, blob, {base64: true});
    }
    else
        currentZip.file(filename, blob, {base64: true});

    fileIndex += 1;
    currentDevice += 1;

    if (!last)
        createCaptureWindow(blobs, filenames, settings, fileIndex);
    else {
        if (currentDevice < deviceList.length)
            captureDevice(currentDevice, settings);
        else {
            currentZip.generateAsync({type:"blob"}).then((content) => {
                const url =  URL.createObjectURL(content);

                screenButton.childNodes.forEach((node) => {
                    if (node.style.display !== 'none')
                        node.style.display = 'none';
                    else
                        node.style.display = 'block';
                });
                screenshotting = false;
                screenButton.disabled = false;

                chrome.downloads.download({ url, filename: `${settings.zipName}.zip`, saveAs: settings.saveAs });
            });
            chrome.windows.remove(resultWindowId, () => {
                chrome.tabs.setZoom(originalTab.id, originalZoom);
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

const captureDevice = (index, settings) => {
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
        type: 'popup',
        setSelfAsOpener: true,
    };
    const listener = (tabId, changeInfo, tab) => {
        if (tab.url.indexOf(originalTab.url) != -1 && changeInfo.status == 'complete') {
            let filename = getFilename(tab.url);
            let format = $('screen-type').value;
            if (format !== '.png' && format !== '.jpeg')
                format = '.png';
            
            format = format.split('.')[1];
    
            const fullPage = $('screen-full').checked;

            chrome.tabs.onUpdated.removeListener(listener);
            
            const start = () => {
                if (settings.captureDelay > 0) {
                    setTimeout(() => {
                        captureToFiles(
                            tab,
                            filename,
                            format,
                            settings.imageQuality,
                            fullPage,
                            displayCapture,
                            errorHandler,
                            progress
                        );
                    }, settings.captureDelay * 1000);
                }
                else {
                    captureToFiles(
                        tab,
                        filename,
                        format,
                        settings.imageQuality,
                        fullPage,
                        displayCapture,
                        errorHandler,
                        progress
                    );
                }
            }
            chrome.tabs.setZoom(tabId, device.zoom / 100, () => {
                start();
            });
        }
    };
    chrome.windows.create(options, (window) => {
        resultWindowId = window.id;
        chrome.tabs.onUpdated.addListener(listener);
    });
};

const multishot = () => {
    if (screenshotting)
        return;

    screenshotting = true;
    screenButton.childNodes.forEach((node) => {
        if (node.style.display !== 'none')
            node.style.display = 'none';
        else
            node.style.display = 'block';
    });
    screenButton.disabled = true;
    
    currentDevice = 0;
    currentZip = new JSZip();
    chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
        originalTab = tabs[0];
        originalZoom = await chrome.tabs.getZoom();
        deviceList = await getDevices();
        deviceList = deviceList.filter(device => device.active);

        settings = await getSettings();
        
        if (deviceList && deviceList.length > 0)
            captureDevice(currentDevice, settings);
    });
};

var onMessage = (data, sender, callback) => {
    switch(data.msg) {
        case 'take-screenshots': {
            multishot();
            break;
        }
        case 'open-settings': {
            chrome.tabs.create({ url: './options.html' });
            break;
        }
        default:
            break;
    }
};

chrome.runtime.onMessage.addListener(onMessage);

screenButton.onclick = () => {
    multishot();
}
