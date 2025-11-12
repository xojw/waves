import { dom } from './dom.js';
import { toggleButtonAnimation } from '../core/utils.js';
import { navigateIframeTo } from '../core/iframe.js';

let isLoading = false;
let originalTitle = '';

export function showLoadingScreen() {
    if (isLoading) return;
    isLoading = true;

    NProgress?.start();
    if (dom.refreshBtnIcon) {
        dom.refreshBtnIcon.classList.remove('fa-rotate-right');
        dom.refreshBtn.classList.remove('spin-animation');
        dom.refreshBtnIcon.classList.add('fa-xmark');
    }
}

export function hideLoadingScreen() {
    if (!isLoading) return;

    NProgress?.done();
    document.title = originalTitle;
    isLoading = false;
    if (dom.erudaLoadingScreen) dom.erudaLoadingScreen.style.display = 'none';
    if (dom.refreshBtnIcon) {
        dom.refreshBtnIcon.classList.remove('fa-xmark');
        dom.refreshBtnIcon.classList.add('fa-rotate-right');
    }
}

function setupOnekoAnimation() {
    const onekoEl = document.getElementById('oneko');
    if (onekoEl) {
        const sleepingSpriteFrames = [
            [-2, 0],
            [-2, -1]
        ];
        let currentFrameIndex = 0;
        const setSleepingSprite = () => {
            const sprite = sleepingSpriteFrames[currentFrameIndex % sleepingSpriteFrames.length];
            onekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
            currentFrameIndex++;
        };
        setSleepingSprite();
        setInterval(setSleepingSprite, 400);
    }
}

export function showBrowserView() {
    document.body.classList.add('browser-view');
}

export function showHomeView() {
    document.body.classList.remove('browser-view');
}

export function initializeUI(getActiveTab) {
    originalTitle = document.title;

    const animationStyle = document.createElement('style');
    animationStyle.textContent = `@keyframes slideLeft{0%{transform:translateX(0) scale(1)}50%{transform:translateX(-5px) scale(.95)}100%{transform:translateX(0) scale(1)}}@keyframes slideRight{0%{transform:translateX(0) scale(1)}50%{transform:translateX(5px) scale(.95)}100%{transform:translateX(0) scale(1)}}.button-animate-back{animation:slideLeft .2s ease-in-out}.button-animate-forward{animation:slideRight .2s ease-in-out}@keyframes spin-refresh{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}.spin-animation{animation:spin-refresh .4s ease-in-out}.spin{animation:spinAnimation .3s linear}@keyframes spinAnimation{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}.spin{animation:spin .6s linear infinite;backface-visibility:hidden;perspective:1000px;will-change:transform}@keyframes spin{0%{transform:translateY(-50%) translateZ(0) rotate(0)}100%{transform:translateY(-50%) translateZ(0) rotate(360deg)}}.bookmarks-disabled{opacity:.5;transition:opacity .3s ease}`;
    document.head.appendChild(animationStyle);

    setupOnekoAnimation();

    dom.backBtn.addEventListener('click', async () => {
        const activeTab = getActiveTab();
        if (!activeTab) return;
        toggleButtonAnimation(dom.backBtn, 'button-animate-back');
        const urlToGo = activeTab.historyManager.back();
        
        if (urlToGo) {
            if (urlToGo.startsWith("https://cdn.jsdelivr.net/gh/gn-math/html@main/")) {
                await window.WavesApp.handleSearch(urlToGo, activeTab);
            } else {
                navigateIframeTo(activeTab.iframe, urlToGo);
            }
        }
    });

    dom.forwardBtn.addEventListener('click', async () => {
        const activeTab = getActiveTab();
        if (!activeTab) return;
        toggleButtonAnimation(dom.forwardBtn, 'button-animate-forward');
        const urlToGo = activeTab.historyManager.forward();

        if (urlToGo) {
            if (urlToGo.startsWith("https://cdn.jsdelivr.net/gh/gn-math/html@main/")) {
                await window.WavesApp.handleSearch(urlToGo, activeTab);
            } else {
                navigateIframeTo(activeTab.iframe, urlToGo);
            }
        }
    });

    dom.refreshBtn.addEventListener('click', async () => {
        const activeTab = getActiveTab();
        if (!activeTab) return;

        if (isLoading) {
            try {
                activeTab.iframe.contentWindow.stop();
            } catch (e) {
                console.warn("Could not stop iframe loading:", e.message);
            } finally {
                hideLoadingScreen();
            }
        } else {
            const manualUrl = activeTab.iframe.dataset.manualUrl;

            if (manualUrl) {
                if (window.WavesApp && typeof window.WavesApp.handleSearch === 'function') {
                    await window.WavesApp.handleSearch(manualUrl, activeTab);
                } else {
                    console.warn('Cannot refresh game: handleSearch is not available.');
                }
            } else if (activeTab.iframe.contentWindow && activeTab.iframe.src && activeTab.iframe.src !== 'about-blank') {
                showLoadingScreen();
                try {
                    activeTab.iframe.contentWindow.location.reload();
                } catch (e) {
                    console.warn("Failed to reload iframe, possibly cross-origin:", e.message);
                    navigateIframeTo(activeTab.iframe, activeTab.iframe.src);
                }
            }
        }
    });

    dom.fullscreenBtn.addEventListener('click', () => {
        const activeTab = getActiveTab();
        if (!activeTab) return;
        if (activeTab.iframe.requestFullscreen) activeTab.iframe.requestFullscreen();
        else if (activeTab.iframe.mozRequestFullScreen) activeTab.iframe.mozRequestFullScreen();
        else if (activeTab.iframe.webkitRequestFullscreen) activeTab.iframe.webkitRequestFullscreen();
        else if (activeTab.iframe.msRequestFullscreen) activeTab.iframe.msRequestFullscreen();
    });
}