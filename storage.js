const savedDevices = [
    {
        type: "Phone",
        name: "iPhone 5/SE",
        width: 320,
        height: 568
    },
    {
        type: "Phone",
        name: "Galaxy S5",
        width: 360,
        height: 640
    },
    {
        type: "Phone",
        name: "iPhone 6/7/8",
        width: 375,
        height: 667
    },
    {
        type: "Phone",
        name: "iPhone X",
        width: 375,
        height: 812
    },
    {
        type: "Phone",
        name: "Pixel 2",
        width: 411,
        height: 731
    },
    {
        type: "Phone",
        name: "Pixel 2 XL",
        width: 411,
        height: 823
    },
    {
        type: "Phone",
        name: "iPhone 6/7/8 Plus",
        width: 414,
        height: 736
    },
    {
        type: "Tablet",
        name: "iPad",
        width: 768,
        height: 1024
    },
    {
        type: "Tablet",
        name: "iPad Pro",
        width: 1024,
        height: 1366
    },
    {
        type: "Laptop",
        name: "Laptop",
        width: 1366,
        height: 768
    },
    {
        type: "Laptop",
        name: "Laptop",
        width: 1440,
        height: 900
    },
    {
        type: "Desktop",
        name: "Desktop",
        width: 1680,
        height: 1050
    },
    {
        type: "Desktop",
        name: "Desktop",
        width: 1920,
        height: 1080
    },
    {
        type: "Desktop",
        name: "Desktop",
        width: 2560,
        height: 1440
    },
];

const getDevices = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get("devices", (devices) => {
            if (Object.keys(devices).length === 0)
                devices = savedDevices.slice(0);
            else
                devices = devices.devices;

            resolve(devices);
        });
    });
}

const saveDevices = (devices) => {
    chrome.storage.sync.set({"devices": devices}, () => {});
}
