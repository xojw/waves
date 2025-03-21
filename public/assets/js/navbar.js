const style = document.createElement('style');
style.textContent = `
@keyframes slideLeft {0% { transform: translateX(0); } 50% { transform: translateX(-5px); } 100% { transform: translateX(0); }}
@keyframes slideRight {0% { transform: translateX(0); } 50% { transform: translateX(5px); } 100% { transform: translateX(0); }}
.button-animate-back { animation: slideLeft 0.3s ease-in-out; }
.button-animate-forward { animation: slideRight 0.3s ease-in-out; }
`;
document.head.appendChild(style);

const historyStack = [];
let currentIndex = -1;

const elements = {
	refreshIcon: document.getElementById('refreshIcon'),
	fullscreenIcon: document.getElementById('fullscreenIcon'),
	backIcon: document.getElementById('backIcon'),
	forwardIcon: document.getElementById('forwardIcon'),
	searchInput2: document.getElementById('searchInputt'),
	iframe: document.getElementById('cool-iframe')
};

let loadingFallbackTimeout;

elements.refreshIcon.addEventListener('click', () => handleRefresh());
elements.fullscreenIcon.addEventListener('click', () => handleFullscreen());
elements.backIcon.addEventListener('click', () => handleBack());
elements.forwardIcon.addEventListener('click', () => handleForward());

function showLoadingScreen() {
	const loadingScreen = document.querySelector(".loading-screen");
	if (!loadingScreen) {
		console.error("Loading screen element not found.");
		return;
	}
	if (typeof NProgress !== 'undefined') {
		NProgress.start();
	}
	loadingScreen.style.display = 'flex';
	setTimeout(() => {
		loadingScreen.style.transition = 'opacity 0.5s ease';
		loadingScreen.style.opacity = 1;
	}, 10);
	clearTimeout(loadingFallbackTimeout);
	loadingFallbackTimeout = setTimeout(() => {
		hideLoadingScreen();
	}, 10000);
}

function hideLoadingScreen() {
	const loadingScreen = document.querySelector(".loading-screen");
	if (!loadingScreen) {
		console.error("Loading screen element not found.");
		return;
	}
	loadingScreen.style.transition = 'opacity 0.5s ease';
	loadingScreen.style.opacity = 0;
	setTimeout(() => {
		loadingScreen.style.display = 'none';
		if (typeof NProgress !== 'undefined') {
			NProgress.done();
		}
	}, 500);
	clearTimeout(loadingFallbackTimeout);
}

function handleRefresh() {
	elements.refreshIcon.classList.add('spin');
	const iframe = elements.iframe;
	const currentUrl = iframe.contentWindow.location.href;
	if (normalizeUrl(currentUrl) !== normalizeUrl(historyStack[currentIndex] || '')) {
		addToHistory(currentUrl);
	}
	iframe.contentWindow.location.reload(true);
	setTimeout(() => elements.refreshIcon.classList.remove('spin'), 300);
}

function handleFullscreen() {
	const iframe = elements.iframe;
	if (iframe && iframe.tagName === 'IFRAME') {
		iframe.requestFullscreen();
	}
}

function handleBack() {
	toggleButtonAnimation(elements.backIcon, 'button-animate-back');
	if (currentIndex > 0) {
		currentIndex--;
		updateIframeSrc();
	}
}

function handleForward() {
	toggleButtonAnimation(elements.forwardIcon, 'button-animate-forward');
	if (currentIndex < historyStack.length - 1) {
		currentIndex++;
		updateIframeSrc();
	}
}

function toggleButtonAnimation(button, animationClass) {
	button.classList.add(animationClass);
	setTimeout(() => button.classList.remove(animationClass), 200);
}

function normalizeUrl(urlStr) {
	try {
		const url = new URL(urlStr);
		url.searchParams.delete("ia");
		return url.toString();
	} catch (e) {
		return urlStr;
	}
}

function addToHistory(url) {
	const normalized = normalizeUrl(url);
	if (currentIndex >= 0 && normalizeUrl(historyStack[currentIndex]) === normalized) return;
	if (currentIndex < historyStack.length - 1) {
		historyStack.splice(currentIndex + 1);
	}
	historyStack.push(url);
	currentIndex++;
	updateNavButtons();
	updateDecodedSearchInput();
}

function updateIframeSrc() {
	showLoadingScreen();
	elements.iframe.src = historyStack[currentIndex];
	updateNavButtons();
	updateDecodedSearchInput();
}

function updateNavButtons() {
	const backIcon = elements.backIcon;
	const forwardIcon = elements.forwardIcon;
	const isAtStart = currentIndex <= 0;
	const isAtEnd = currentIndex >= historyStack.length - 1;
	backIcon.disabled = isAtStart;
	forwardIcon.disabled = isAtEnd;
	backIcon.classList.toggle('disabled', isAtStart);
	forwardIcon.classList.toggle('disabled', isAtEnd);
}

function updateDecodedSearchInput() {
	if (elements.searchInput2) {
		const url = historyStack[currentIndex] || elements.iframe.src;
		elements.searchInput2.value = decodeUrl(url);
	}
}

window.addToHistory = addToHistory;
window.updateDecodedSearchInput = updateDecodedSearchInput;
window.normalizeUrl = normalizeUrl;

function detectIframeNavigation() {
	try {
		const iframeWindow = elements.iframe.contentWindow;
		const pushState = iframeWindow.history.pushState;
		const replaceState = iframeWindow.history.replaceState;
		iframeWindow.history.pushState = function() {
			pushState.apply(this, arguments);
			handleIframeNavigation(iframeWindow.location.href);
		};
		iframeWindow.history.replaceState = function() {
			replaceState.apply(this, arguments);
			handleIframeNavigation(iframeWindow.location.href);
		};
		iframeWindow.addEventListener('popstate', () => handleIframeNavigation(iframeWindow.location.href));
		iframeWindow.addEventListener('hashchange', () => handleIframeNavigation(iframeWindow.location.href));
	} catch (error) {
		console.error("Error detecting iframe navigation:", error);
	}
}

function handleIframeNavigation(url) {
	if (url && normalizeUrl(url) !== normalizeUrl(historyStack[currentIndex] || '')) {
		showLoadingScreen();
		addToHistory(url);
	}
}

elements.iframe.addEventListener('load', () => {
	try {
		detectIframeNavigation();
		if (historyStack.length === 0) {
			addToHistory(elements.iframe.contentWindow.location.href);
		} else {
			handleIframeNavigation(elements.iframe.contentWindow.location.href);
		}
	} catch (error) {
		console.error("Error detecting iframe navigation:", error);
	} finally {
		hideLoadingScreen();
	}
});
