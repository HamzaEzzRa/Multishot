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
        active: true,
    },
    {
        type: 'Mobile',
        name: 'Galaxy S5',
        width: 360,
        height: 640,
        active: true,
    },
    {
        type: 'Mobile',
        name: 'iPhone 6/7/8',
        width: 375,
        height: 667,
        active: true,
    },
    {
        type: 'Mobile',
        name: 'iPhone X',
        width: 375,
        height: 812,
        active: true,
    },
    {
        type: 'Mobile',
        name: 'Pixel 2',
        width: 411,
        height: 731,
        active: true,
    },
    {
        type: 'Mobile',
        name: 'Pixel 2 XL',
        width: 411,
        height: 823,
        active: true,
    },
    {
        type: 'Mobile',
        name: 'iPhone 6/7/8 Plus',
        width: 414,
        height: 736,
        active: true,
    },
    {
        type: 'Tablet',
        name: 'iPad',
        width: 768,
        height: 1024,
        active: true,
    },
    {
        type: 'Tablet',
        name: 'iPad Pro',
        width: 1024,
        height: 1366,
        active: true,
    },
    {
        type: 'Laptop',
        name: 'Laptop',
        width: 1366,
        height: 768,
        active: true,
    },
    {
        type: 'Laptop',
        name: 'Laptop',
        width: 1440,
        height: 900,
        active: true,
    },
    {
        type: 'Desktop',
        name: 'Desktop',
        width: 1680,
        height: 1050,
        active: true,
    },
    {
        type: 'Desktop',
        name: 'Desktop',
        width: 1920,
        height: 1080,
        active: true,
    },
    {
        type: 'Desktop',
        name: 'Desktop',
        width: 2560,
        height: 1440,
        active: true,
    },
];

let currentDevices = [];

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

const addPreset = (container, device, pushAtStart = false, addControls = true) => {
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
                if (d === device)
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

    if (pushAtStart)
        container.insertBefore(preset, container.firstChild);
    else
        container.appendChild(preset);
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
