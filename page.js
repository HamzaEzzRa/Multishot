var CAPTURE_DELAY = 150;

var onMessage = (data, sender, callback) => {
    if (data.msg === 'scrollPage') {
        getPositions(callback, true);
        return true;
    }
    else if (data.msg === 'visibleOnly') {
        getPositions(callback, false);
        return true;
    }
    else
        console.error('Unknown message received: ' + data.msg);
}

if (!window.hasScreenCapturePage) {
    window.hasScreenCapturePage = true;
    chrome.runtime.onMessage.addListener(onMessage);
}

var max = (nums) => Math.max.apply(Math, nums.filter((x) => { return x; }));

var getPositions = (callback, fullPage) => {
    const body = document.body,
        originalBodyOverflowYStyle = body ? body.style.overflowY : '',
        originalX = window.scrollX,
        originalY = window.scrollY,
        originalOverflowStyle = document.documentElement.style.overflow;

    if (body)
        body.style.overflowY = 'visible';

    let widths = [
            document.documentElement.clientWidth,
            body ? body.scrollWidth : 0,
            document.documentElement.scrollWidth,
            body ? body.offsetWidth : 0,
            document.documentElement.offsetWidth
        ],
        heights = [
            document.documentElement.clientHeight,
            body ? body.scrollHeight : 0,
            document.documentElement.scrollHeight,
            body ? body.offsetHeight : 0,
            document.documentElement.offsetHeight
        ],
        fullWidth = max(widths),
        fullHeight = max(heights),
        windowWidth = window.innerWidth,
        windowHeight = window.innerHeight,
        arrangements = [],

        scrollPad = 200,
        yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
        xDelta = windowWidth,
        yPos = fullHeight - windowHeight,
        xPos,
        numArrangements;

    if (fullWidth <= xDelta + 1)
        fullWidth = xDelta;

    document.documentElement.style.overflow = 'hidden';

    if (fullPage) {
        while (yPos > -yDelta) {
            xPos = 0;
            while (xPos < fullWidth) {
                arrangements.push([xPos, yPos]);
                xPos += xDelta;
            }
            yPos -= yDelta;
        }
    }
    else
        arrangements.push([originalX, originalY]);

    const arText = [];
    arrangements.forEach((x) => { arText.push('[' + x.join(',') + ']'); });

    numArrangements = arrangements.length;

    const cleanUp = () => {
        document.documentElement.style.overflow = originalOverflowStyle;
        if (body)
            body.style.overflowY = originalBodyOverflowYStyle;

        window.scrollTo(originalX, originalY);
    };

    (function processArrangements() {
        if (!arrangements.length) {
            cleanUp();
            if (callback)
                callback();

            return;
        }

        let next = arrangements.shift();
            
        if (fullPage)
            window.scrollTo(next[0], next[1]);

        const data = {
            msg: 'capture',
            x: fullPage ? window.scrollX : 0,
            y: fullPage ? window.scrollY : 0,
            complete: (numArrangements - arrangements.length) / numArrangements,
            windowWidth: windowWidth,
            totalWidth: fullPage ? fullWidth : window.innerWidth,
            totalHeight: fullPage ? fullHeight : window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
        };


        window.setTimeout(() => {
            const cleanUpTimeout = window.setTimeout(cleanUp, 1250);

            chrome.runtime.sendMessage(data, (captured) => {
                window.clearTimeout(cleanUpTimeout);

                if (captured)
                    processArrangements();
                else
                    cleanUp();
            });

        }, fullPage ? CAPTURE_DELAY : 0);
    })();
};
