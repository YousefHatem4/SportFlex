import { useCallback, useSyncExternalStore } from 'react';

function readTheme(defaultDark) {
    if (typeof window === 'undefined') {
        return defaultDark;
    }

    const savedTheme = window.localStorage.getItem('theme');

    if (savedTheme) {
        return savedTheme === 'dark';
    }

    return document.documentElement.classList.contains('dark') || defaultDark;
}

function subscribeToThemeChanges(callback) {
    if (typeof window === 'undefined') {
        return () => { };
    }

    const handleStorage = (event) => {
        if (!event.key || event.key === 'theme') {
            callback();
        }
    };

    const observer = new MutationObserver((mutations) => {
        if (mutations.some((mutation) => mutation.attributeName === 'class')) {
            callback();
        }
    });

    window.addEventListener('storage', handleStorage);
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
    });

    return () => {
        window.removeEventListener('storage', handleStorage);
        observer.disconnect();
    };
}

export default function useThemeMode(defaultDark = true) {
    const getSnapshot = useCallback(() => readTheme(defaultDark), [defaultDark]);

    return useSyncExternalStore(
        subscribeToThemeChanges,
        getSnapshot,
        () => defaultDark
    );
}
