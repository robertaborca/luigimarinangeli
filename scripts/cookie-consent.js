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

        document.body.appendChild(buildBanner());
        document.body.classList.add("cookie-banner-visible");
    });
})();
