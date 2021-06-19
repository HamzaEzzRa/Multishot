const $ = (id) => document.getElementById(id);

var presetsContainer = $('presets-container');

(function setup() {
    const formatOptionsContainer = $('image-format-options');
    const formatOptions = [...formatOptionsContainer.getElementsByClassName('format-option')];

    const qualityOption = $('image-quality');
    const delayOption = $('capture-delay');
    const nameOption = $('zip-name');
    const saveAsOption = $('save-as');

    getSettings().then((settings) => {
        const imageFormat = settings.imageFormat,
            imageQuality = settings.imageQuality,
            captureDelay = settings.captureDelay,
            zipName = settings.zipName,
            saveAs = settings.saveAs;

        formatOptions.forEach((option) => {
            if (option.value === imageFormat)
                option.selected = true;
            else
                option.selected = false;
        });

        qualityOption.value = imageQuality;
        delayOption.value = captureDelay;
        nameOption.value = zipName;
        saveAsOption.checked = saveAs;
    });

    getDevices().then((deviceList) => {
        deviceList.forEach((device) => {
            addPreset(presetsContainer, device, false, false, true);
        });
    });

    formatOptionsContainer.addEventListener('change', (event) => {
        currentSettings.imageFormat = event.target.value;
        saveSettings(currentSettings);
    });

    qualityOption.addEventListener('input', (event) => {
        const value = parseInt(event.target.value, 10);
        if (value < 1 || value > 100)
            qualityOption.reportValidity();
        else if (event.target.value.length > 0) {
            currentSettings.imageQuality = value;
            saveSettings(currentSettings);
        }
    });

    qualityOption.addEventListener('blur', (event) => {
        if (event.target.value.length < 1)
            qualityOption.reportValidity();
    });

    delayOption.addEventListener('input', (event) => {
        const value = parseInt(event.target.value);
        if (value < 0)
            delayOption.reportValidity();
        else if (event.target.value.length > 0) {
            currentSettings.captureDelay = value;
            saveSettings(currentSettings);
        }
    });

    delayOption.addEventListener('blur', (event) => {
        if (event.target.value.length < 1)
            delayOption.reportValidity();
    });

    nameOption.addEventListener('input', (event) => {
        const value = event.target.value;
        if (value.length > 0) {
            nameOption.value = value.replaceAll(new RegExp('[^A-Za-z0-9\-\_\ ]+', 'g'), '');
            currentSettings.zipName = nameOption.value;
            saveSettings(currentSettings);
        }
    });

    nameOption.addEventListener('blur', (event) => {
        if (event.target.value.length < 1)
            nameOption.reportValidity();
    });

    saveAsOption.addEventListener('change', () => {
        currentSettings.saveAs = saveAsOption.checked;
        saveSettings(currentSettings);
    });

    $('presets-reset').addEventListener('click', () => {
        const modal = document.createElement('div');
        modal.classList.add('warning-modal');

        const img = document.createElement('img');
        img.setAttribute('src', './icons/warning.svg');
        modal.appendChild(img);

        const p = document.createElement('p');
        p.textContent = 'Are you sure you want to go back to the default presets ?';
        modal.appendChild(p);

        const controlsWrapper = document.createElement('div');
        controlsWrapper.classList.add('controls-wrapper');
        modal.appendChild(controlsWrapper);

        const confirmButton = document.createElement('button');
        confirmButton.classList.add('accept');
        confirmButton.textContent = 'Yes';
        confirmButton.addEventListener('click', () => {
            resetDevices();
            window.location.reload();
        });
        controlsWrapper.appendChild(confirmButton);

        const cancelButton = document.createElement('button');
        cancelButton.classList.add('cancel');
        cancelButton.textContent = 'No';
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        controlsWrapper.appendChild(cancelButton);

        document.body.appendChild(modal);
    });

    const tabs = [...document.body.getElementsByClassName('tab-item')];

    const mainWrapper = $('body-main');
    const bodies = [...mainWrapper.getElementsByClassName('options-main')];

    tabs.forEach((tab) => {
        const split = tab.href.split('#');
        const href = split[split.length - 1];
        tab.addEventListener('click', () => {
            tab.setAttribute('aria-selected', 'true');
            tabs.forEach((otherTab) => {
                if (otherTab !== tab && href !== 'release-notes')
                    otherTab.setAttribute('aria-selected', 'false');
            });
            bodies.forEach((body) => {
                if (body.id === href)
                    body.style.display = 'block';
                else
                    body.style.display = 'none';
            });
            setTimeout(() => {
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                })
            }, 10);
        });
    });

    const hotkeyControl = $('hotkey-control');
    chrome.commands.getAll((commands) => {
        commands.forEach((command) => {
            const hotkeyWrapper = document.createElement('tr');
            hotkeyWrapper.classList.add('hotkey-container');

            const commandWrapper = document.createElement('td');
            const commandCode = document.createElement('code');
            commandCode.classList.add('hotkey-command');
            commandCode.textContent = command.shortcut.replaceAll('+', ' + ');
            commandWrapper.appendChild(commandCode);
            hotkeyWrapper.appendChild(commandWrapper);

            const commandDescription = document.createElement('td');
            commandDescription.classList.add('hotkey-desc');
            commandDescription.textContent = command.description;
            hotkeyWrapper.appendChild(commandDescription);

            hotkeyControl.appendChild(hotkeyWrapper);
        });
    });

    $('hotkey-edit').addEventListener('click', () => {
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
    });

    const versionControl = $('version-control');
    releases.forEach((release) => {
        const versionWrapper = document.createElement('div');
        versionWrapper.classList.add('version');

        const versionHeader = document.createElement('h3');
        versionHeader.classList.add('version-header');
        versionHeader.textContent = `v ${release.version} `;
        versionWrapper.appendChild(versionHeader);

        const versionDate = document.createElement('span');
        versionDate.classList.add('version-date');
        versionDate.textContent = `(${release.date})`;
        versionHeader.appendChild(versionDate);

        const noteList = document.createElement('ul');
        release.notes.forEach((note) => {
            const noteItem = document.createElement('li');
            note = note.split(/ (.+)/);
            noteItem.textContent = '';

            const noteKeyword = document.createElement('span');
            noteKeyword.style.fontWeight = '600';
            noteKeyword.textContent = `${note[0]} `;
            noteItem.appendChild(noteKeyword);

            const noteContent = document.createElement('span');
            noteContent.textContent = note[1];
            noteItem.appendChild(noteContent);

            noteList.appendChild(noteItem);
        });
        versionWrapper.appendChild(noteList);

        versionControl.appendChild(versionWrapper);
    });
})();
