const $ = (id) => document.getElementById(id);

var inputContainer = $('main-input');
var presetsMain = $('main-presets');
var presetsContainer = $('presets-container');
var screenButton = $('screen-button');

var screenshotting = false;
var maxWidth = 0;
var maxHeight = 0;

const createDevice = (name, width, height) => {
    const newDevice = {
        type: 'Custom',
        name: name,
        width: parseInt(width, 10),
        height: parseInt(height, 10),
        zoom: 100,
        active: true,
        createdAt: Date.now(),
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
    const formatSelect = $('screen-type'),
        fullscreenParam = $('screen-full'),
        dateParam = $('screen-date'),
        subfolderParam = $('screen-subfolder');

    getHome().then((homeParams) => {
        formatSelect.value = homeParams.imageType;
        fullscreenParam.checked = homeParams.fullPageCapture;
        dateParam.checked = homeParams.addDateToName;
        subfolderParam.checked = homeParams.outputInSubfolders;
    });
    getSettings().then((settings) => {
        if (settings.rememberHome) {
            formatSelect.addEventListener('change', (event) => {
                currentHome.imageType = event.target.value;
                saveHome(currentHome);
            });
            fullscreenParam.addEventListener('change', (event) => {
                currentHome.fullPageCapture = fullscreenParam.checked;
                saveHome(currentHome);
            });
            dateParam.addEventListener('change', (event) => {
                currentHome.addDateToName = dateParam.checked;
                saveHome(currentHome);
            });
            subfolderParam.addEventListener('change', (event) => {
                currentHome.outputInSubfolders = subfolderParam.checked;
                saveHome(currentHome);
            });
        }
    });
    const form = $('preset-form');
    $('add-button').addEventListener('click', async (event) => {
        if (form.checkValidity()) {
            event.preventDefault();

            const newDevice = createDevice(
                $('device-name-input').value,
                $('device-width-input').value,
                $('device-height-input').value
            );
            addPreset(presetsContainer, newDevice, true, true, false, true);
    
            form.reset();

            const extensionTabs = await getOwnTabs();
            extensionTabs.forEach((t) => {
                urlContent = t.url.split('/');
                if (urlContent.length > 0 && urlContent[urlContent.length - 1].includes('options.html'))
                    chrome.tabs.reload(t.id);
            });
        }
    })
    $('settings-button').addEventListener('click', () => {
        chrome.tabs.create({ url: './options.html' });
    });
})();

