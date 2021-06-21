const defaultSettings = {
    imageFormat: '.png',
    imageQuality: 80, // This only affects .jpeg files
    captureDelay: 0,
    zipName: 'Multishot',
    saveAs: false,
};

let currentSettings = {};

const defaultDevices = [
    {
        type: 'Mobile',
        name: 'iPhone 5/SE',
        width: 320,
        height: 568,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Mobile',
        name: 'Galaxy S5',
        width: 360,
        height: 640,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Mobile',
        name: 'iPhone 6/7/8',
        width: 375,
        height: 667,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Mobile',
        name: 'iPhone X',
        width: 375,
        height: 812,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Mobile',
        name: 'Pixel 2',
        width: 411,
        height: 731,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Mobile',
        name: 'Pixel 2 XL',
        width: 411,
        height: 823,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Mobile',
        name: 'iPhone 6/7/8 Plus',
        width: 414,
        height: 736,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Tablet',
        name: 'iPad',
        width: 768,
        height: 1024,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Tablet',
        name: 'iPad Pro',
        width: 1024,
        height: 1366,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Laptop',
        name: 'Laptop',
        width: 1366,
        height: 768,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Laptop',
        name: 'Laptop',
        width: 1440,
        height: 900,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Desktop',
        name: 'Desktop',
        width: 1680,
        height: 1050,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Desktop',
        name: 'Desktop',
        width: 1920,
        height: 1080,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
    {
        type: 'Desktop',
        name: 'Desktop',
        width: 2560,
        height: 1440,
        zoom: 100,
        active: true,
        createdAt: Date.now(),
    },
];

let currentDevices = [];

const zoomValues = [
    25,
    33,
    50,
    67,
    75,
    80,
    90,
    100,
    110,
    125,
    150,
    175,
    200,
    250,
    300,
    400,
    500,
]

const getSettings = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('settings', (settings) => {
            settings = settings.settings;
            currentSettings = {...settings};
            resolve(settings);
        });
    });
};

const saveSettings = (settings) => {
    chrome.storage.sync.set({'settings': settings}, () => {});
};

const resetSettings = () => {
    currentSettings = {...defaultSettings};
    saveSettings(currentSettings);
};

const getDevices = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('devices', (devices) => {
            devices = devices.devices;
            currentDevices = devices.slice(0);
            resolve(devices);
        });
    });
};

const saveDevices = (devices) => {
    chrome.storage.sync.set({'devices': devices}, () => {});
};

let dragSourceNode = null;

