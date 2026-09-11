(function () {
    const blockMobileDevice = () => {
        const mobilePlatform = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            `${navigator.userAgent} ${navigator.platform}`
        );
        const mobileUserAgentData = Boolean(navigator.userAgentData?.mobile);
        const hasTouch = navigator.maxTouchPoints > 0;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        const cannotHover = window.matchMedia('(hover: none)').matches;
        const compactViewport = Math.min(window.innerWidth, window.innerHeight) <= 768;
        const compactScreen = Math.min(screen.width, screen.height) <= 768;

        // Desktop mode can hide the mobile user agent, but it still exposes touch
        // and usually reports a coarse, non-hovering primary pointer.
        const mobileTouchMode = hasTouch && (coarsePointer || cannotHover) &&
            (compactViewport || compactScreen || !window.matchMedia('(hover: hover)').matches);
        const isMobileDevice = mobilePlatform || mobileUserAgentData || mobileTouchMode;

        if (!isMobileDevice || window.__mobileDeviceBlocked) return;
        window.__mobileDeviceBlocked = true;

    const showBlockedPage = () => {
        document.body.innerHTML = `
            <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:#050505;color:#fff;font-family:Arial,sans-serif;text-align:center">
                <section style="max-width:480px;border:1px solid rgba(255,255,255,.12);border-radius:24px;padding:40px;background:rgba(255,255,255,.04)">
                    <h1 style="font-size:28px;margin:0 0 16px">Desktop device required</h1>
                    <p style="color:#a1a1aa;line-height:1.6;margin:0">AI interviews are available only on a desktop or laptop with a camera and microphone. Please reopen this page on a supported device.</p>
                </section>
            </main>`;
    };

        const isInterviewPage = Boolean(document.getElementById('record-btn'));
        if (isInterviewPage) {
            showBlockedPage();
            return;
        }

        const form = document.querySelector('form[action="/start-interview"]');
        if (form) {
            form.querySelectorAll('input, button').forEach((control) => {
                control.disabled = true;
            });
            const message = document.createElement('p');
            message.className = 'text-sm text-amber-400';
            message.textContent = 'Please use a desktop or laptop to start an AI interview.';
            form.prepend(message);
        }
    };

    blockMobileDevice();
    window.addEventListener('resize', blockMobileDevice, { passive: true });
    window.addEventListener('orientationchange', blockMobileDevice, { passive: true });
})();
