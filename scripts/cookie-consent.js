(function () {
    "use strict";

    var STORAGE_KEY = "lecasediluigi_cookie_consent";
    var GA_MEASUREMENT_ID = "G-706STDKPTN";
    var gaLoaded = false;

    function getConsent() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function setConsent(value) {
        try {
            localStorage.setItem(STORAGE_KEY, value);
        } catch (e) {
            /* localStorage non disponibile: il banner ricomparirà, non è bloccante */
        }
    }

    function loadGoogleAnalytics() {
        if (gaLoaded) return;
        gaLoaded = true;

        var script = document.createElement("script");
        script.async = true;
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () {
            window.dataLayer.push(arguments);
        };
        window.gtag("js", new Date());
        window.gtag("config", GA_MEASUREMENT_ID);
    }

    function injectStyle() {
        var style = document.createElement("style");
        style.textContent =
            ".cookie-consent-banner{position:fixed;left:0;right:0;bottom:0;z-index:9999;" +
            "background:#0e3543;color:#fff;padding:1.6rem 2rem;box-shadow:0 -4px 16px rgba(0,0,0,0.2);" +
            "display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:1.6rem;" +
            "font-family:'Montserrat','SUSE',sans-serif;}" +
            ".cookie-consent-banner__text{flex:1 1 320px;font-size:1.4rem;line-height:1.5;margin:0;}" +
            ".cookie-consent-banner__text a{color:#fff;text-decoration:underline;}" +
            ".cookie-consent-banner__actions{display:flex;gap:1rem;flex-wrap:wrap;flex:0 0 auto;}" +
            ".cookie-consent-banner__btn{font-size:1.4rem;font-weight:600;padding:0.9rem 1.8rem;" +
            "border-radius:0.5rem;cursor:pointer;border:2px solid #fff;font-family:inherit;}" +
            ".cookie-consent-banner__btn--accept{background:#fff;color:#0e3543;}" +
            ".cookie-consent-banner__btn--reject{background:transparent;color:#fff;}" +
            "@media (max-width:600px){.cookie-consent-banner{padding:1.4rem;justify-content:stretch;}" +
            ".cookie-consent-banner__actions{width:100%;justify-content:stretch;}" +
            ".cookie-consent-banner__btn{flex:1;}}";
        document.head.appendChild(style);
    }

    function buildBanner() {
        var banner = document.createElement("div");
        banner.className = "cookie-consent-banner";
        banner.setAttribute("role", "dialog");
        banner.setAttribute("aria-live", "polite");
        banner.setAttribute("aria-label", "Informativa sui cookie");

        var text = document.createElement("p");
        text.className = "cookie-consent-banner__text";
        text.innerHTML =
            "Questo sito utilizza Google Analytics per statistiche di utilizzo, attivato solo se acconsenti. " +
            '<a href="/privacy-cookie-policy.html">Maggiori informazioni</a>';

        var actions = document.createElement("div");
        actions.className = "cookie-consent-banner__actions";

        var rejectBtn = document.createElement("button");
        rejectBtn.type = "button";
        rejectBtn.className = "cookie-consent-banner__btn cookie-consent-banner__btn--reject";
        rejectBtn.textContent = "Rifiuta";

        var acceptBtn = document.createElement("button");
        acceptBtn.type = "button";
        acceptBtn.className = "cookie-consent-banner__btn cookie-consent-banner__btn--accept";
        acceptBtn.textContent = "Accetta";

        function close(value) {
            setConsent(value);
            if (value === "accepted") loadGoogleAnalytics();
            banner.remove();
            document.body.classList.remove("cookie-banner-visible");
        }

        rejectBtn.addEventListener("click", function () {
            close("rejected");
        });
        acceptBtn.addEventListener("click", function () {
            close("accepted");
        });

        actions.appendChild(rejectBtn);
        actions.appendChild(acceptBtn);
        banner.appendChild(text);
        banner.appendChild(actions);

        return banner;
    }

    document.addEventListener("DOMContentLoaded", function () {
        var consent = getConsent();

        if (consent === "accepted") {
            loadGoogleAnalytics();
            return;
        }

        if (consent === "rejected") return;

        injectStyle();
        document.body.appendChild(buildBanner());
        document.body.classList.add("cookie-banner-visible");
    });
})();
