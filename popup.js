const $ = (id) => document.getElementById(id);

var inputContainer = $('main-input');
var presetsContainer = $('main-presets');

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
        active: true,
    }
    currentDevices.unshift(newDevice);
    saveDevices(currentDevices);

    return newDevice;
};

const addPreset = (device) => {
    const type = device.type.toLowerCase(),
        name = device.name,
        width = device.width,
        height = device.height,
        active = device.active;

    let src = '';
    switch (type) {
        case 'desktop':
            src = './icons/desktop.svg';
            break;
        case 'laptop':
            src = './icons/laptop.svg';
            break;
        case 'tablet':
            src = './icons/tablet.svg';
            break;
        case 'mobile':
            src = './icons/mobile.svg';
            break;
        case 'custom':
            src = './icons/custom.svg';
            break;
        default:
            src = './icons/custom.svg';
            break;
    }

    const preset = document.createElement('div');
    preset.classList.add('preset');

    const detailsWrapper = document.createElement('div');
    detailsWrapper.style.display = 'inherit';
    preset.appendChild(detailsWrapper);

    const presetIcon = document.createElement('img');
    presetIcon.classList.add('preset-icon');
    presetIcon.setAttribute('src', src);
    detailsWrapper.appendChild(presetIcon);

    const presetContent = document.createElement('div');
    presetContent.classList.add('preset-content');
    detailsWrapper.appendChild(presetContent);

    const presetName = document.createElement('div');
    presetName.classList.add('preset-name');
    presetName.textContent = name;
    presetContent.appendChild(presetName);

    const presetSize = document.createElement('div');
    presetSize.classList.add('preset-size');
    presetSize.textContent = `${width} x ${height}`;
    presetContent.appendChild(presetSize);

    const presetControls = document.createElement('div');
    presetControls.classList.add('preset-controls');
    preset.appendChild(presetControls);

    const toggleInput = document.createElement('input');
    toggleInput.setAttribute('type', 'checkbox');
    if (active)
        toggleInput.setAttribute('checked', 'true');
    toggleInput.classList.add('preset-toggle');
    toggleInput.addEventListener('change', () => {
        currentDevices.map((d) => {
            if (d === device)
                d.active = toggleInput.checked;
        });
        saveDevices(currentDevices);
    });
    presetControls.appendChild(toggleInput);

    const removeButton = document.createElement('button');
    removeButton.classList.add('cancel-button');
    removeButton.addEventListener('click', () => {
        if (currentDevices.length > 1) {
            presetsContainer.removeChild(preset);
            removeItem(currentDevices, device);
            saveDevices(currentDevices);
        }
        else {
            const modal = document.createElement('div');
            modal.classList.add('warning-modal');

            const img = document.createElement('img');
            img.setAttribute('src', './icons/warning.svg');
            modal.appendChild(img);

            const p = document.createElement('p');
            p.textContent = 'At least one device preset should remain in the list ...';
            modal.appendChild(p);

            const button = document.createElement('button');
            button.classList.add('accept');
            button.textContent = 'Got it!';
            button.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
            modal.appendChild(button);

            document.body.appendChild(modal);
        }
    });
    const removeButtonWrapper = document.createElement('div');
    removeButtonWrapper.classList.add('remove-button-wrapper');
    removeButtonWrapper.appendChild(removeButton);
    presetControls.appendChild(removeButtonWrapper);

    presetsContainer.insertBefore(preset, presetsContainer.firstChild);
};

(function setupPresets() {
    getDevices().then((deviceList) => {
        deviceList.forEach((device) => {
            addPreset(device);
        });
    });
    $('add-button').addEventListener('click', (event) => {
        event.preventDefault();

        const newDevice = createDevice(
            $('device-name-input').value,
            $('device-width-input').value,
            $('device-height-input').value
        );
        addPreset(newDevice);

        $('preset-form').reset();
    })
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
                presetsContainer.style.transitionDuration = '0.45s';

                inputContainer.style.transform = 'translateX(0%)';
                presetsContainer.style.transform = 'translateX(100%)';
            }
            else if (href === 'presets') {
                inputContainer.style.transitionDuration = '0.45s';
                presetsContainer.style.transitionDuration = '0.45s';

                inputContainer.style.transform = 'translateX(-100%)';
                presetsContainer.style.transform = 'translateX(0%)';
            }
        });
    }
})();

let originalTab,
    currentZip,
    currentTab,
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
        name = '-' + name;
    }
    const device = deviceList[currentDevice];
    name = name + '-' + ($('screen-date').checked ? new Date().toISOString() + '-' : '') +
        device.width + 'x' + device.height + ext;
    return name;
}

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

    const device = deviceList[currentDevice];
    let blob = new Blob(blobs, {type: blobs[0].type});

    if ($('screen-subfolder').checked) {
        const folderName = device.name.replaceAll('/', '_');
        let folder = currentZip.folder(`${folderName}-${device.width}x${device.height}`);
        folder.file(filename, blob, {base64: true});
    }
    else
        currentZip.file(filename, blob, {base64: true});

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
    // if (!device.active) {
    //     if (currentDevice < deviceList.length - 1) {
    //         currentDevice += 1;
    //         captureDevice(currentDevice);
    //     }
    //     return;
    // }
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
        deviceList = deviceList.filter(device => device.active);
        
        if (deviceList && deviceList.length > 0)
            captureDevice(currentDevice);
    });
};
