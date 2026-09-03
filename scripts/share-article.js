(function () {
    "use strict";

    var section = document.querySelector("[data-share-article]");
    if (!section) return;

    var og = document.querySelector('meta[property="og:title"]');
    var title = (og && og.content) || document.title;
    var url = window.location.href;
    var encodedTitle = encodeURIComponent(title);
    var encodedUrl = encodeURIComponent(url);

    var nativeBtn = section.querySelector("[data-share-native]");
    var fallback = section.querySelector("[data-share-fallback]");
    var feedback = section.querySelector("[data-share-feedback]");
    var whatsappLink = section.querySelector('[data-share="whatsapp"]');
    var facebookLink = section.querySelector('[data-share="facebook"]');
    var emailLink = section.querySelector('[data-share="email"]');
    var copyBtn = section.querySelector('[data-share="copy"]');

    if (whatsappLink) {
        whatsappLink.href = "https://wa.me/?text=" + encodedTitle + "%20" + encodedUrl;
    }
    if (facebookLink) {
        facebookLink.href = "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl;
    }
    if (emailLink) {
        emailLink.href = "mailto:?subject=" + encodedTitle + "&body=" + encodedUrl;
    }

    var feedbackTimer;
    function showFeedback(message) {
        if (!feedback) return;
        feedback.textContent = message;
        clearTimeout(feedbackTimer);
        feedbackTimer = setTimeout(function () {
            feedback.textContent = "";
        }, 2000);
    }

    if (copyBtn) {
        copyBtn.addEventListener("click", function () {
            if (!navigator.clipboard) return;
            navigator.clipboard.writeText(url).then(function () {
                showFeedback("Link copiato");
            });
        });
    }

    if (nativeBtn && typeof navigator.share === "function") {
        nativeBtn.hidden = false;
        if (fallback) fallback.hidden = true;
        nativeBtn.addEventListener("click", function () {
            navigator.share({ title: title, url: url }).catch(function () {});
        });
    }
})();
