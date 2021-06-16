(function setup() {
    const tabsWrapper = document.getElementById('sidebar-tabs');
    const tabs = [...tabsWrapper.getElementsByClassName('tab-item')];

    const mainWrapper = document.getElementById('body-main');
    const bodies = [...mainWrapper.getElementsByClassName('options-main')];

    tabs.forEach((tab) => {
        const split = tab.href.split('#');
        const href = split[split.length - 1];
        tab.addEventListener('click', () => {
            tab.setAttribute('aria-selected', 'true');
            tabs.forEach((otherTab) => {
                if (otherTab !== tab)
                    otherTab.setAttribute('aria-selected', 'false');
            });
            bodies.forEach((body) => {
                if (body.id === href)
                    body.style.display = "block";
                else
                    body.style.display = "none";
            });
        });
    });
})();