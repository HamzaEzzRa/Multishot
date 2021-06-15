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

const getDevices = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('devices', (devices) => {
            devices = devices.devices;
            currentDevices = devices.slice(0);
            resolve(devices);
        });
    });
}

const saveDevices = (devices) => {
    chrome.storage.sync.set({'devices': devices}, () => {});
}

chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        currentDevices = defaultDevices.slice(0);
        saveDevices(currentDevices);
    }
});
