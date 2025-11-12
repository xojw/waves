document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('overlay');

    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    const activeToasts = new Map();
    let hoverTimeout;

    toastContainer.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        activeToasts.forEach(controller => controller.pause());
        updateToastPositions(true);
    });

    toastContainer.addEventListener('mouseleave', () => {
        hoverTimeout = setTimeout(() => {
            activeToasts.forEach(controller => controller.start());
            updateToastPositions(false);
        }, 100);
    });

    const updateToastPositions = (isHovered = false) => {
        const toasts = Array.from(toastContainer.querySelectorAll('.toast:not(.is-hiding)'));
        const visibleStackedCount = 3;

        toasts.forEach((toast, index) => {
            toast.style.zIndex = toasts.length - index;

            if (isHovered) {
                const toastHeight = toast.offsetHeight + 10;
                toast.style.transform = `translateY(-${index * toastHeight}px) scale(1)`;
                toast.style.opacity = '1';
            } else {
                if (index < visibleStackedCount) {
                    const scale = 1 - (index * 0.05);
                    const translateY = index * -12; 
                    toast.style.transform = `translateY(${translateY}px) scale(${scale})`;
                    toast.style.opacity = '1';
                } else {
                    const lastVisibleIndex = visibleStackedCount - 1;
                    const scale = 1 - (lastVisibleIndex * 0.05);
                    const translateY = lastVisibleIndex * -12;
                    toast.style.transform = `translateY(${translateY}px) scale(${scale})`;
                    toast.style.opacity = '0';
                }
            }
        });
    };
    
    window.showToast = function (type, message, iconName) {
        const maxToasts = 3;

        const currentToasts = toastContainer.querySelectorAll('.toast:not(.is-hiding)');

        if (currentToasts.length >= maxToasts) {
            const oldestToast = currentToasts[currentToasts.length - 1];
            hideToast(oldestToast);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(100%)';

        const icons = {
            'success': 'check-circle',
            'error': 'times-circle',
            'info': 'info-circle'
        };
        const iconClass = iconName ? `fa-solid fa-${iconName}` : (icons[type] || 'fa-solid fa-info-circle');

        const content = document.createElement('div');
        content.className = 'toast-content';
        content.innerHTML = `<i class="${iconClass}"></i><span>${message}</span>`;
        toast.appendChild(content);
        
        const controller = {
            id: null,
            remaining: 6000,
            startTime: null,
            pause: function() {
                if (this.id) {
                    clearTimeout(this.id);
                    this.id = null;
                    this.remaining -= (Date.now() - this.startTime);
                }
            },
            start: function() {
                if (this.id || this.remaining <= 0) return;
                this.startTime = Date.now();
                this.id = setTimeout(() => hideToast(toast), this.remaining);
            },
            clear: function() {
                clearTimeout(this.id);
            }
        };

        activeToasts.set(toast, controller);
        
        toastContainer.prepend(toast);

        setTimeout(() => {
            updateToastPositions(toastContainer.matches(':hover'));
        }, 0);

        controller.start();
    };

    function hideToast(toast) {
        if (!toast || !toast.parentNode || toast.classList.contains('is-hiding')) {
            return;
        }

        if (activeToasts.has(toast)) {
            activeToasts.get(toast).clear();
            activeToasts.delete(toast);
        }
        
        toast.style.zIndex = '-1';
        toast.classList.add('is-hiding');

        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });

        updateToastPositions(toastContainer.matches(':hover'));
    }
});