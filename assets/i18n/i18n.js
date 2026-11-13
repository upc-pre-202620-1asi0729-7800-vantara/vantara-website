(function () {
    'use strict';

    var STORAGE_KEY = 'hatarium-lang';
    var DEFAULT_LANG = 'es';
    var SUPPORTED_LANGS = ['es', 'en'];

    function isSupported(lang) {
        return SUPPORTED_LANGS.indexOf(lang) !== -1;
    }

    function getValue(source, path) {
        return path.split('.').reduce(function (obj, part) {
            if (obj && Object.prototype.hasOwnProperty.call(obj, part)) {
                return obj[part];
            }
            return undefined;
        }, source);
    }

    function getTranslation(lang, key) {
        var value = getValue(translations[lang], key);
        if (value === undefined) {
            value = getValue(translations[DEFAULT_LANG], key);
        }
        return value;
    }

    function getUrlLanguage() {
        try {
            var lang = new URLSearchParams(window.location.search).get('lang');
            if (lang && isSupported(lang)) {
                return lang;
            }
        } catch (error) {
            /* URLSearchParams no disponible */
        }
        return null;
    }

    function getStoredLanguage() {
        try {
            var lang = window.localStorage.getItem(STORAGE_KEY);
            if (lang && isSupported(lang)) {
                return lang;
            }
        } catch (error) {
            /* localStorage bloqueado */
        }
        return null;
    }

    function storeLanguage(lang) {
        try {
            window.localStorage.setItem(STORAGE_KEY, lang);
        } catch (error) {
            /* localStorage bloqueado */
        }
    }

    function updateUrl(lang) {
        try {
            var url = new URL(window.location.href);
            if (lang === DEFAULT_LANG) {
                url.searchParams.delete('lang');
            } else {
                url.searchParams.set('lang', lang);
            }
            window.history.replaceState({}, '', url.toString());
        } catch (error) {
            /* file:// o navegador sin soporte: se ignora */
        }
    }

    function applyLanguage(lang) {
        if (!isSupported(lang)) {
            lang = DEFAULT_LANG;
        }

        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('data-lang', lang);
        document.title = getTranslation(lang, 'meta.title');

        var description = document.querySelector('meta[name="description"]');
        if (description) {
            description.setAttribute('content', getTranslation(lang, 'meta.description'));
        }

        document.querySelectorAll('[data-i18n]').forEach(function (element) {
            var value = getTranslation(lang, element.getAttribute('data-i18n'));
            if (typeof value === 'string') {
                element.textContent = value;
            }
        });

        document.querySelectorAll('[data-i18n-html]').forEach(function (element) {
            var value = getTranslation(lang, element.getAttribute('data-i18n-html'));
            if (typeof value === 'string') {
                element.innerHTML = value;
            }
        });

        document.querySelectorAll('[data-i18n-attr]').forEach(function (element) {
            element.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
                var separator = pair.indexOf(':');
                if (separator === -1) {
                    return;
                }
                var attribute = pair.slice(0, separator).trim();
                var key = pair.slice(separator + 1).trim();
                var value = getTranslation(lang, key);
                if (typeof value === 'string') {
                    element.setAttribute(attribute, value);
                }
            });
        });

        document.querySelectorAll('[data-i18n-list]').forEach(function (list) {
            var items = getTranslation(lang, list.getAttribute('data-i18n-list'));
            if (!Array.isArray(items)) {
                return;
            }
            list.textContent = '';
            items.forEach(function (item) {
                var li = document.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
        });

        var toggle = document.getElementById('language-toggle');
        if (toggle) {
            var nextLang = lang === 'es' ? 'en' : 'es';
            toggle.textContent = nextLang.toUpperCase();
            toggle.setAttribute('lang', nextLang);
            toggle.setAttribute('aria-label', getTranslation(lang, 'nav.languageLabel'));
            toggle.setAttribute('title', getTranslation(lang, 'nav.languageLabel'));
            toggle.setAttribute('data-next-lang', nextLang);
        }

        storeLanguage(lang);
        updateUrl(lang);
    }

    function currentLanguage() {
        var lang = document.documentElement.getAttribute('lang');
        return isSupported(lang) ? lang : DEFAULT_LANG;
    }

    document.addEventListener('DOMContentLoaded', function () {
        applyLanguage(getUrlLanguage() || getStoredLanguage() || DEFAULT_LANG);

        var toggle = document.getElementById('language-toggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                applyLanguage(currentLanguage() === 'es' ? 'en' : 'es');
            });
        }
    });

    // Expuesto por si se necesita cambiar el idioma desde otro script.
    window.HatariumI18n = {
        applyLanguage: applyLanguage,
        currentLanguage: currentLanguage
    };
})();