(function setupNavBar() {
    var btnContainer = $('bottom-navbar');

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
    outputFiles = [],
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
};

const displayCapture = (blobs, sizes, format, filenames, settings) => {
    if (!filenames || !filenames.length) {
        console.warn('uh-oh');
        return;
    }

    createCaptureWindow(blobs, sizes, format, filenames, settings);
};

const blobToDataURL = (blob, callback) => {
    var reader = new FileReader();
    reader.onloadend = () => {
        callback(reader.result);
    };
    reader.readAsDataURL(blob);
};

const horizontalCenterPos = (doc, text) => {
    var textWidth = doc.getStringUnitWidth(text) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    return (doc.internal.pageSize.width - textWidth) * 0.5;
};

const createCaptureWindow = (blobs, sizes, format, filenames, settings, fileIndex = 0) => {
    let filename = filenames[fileIndex];
    let last = fileIndex === filenames.length - 1;

    maxWidth = sizes[fileIndex].width > maxWidth ? sizes[fileIndex].width : maxWidth;
    maxHeight = sizes[fileIndex].height > maxHeight ? sizes[fileIndex].height : maxHeight;

    const device = deviceList[currentDevice];
    let blob = new Blob(blobs, {type: `image/${format}`});
    outputFiles.push({
        file: blob,
        name: filename,
        size: sizes[fileIndex],
    });

    if (!settings.saveToCloud && !settings.savePDF) {
        if ($('screen-subfolder').checked) {
            const folderName = device.name.replaceAll('/', '_');
            let folder = currentZip.folder(`${folderName}-${device.width}x${device.height}-${device.zoom}%`);
            folder.file(filename, blob, {base64: true});
        }
        else
            currentZip.file(filename, blob, {base64: true});
    }

    fileIndex += 1;
    currentDevice += 1;

    if (!last)
        createCaptureWindow(blobs, sizes, filenames, settings, fileIndex);
    else {
        if (currentDevice < deviceList.length)
            captureDevice(currentDevice, settings);
        else {
            chrome.windows.remove(resultWindowId, () => {
                chrome.tabs.setZoom(originalTab.id, originalZoom);
            });

            if (!settings.saveToCloud) {
                if (!settings.savePDF) {
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
                }
                else {
                    const doc = new jsPDF({
                        orientation: 'p',
                        unit: 'mm',
                        format: 'a4',
                        putOnlyUsedFonts: true,
                        compress: true,
                    });
                    const maxPageWidth = doc.internal.pageSize.width - 30;
                    const maxPageHeight = doc.internal.pageSize.height - 30;
                    doc.setFontSize(12);

                    const dpi = 250;
                    const conversion = 25.4 / dpi;                    

                    let j = 0;
                    for (let i = 0; i < outputFiles.length; i++) {
                        let width = outputFiles[i].size.width * conversion;
                        width = width <= maxPageWidth ? width : Math.round(outputFiles[i].size.width / maxWidth * maxPageWidth);
                        let height = outputFiles[i].size.height * conversion;
                        height = height <= maxPageHeight ? height : Math.round(outputFiles[i].size.height / maxHeight * maxPageHeight);
                        
                        blobToDataURL(outputFiles[i].file, (dataURL) => {
                            doc.addImage(
                                dataURL,
                                format.toUpperCase(),
                                (maxPageWidth + 30 - width) * 0.5,
                                (maxPageHeight + 15 - height) * 0.5,
                                width,
                                height,
                                undefined,
                                'FAST'
                            );
                            const text = outputFiles[i].name;
                            doc.text(horizontalCenterPos(doc, text), (maxPageHeight + 15 - height) * 0.5 + height + 10, text);
                            j += 1;
                            if (j !== outputFiles.length) {
                                doc.addPage('a4', 'p');
                            }
                            else {
                                const pdfBlob = doc.output('blob', {filename: settings.zipName});
                                const url = URL.createObjectURL(pdfBlob);

                                screenButton.childNodes.forEach((node) => {
                                    if (node.style.display !== 'none')
                                        node.style.display = 'none';
                                    else
                                        node.style.display = 'block';
                                });
                                screenshotting = false;
                                screenButton.disabled = false;

                                chrome.downloads.download({
                                    url,
                                    filename: `${settings.zipName}.pdf`,
                                    saveAs: settings.saveAs
                                });
                            }
                        });
                    }
                }
            }
            else {
                CloudinaryAPI.upload(outputFiles).then((res) => {
                    const textBlob = new Blob(res.urls, {type: "text/plain;charset=utf-8"});
                    const url =  URL.createObjectURL(textBlob);

                    screenButton.childNodes.forEach((node) => {
                        if (node.style.display !== 'none')
                            node.style.display = 'none';
                        else
                            node.style.display = 'block';
                    });
                    screenshotting = false;
                    screenButton.disabled = false;

                    chrome.downloads.download({ url, filename: `${settings.zipName}.txt`, saveAs: settings.saveAs });
                }, (err) => {
                    console.error(err);

                    screenButton.childNodes.forEach((node) => {
                        if (node.style.display !== 'none')
                            node.style.display = 'none';
                        else
                            node.style.display = 'block';
                    });
                    screenshotting = false;
                    screenButton.disabled = false;
                });
            }
        }
    }
};

const errorHandler = (reason) => {
    console.error(reason);
};

const progress = (complete) => {
    // console.warn(complete * 100 + '%');
};

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
            if ((format !== '.png' && format !== '.jpeg') || settings.savePDF)
                format = '.png';
            
            format = format.split('.')[1];
    
            const fullPage = $('screen-full').checked;

            chrome.tabs.onUpdated.removeListener(listener);
            
            chrome.tabs.setZoom(tabId, device.zoom / 100, () => {
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
    maxWidth = 0;
    maxHeight = 0;

    currentZip = null;
    outputBlobs = [];
    chrome.tabs.query({active: true, currentWindow: true}, async (tabs) => {
        originalTab = tabs[0];
        originalZoom = await chrome.tabs.getZoom();
        deviceList = await getDevices();
        deviceList = deviceList.filter(device => device.active);

        settings = await getSettings();
        if (!settings.savePDF || !settings.saveToCloud)
            currentZip = new JSZip();
        
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
