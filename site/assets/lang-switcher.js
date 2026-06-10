(function () {
    var STORAGE_KEY = 'trustcore_locale';
    var LOCALE_LABELS = {
        es: 'Idioma',
        en: 'Language',
        fr: 'Langue'
    };

    var LOCALIZED_PAGES = {
        en: new Set(['/', '/article', '/comparativa', '/ipsi-ceuta-melilla-guia-practica', '/ipsi-en-factura-ejemplo-completo', '/ipsi-quipu-alternativas-para-pymes', '/errores-ipsi-autonomos-y-pymes', '/control-horario-obligatorio-guia-2026', '/control-horario-fichaje-remoto-sin-riesgos', '/auditoria-control-horario-checklist', '/plan-lite-cumplimiento-basico-empresa', '/plan-lite-vs-plan-pro-cumplimiento', '/cumplimiento-basico-en-30-dias', '/precios', '/pricing']),
        fr: new Set(['/', '/article', '/comparativa', '/ipsi-ceuta-melilla-guia-practica', '/ipsi-en-factura-ejemplo-completo', '/ipsi-quipu-alternativas-para-pymes', '/errores-ipsi-autonomos-y-pymes', '/control-horario-obligatorio-guia-2026', '/control-horario-fichaje-remoto-sin-riesgos', '/auditoria-control-horario-checklist', '/plan-lite-cumplimiento-basico-empresa', '/plan-lite-vs-plan-pro-cumplimiento', '/cumplimiento-basico-en-30-dias', '/precios', '/tarifs'])
    };

    // Pages where the slug differs per locale (es/en/fr don't share the same slug)
    var CROSS_LOCALE_PATHS = {
        '/precios': { es: '/precios',     en: '/en/pricing', fr: '/fr/tarifs' },
        '/pricing': { es: '/precios',     en: '/en/pricing', fr: '/fr/tarifs' },
        '/tarifs':  { es: '/precios',     en: '/en/pricing', fr: '/fr/tarifs' }
    };

    function detectLocale(pathname) {
        if (pathname === '/en' || pathname.indexOf('/en/') === 0) {
            return 'en';
        }

        if (pathname === '/fr' || pathname.indexOf('/fr/') === 0) {
            return 'fr';
        }

        return 'es';
    }

    function basePathFrom(pathname) {
        if (!pathname || pathname === '') {
            return '/';
        }

        if (pathname === '/en' || pathname === '/fr') {
            return '/';
        }

        if (pathname.indexOf('/en/') === 0 || pathname.indexOf('/fr/') === 0) {
            var trimmed = pathname.substring(3);
            return trimmed === '' ? '/' : trimmed;
        }

        return pathname;
    }

    function normalizeBasePath(pathname) {
        var basePath = basePathFrom(pathname);

        if (basePath === '/index.html') {
            return '/';
        }

        if (basePath.length > 5 && basePath.slice(-5) === '.html') {
            return basePath.slice(0, -5);
        }

        return basePath;
    }

    function supportsPath(locale, basePath) {
        if (locale === 'es') {
            return true;
        }

        var localized = LOCALIZED_PAGES[locale];
        return Boolean(localized && localized.has(basePath));
    }

    function homePath(locale) {
        return locale === 'es' ? '/' : '/' + locale + '/';
    }

    function buildTargetPath(locale, basePath) {
        // Cross-locale slug overrides (e.g. /precios → /en/pricing)
        if (CROSS_LOCALE_PATHS[basePath] && CROSS_LOCALE_PATHS[basePath][locale] !== undefined) {
            return CROSS_LOCALE_PATHS[basePath][locale];
        }

        if (locale === 'es') {
            return basePath;
        }

        if (basePath === '/') {
            return '/' + locale + '/';
        }

        return '/' + locale + basePath;
    }

    function resolveTargetPath(locale, basePath) {
        if (!supportsPath(locale, basePath)) {
            return homePath(locale);
        }

        return buildTargetPath(locale, basePath);
    }

    function setLocaleLabel(locale) {
        var label = LOCALE_LABELS[locale] || LOCALE_LABELS.es;

        document.querySelectorAll('[data-lang-label]').forEach(function (el) {
            el.textContent = label;
        });
    }

    function setSelectValue(locale) {
        document.querySelectorAll('[data-lang-switcher]').forEach(function (el) {
            el.value = locale;
        });
    }

    function persistLocale(locale) {
        try {
            window.localStorage.setItem(STORAGE_KEY, locale);
        } catch (err) {
            // Ignore storage errors (private mode/restricted storage).
        }
    }

    function bindSwitchers(currentLocale, basePath) {
        document.querySelectorAll('[data-lang-switcher]').forEach(function (select) {
            select.addEventListener('change', function () {
                var targetLocale = select.value;
                if (targetLocale === currentLocale) {
                    return;
                }

                persistLocale(targetLocale);

                var targetPath = resolveTargetPath(targetLocale, basePath);
                var targetUrl = targetPath + window.location.search + window.location.hash;
                window.location.assign(targetUrl);
            });
        });
    }

    function syncWithStoredLocale(currentLocale, basePath) {
        try {
            var preferred = window.localStorage.getItem(STORAGE_KEY);
            if (!preferred || preferred === currentLocale) {
                return;
            }

            var targetPath = resolveTargetPath(preferred, basePath);
            if (targetPath === window.location.pathname) {
                return;
            }

            if (window.location.pathname === '/' && preferred !== 'es' && supportsPath(preferred, basePath)) {
                window.location.replace(targetPath + window.location.search + window.location.hash);
            }
        } catch (err) {
            // Ignore storage errors.
        }
    }

    var currentLocale = detectLocale(window.location.pathname);
    var basePath = normalizeBasePath(window.location.pathname);

    document.documentElement.lang = currentLocale;
    setLocaleLabel(currentLocale);
    setSelectValue(currentLocale);
    bindSwitchers(currentLocale, basePath);
    syncWithStoredLocale(currentLocale, basePath);
})();
