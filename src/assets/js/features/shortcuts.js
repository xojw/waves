(function() {
  document.addEventListener('DOMContentLoaded', function() {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifierKey = isMac ? 'metaKey' : 'ctrlKey';
    const modifierSymbol = isMac ? '⌘' : 'Ctrl';

    const domCache = {
        wispInput: document.getElementById('wisp-server'),
        settingsMenu: document.getElementById('settings-menu'),
        gamesMenu: document.getElementById('games-menu'),
        shortcutPrompt: document.getElementById('shortcut-prompt'),
        mainSearch: document.getElementById('searchInput'),
        navSearch: document.getElementById('searchInputt'),
        coolIframe: document.getElementById('cool-iframe'),
        bookmarkNameInput: document.getElementById('bookmarkName'),
        bookmarkUrlInput: document.getElementById('bookmarkUrl')
    };
    
    const indicators = document.querySelectorAll('.shortcut-indicator, .shortcut-indicator-3');
    indicators.forEach(el => {
      el.innerHTML = el.innerHTML.replace(/Ctrl/g, modifierSymbol);
      if (!el.dataset.original) el.dataset.original = el.innerHTML;
    });

    const searchInputs = [
        domCache.mainSearch, 
        domCache.navSearch, 
        domCache.wispInput,
        domCache.bookmarkNameInput,
        domCache.bookmarkUrlInput
    ].filter(Boolean);

    async function triggerSubmit(inputElement) {
      if (inputElement && typeof inputElement.value !== 'undefined') {
        const query = inputElement.value.trim();
        if (query && window.WavesApp && typeof window.WavesApp.handleSearch === 'function') {
          await window.WavesApp.handleSearch(query);
        }
      }
    }

    function getPrioritizedInputs() {
      let inputsInOrder;
      if (domCache.gamesMenu && domCache.gamesMenu.classList.contains('show')) {
        inputsInOrder = [domCache.mainSearch, domCache.navSearch];
      } else {
        inputsInOrder = [domCache.mainSearch, domCache.navSearch];
      }

      return inputsInOrder.filter(Boolean);
    }

    function isVisible(el) {
      return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
    }

    function focusFirstVisibleInput() {
      const inputs = getPrioritizedInputs();
      for (const inp of inputs) {
        if (isVisible(inp)) {
          inp.focus();
          return inp;
        }
      }
      if (inputs.length > 0) {
        inputs[0].focus();
        return inputs[0];
      }
      return null;
    }

    function updateIndicatorState() {
      const inputIndicatorPairs = [{
        input: domCache.mainSearch,
        indicator: document.querySelector('.shortcut-indicator')
      }, {
        input: domCache.navSearch,
        indicator: document.querySelector('.shortcut-indicator-2')
      }, ].filter(pair => pair.input && pair.indicator);

      inputIndicatorPairs.forEach(pair => {
        const hasText = pair.input.value.trim() !== '';
        const isCurrentlyArrow = pair.indicator.classList.contains('arrow-mode');

        if (hasText === isCurrentlyArrow) return;

        pair.indicator.classList.add('fadeOut');
        setTimeout(() => {
          if (hasText) {
            pair.indicator.innerHTML = '<i class="fa-solid fa-arrow-turn-down-right"></i>';
            pair.indicator.classList.add('arrow-mode');
          } else {
            pair.indicator.innerHTML = pair.indicator.dataset.original;
            pair.indicator.classList.remove('arrow-mode');
          }
          pair.indicator.classList.remove('fadeOut');
          pair.indicator.classList.add('fadeIn');
        }, 100);
      });
    }

    updateIndicatorState();
    searchInputs.forEach(i => i.addEventListener('input', updateIndicatorState));

    document.addEventListener('keydown', e => {
      const activeEl = document.activeElement;
      const modifierPressed = e[modifierKey];

      if (e.key === 'Escape') {
        if (activeEl === domCache.wispInput) {
          activeEl.blur();
          e.preventDefault();
          return;
        }
        if (domCache.settingsMenu && domCache.settingsMenu.classList.contains('open') && typeof window.toggleSettingsMenu === 'function') {
          window.toggleSettingsMenu();
          e.preventDefault();
          return;
        }
        if (searchInputs.includes(activeEl)) {
          activeEl.blur();
          e.preventDefault();
        }
      }

      if (modifierPressed && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (
            (domCache.settingsMenu && domCache.settingsMenu.classList.contains('open')) || 
            (domCache.shortcutPrompt && domCache.shortcutPrompt.style.display === 'block') ||
            (domCache.gamesMenu && domCache.gamesMenu.classList.contains('open'))
        ) {
          return;
        }
        focusFirstVisibleInput();
      }

      if (modifierPressed && !e.shiftKey && !e.altKey) {
        if (searchInputs.includes(activeEl)) return; 

        const k = e.key.toLowerCase();
        let targetId;

        switch (k) {
          case 'h':
            window.location.pathname = '/';
            break;
          case 'g':
            if (window.showGamesMenu) window.showGamesMenu();
            break;
          case 's':
            if (typeof window.initializeSettingsMenu === 'function') {
              window.initializeSettingsMenu();
            }
            if (typeof window.toggleSettingsMenu === 'function') {
              window.toggleSettingsMenu();
            }
            break;
          default:
            return;
        }

        e.preventDefault();
        if (targetId) {
          const el = document.getElementById(targetId);
          if (el && !el.classList.contains('bookmarks-disabled')) {
            el.click();
          }
        }
      }
    });

    document.body.addEventListener('click', e => {
      const indicator = e.target.closest('.shortcut-indicator, .shortcut-indicator-3');
      if (!indicator) return;
      e.preventDefault();

      let associatedInputId;
      if (indicator.classList.contains('shortcut-indicator')) associatedInputId = 'searchInput';

      if (associatedInputId) {
        const associatedInput = document.getElementById(associatedInputId);
        if (associatedInput) {
          if (indicator.classList.contains('arrow-mode')) triggerSubmit(associatedInput);
          else associatedInput.focus();
        }
      }
    });

    if (domCache.coolIframe) {
      const iframeKeydownHandler = innerE => {
        const modifierPressed = innerE[modifierKey];

        if (modifierPressed || innerE.key === 'Escape') {
          let eventKey = innerE.key.toLowerCase();
          let shouldPrevent = false;

          if (eventKey === 'escape') {
            const doc = domCache.coolIframe.contentWindow.document;
            if (doc.activeElement && doc.activeElement.blur) doc.activeElement.blur();
            shouldPrevent = true;
          } else if (modifierPressed && (eventKey === 'e' || eventKey === 'h')) {
            document.dispatchEvent(new KeyboardEvent('keydown', {
              key: eventKey,
              [modifierKey]: true,
              bubbles: true
            }));
            shouldPrevent = true;
          }
          if (shouldPrevent) innerE.preventDefault();
        }
      };

      domCache.coolIframe.addEventListener('load', () => {
        if (!domCache.coolIframe.contentWindow) return; 

        const doc = domCache.coolIframe.contentWindow.document;

        if (doc.__wavesShortcutHandler) {
            doc.removeEventListener('keydown', doc.__wavesShortcutHandler);
        }
        doc.addEventListener('keydown', iframeKeydownHandler);
        doc.__wavesShortcutHandler = iframeKeydownHandler;

        doc.querySelectorAll('.shortcut-indicator, .shortcut-indicator-3')
          .forEach(el => {
            el.addEventListener('click', ev => {
              ev.preventDefault();
              window.parent.postMessage({
                type: 'iframe-focus-search'
              }, '*');
            });
          });
      });
    }

    window.addEventListener('message', msgEvt => {
      if (msgEvt.data?.type === 'iframe-focus-search') {
        const inp = focusFirstVisibleInput();
        if (inp && inp.value.trim()) triggerSubmit(inp);
      }
    });
  });
})();