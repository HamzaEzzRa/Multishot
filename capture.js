const MAX_PRIMARY_DIMENSION = 15000 * 2,
    MAX_SECONDARY_DIMENSION = 4000 * 2,
    MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;

const isValidUrl = (string) => {
    let url;

    try {
        url = new URL(string);
    } catch (ex) {
        return false;
    }

    return url.protocol === 'http:' || url.protocol === 'https:';
};

const initiateCapture = (tab, fullPage, callback) => {
    chrome.tabs.sendMessage(tab.id, {msg: fullPage ? 'scrollPage' : 'visibleOnly'}, () => {
        callback();
    });
};

const capture = (data, screenshots, sendResponse, format) => {
    chrome.tabs.captureVisibleTab(resultWindowId, { format }, (dataURI) => {
        if (dataURI) {
            let image = new Image();
            image.onload = () => {
                data.image = {width: image.width, height: image.height};

                if (data.windowWidth !== image.width) {
                    let scale = image.width / data.windowWidth;
                    data.x *= scale;
                    data.y *= scale;
                    data.totalWidth *= scale;
                    data.totalHeight *= scale;
                }

                if (!screenshots.length) {
                    Array.prototype.push.apply(
                        screenshots,
                        initScreenshots(data.totalWidth, data.totalHeight)
                    );
                }

                filterScreenshots(
                    data.x, data.y, image.width, image.height, screenshots
                ).forEach((screenshot) => {
                    screenshot.ctx.drawImage(
                        image,
                        data.x - screenshot.left,
                        data.y - screenshot.top
                    );
                });

                sendResponse(JSON.stringify(data, null, 4) || true);
            };
            image.src = dataURI;
        }
    });
};

const initScreenshots = (totalWidth, totalHeight) => {
    let badSize = (totalHeight > MAX_PRIMARY_DIMENSION ||
            totalWidth > MAX_PRIMARY_DIMENSION ||
            totalHeight * totalWidth > MAX_AREA),
        biggerWidth = totalWidth > totalHeight,
        maxWidth = (!badSize ? totalWidth :
            (biggerWidth ? MAX_PRIMARY_DIMENSION : MAX_SECONDARY_DIMENSION)),
        maxHeight = (!badSize ? totalHeight :
            (biggerWidth ? MAX_SECONDARY_DIMENSION : MAX_PRIMARY_DIMENSION)),
        numCols = Math.ceil(totalWidth / maxWidth),
        numRows = Math.ceil(totalHeight / maxHeight),
        row, col, canvas, left, top;

    let canvasIndex = 0;
    let result = [];

    for (row = 0; row < numRows; row++) {
        for (col = 0; col < numCols; col++) {
            canvas = document.createElement('canvas');
            canvas.width = (col == numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth);
            canvas.height = (row == numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight);

            left = col * maxWidth;
            top = row * maxHeight;

            result.push({
                canvas: canvas,
                ctx: canvas.getContext('2d'),
                index: canvasIndex,
                left: left,
                right: left + canvas.width,
                top: top,
                bottom: top + canvas.height
            });
            canvasIndex++;
        }
    }
    return result;
};

const filterScreenshots = (imgLeft, imgTop, imgWidth, imgHeight, screenshots) => {
    let imgRight = imgLeft + imgWidth,
        imgBottom = imgTop + imgHeight;
    return screenshots.filter((screenshot) => {
        return (imgLeft < screenshot.right &&
            imgRight > screenshot.left &&
            imgTop < screenshot.bottom &&
            imgBottom > screenshot.top);
    });
};

const getBlobs = (screenshots) => {
    return screenshots.map((screenshot) => {
        const dataURI = screenshot.canvas.toDataURL();

        const byteString = atob(dataURI.split(',')[1]);

        const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++)
            ia[i] = byteString.charCodeAt(i);

        return new Blob([ab], {type: mimeString});
    });
};

const saveBlob = (blob, filename, callback, errback) => {
    const size = blob.size + (1024 / 2);

    callback(filename);
    // const reqFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    // reqFileSystem(window.TEMPORARY, size, (fs) => {
    //     fs.root.getFile(filename, {create: true}, (fileEntry) => {
    //         fileEntry.createWriter((fileWriter) => {
    //             fileWriter.onwriteend = () => {
    //                 const urlName = ('filesystem:chrome-extension://' +
    //                     chrome.i18n.getMessage('@@extension_id') +
    //                     '/temporary/' + filename);

    //                 callback(urlName);
    //             };
    //             fileWriter.write(blob);
    //         }, errback);
    //     }, errback);
    // }, errback);
};

const captureToBlobs = (tab, format, fullPage, callback, errback, progress) => {
    let loaded = false,
        screenshots = [],
        timeout = 3000,
        timedOut = false,
        noOp = () => {};

    callback = callback || noOp;
    errback = errback || noOp;
    progress = progress || noOp;

    if (!isValidUrl(tab.url))
        errback('invalid url');

    const listener = (request, sender, sendResponse) => {
        if (request.msg === 'capture') {
            progress(request.complete);
            capture(request, screenshots, sendResponse, format);

            return true;
        }
        else {
            console.error('Unknown message received from content script: ' + request.msg);
            errback('internal error');
            return false;
        }
    };

    chrome.runtime.onMessage.addListener(listener);
    
    chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['page.js'] }, () => {
        if (timedOut) {
            console.error('Timed out too early while waiting for chrome.scripting.executeScript. Try increasing the timeout.');
            chrome.runtime.onMessage.removeListener(listener);
        }
        else {
            loaded = true;
            progress(0);

            initiateCapture(tab, fullPage, () => {
                chrome.runtime.onMessage.removeListener(listener);
                callback(getBlobs(screenshots));
            });
        }
    });

    window.setTimeout(() => {
        if (!loaded) {
            timedOut = true;
            errback('execute timeout');
        }
    }, timeout);
};

const captureToFiles = (tab, filename, format, fullPage, callback, errback, progress) => {
    captureToBlobs(tab, format, fullPage, (blobs) => {
        let i = 0,
            len = blobs.length,
            filenames = [];

        (function doNext() {
            saveBlob(blobs[i], filename, (filename) => {
                i++;
                filenames.push(filename);
                i >= len ? callback(blobs, filenames) : doNext();
            }, errback);
        })();
    }, errback, progress);
};