const addPreset = (container, device, pushAtStart = false, addControls = true, addZoom = false) => {
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
    preset.id = container.childElementCount;

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

    if (addControls) {
        const presetControls = document.createElement('div');
        presetControls.classList.add('preset-controls');
        preset.appendChild(presetControls);

        const toggleInputWrapper = document.createElement('div');
        toggleInputWrapper.classList.add('tooltip');
        toggleInputWrapper.style.display = 'inherit';
        presetControls.appendChild(toggleInputWrapper);

        const toggleInput = document.createElement('input');
        toggleInput.setAttribute('type', 'checkbox');
        if (active)
            toggleInput.setAttribute('checked', 'true');
        toggleInput.classList.add('preset-toggle');
        toggleInput.addEventListener('change', () => {
            currentDevices.map((d) => {
                if (isEqual(device, d))
                    d.active = toggleInput.checked;
            });
            saveDevices(currentDevices);
        });
        toggleInputWrapper.appendChild(toggleInput);

        const toggleTooltip = document.createElement('span');
        toggleTooltip.classList.add('tooltip-content');
        toggleTooltip.classList.add('tooltip-left');
        toggleTooltip.style.right = "68px";
        toggleTooltip.textContent = 'Toggle';
        toggleInputWrapper.appendChild(toggleTooltip);

        const removeButtonWrapper = document.createElement('div');
        removeButtonWrapper.classList.add('remove-button-wrapper');
        removeButtonWrapper.classList.add('tooltip');
        presetControls.appendChild(removeButtonWrapper);

        const removeButton = document.createElement('button');
        removeButton.classList.add('cancel-button');
        removeButton.addEventListener('click', () => {
            if (currentDevices.length > 1) {
                container.removeChild(preset);
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
                p.textContent = 'At least one preset should remain in the list ...';
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
        removeButtonWrapper.appendChild(removeButton);

        const removeTooltip = document.createElement('span');
        removeTooltip.classList.add('tooltip-content');
        removeTooltip.classList.add('tooltip-bottom');
        removeTooltip.style.top = "43px";
        removeTooltip.style.right = "0px";
        removeTooltip.textContent = 'Delete';
        removeButtonWrapper.appendChild(removeTooltip);
    }
    else if (addZoom) {
        preset.draggable = true;
        preset.addEventListener('dragstart', (event) => {
            preset.style.opacity = '0.5';
            
            dragSourceNode = preset;

            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/html', preset.innerHTML);
        });
        preset.addEventListener('dragover', (event) => {
            event.preventDefault();
            return false;
        });
        preset.addEventListener('dragenter', (event) => {
            preset.classList.add('over');
        });
        preset.addEventListener('dragleave', (event) => {
            preset.classList.remove('over');
        });
        preset.addEventListener('dragend', (event) => {
            preset.style.opacity = '1';
            [...container.getElementsByClassName('preset')].forEach((element) => {
                element.classList.remove('over');
            });
        });
        preset.addEventListener('drop', async (event) => {
            event.stopPropagation();

            if (dragSourceNode !== preset) {
                dragSourceNode.innerHTML = preset.innerHTML;
                preset.innerHTML = event.dataTransfer.getData('text/html');

                const deviceList = await getDevices();
                [deviceList[preset.id], deviceList[dragSourceNode.id]] = [deviceList[dragSourceNode.id], deviceList[preset.id]];
                saveDevices(deviceList);
            }

            return false;
        });

        const controlsContainer = document.createElement('div');
        controlsContainer.classList.add('controls-container');

        const zoomAmount = document.createElement('span');
        zoomAmount.style.fontSize = '17px';
        zoomAmount.textContent = `${device.zoom}%`;

        const resetZoomContainer = document.createElement('div');
        resetZoomContainer.classList.add('tooltip');
        controlsContainer.appendChild(resetZoomContainer);

        const resetZoom = document.createElement('button');
        resetZoom.classList.add('reset-zoom');
        resetZoomContainer.appendChild(resetZoom);
        resetZoom.addEventListener('click', async () => {
            if (device.zoom !== 100) {
                const deviceList = await getDevices();
                zoomAmount.textContent = '100%';
                deviceList.map((d) => {
                    if (isEqual(device, d)) {
                        device.zoom = 100;
                        d.zoom = 100;
                    }
                })
                saveDevices(deviceList);
            }
        });

        const resetTooltip = document.createElement('span');
        resetTooltip.classList.add('tooltip-content');
        resetTooltip.textContent = 'Reset default zoom';
        resetTooltip.style.marginRight = '34px';
        resetZoomContainer.appendChild(resetTooltip);

        const zoomContainer = document.createElement('div');
        zoomContainer.classList.add('zoom-container');
        controlsContainer.appendChild(zoomContainer);

        const zoomHeader = document.createElement('span');
        zoomHeader.classList.add('zoom-header');
        zoomHeader.textContent = 'Zoom';
        zoomContainer.appendChild(zoomHeader);

        const presetControls = document.createElement('div');
        presetControls.classList.add('preset-controls');
        zoomContainer.appendChild(presetControls);

        let zoomIndex = zoomValues.indexOf(device.zoom);
        const minusButton = document.createElement('button');
        minusButton.classList.add('minus-button');
        presetControls.appendChild(minusButton);
        minusButton.addEventListener('click', async () => {
            if (zoomIndex > 0) {
                zoomIndex -= 1;
                const newZoom = zoomValues[zoomIndex];
                zoomAmount.textContent = `${newZoom}%`;
                const deviceList = await getDevices();
                console.log(deviceList);
                deviceList.map((d) => {
                    if (isEqual(device, d)) {
                        device.zoom = newZoom;
                        d.zoom = newZoom;
                    }
                });
                saveDevices(deviceList);
                console.log(deviceList);
            }
        });

        presetControls.appendChild(zoomAmount);

        const plusButton = document.createElement('button');
        plusButton.classList.add('add-button');
        presetControls.appendChild(plusButton);
        plusButton.addEventListener('click', async () => {
            if (zoomIndex < zoomValues.length - 1) {
                zoomIndex += 1;
                const newZoom = zoomValues[zoomIndex];
                zoomAmount.textContent = `${newZoom}%`;
                const deviceList = await getDevices();
                console.log(deviceList);
                deviceList.map((d) => {
                    if (isEqual(device, d)) {
                        device.zoom = newZoom;
                        d.zoom = newZoom;
                    }
                });
                saveDevices(deviceList);
                console.log(deviceList);
            }
        });

        preset.appendChild(controlsContainer);
    }

    if (pushAtStart)
        container.insertBefore(preset, container.firstChild);
    else
        container.appendChild(preset);

    console.log(currentDevices);
};

const resetDevices = () => {
    currentDevices = defaultDevices.slice(0);
    saveDevices(currentDevices);
};

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        resetDevices();
        resetSettings();
    }
});

chrome.commands.onCommand.addListener((command) => {
    chrome.runtime.sendMessage({ msg: command });
});
