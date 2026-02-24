document.addEventListener('DOMContentLoaded', () => {
    console.log("App initialized");
    // Initialize Players
    initMediaPlayers();

    // Volume Popup Logic
    document.querySelectorAll('.volume-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const container = btn.closest('.volume-container');
            const popup = container.querySelector('.volume-popup-final');

            // Close all others
            document.querySelectorAll('.volume-popup-final').forEach(p => {
                if (p !== popup) {
                    p.classList.remove('active');
                }
            });

            // Toggle current
            popup.classList.toggle('active');
        });
    });

    // Close volume on outside click
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.volume-popup-final') && !e.target.closest('.volume-btn')) {
            document.querySelectorAll('.volume-popup-final').forEach(p => {
                p.classList.remove('active');
            });
        }
    });

    // Prevent closing when clicking inside slider
    document.querySelectorAll('.volume-popup-final').forEach(popup => {
        popup.addEventListener('click', (e) => e.stopPropagation());
    });
    initScrollSpy();
    initScrollReveal();
    initContactForm();
});

// --- Scroll Spy ---
function initScrollSpy() {
    const sections = document.querySelectorAll('section');
    // Only target the text links in the center, not the "CONTRATAR" button
    const navLinks = document.querySelectorAll('nav div.hidden.md\\:flex a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (pageYOffset >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('text-primary');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('text-primary');
            }
        });
    });
}

// --- Media Player State ---
const playerState = {
    audio: null,
    btn: null,
    interval: null
};

function initMediaPlayers() {
    // Global Error Handler for debugging
    window.onerror = function (msg, url, lineNo, columnNo, error) {
        console.error('Error: ' + msg + '\nURL: ' + url + '\nLine: ' + lineNo + '\nColumn: ' + columnNo + '\nError object: ' + JSON.stringify(error));
        return false;
    };

    const mediaData = {
        'demo-music': {
            type: 'audio',
            src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
        },
        'demo-locucion': {
            type: 'audio',
            src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
        }
    };

    // Audio Button Click Listeners
    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const targetBtn = e.target.closest('.play-btn');
            if (!targetBtn) return;

            const id = targetBtn.dataset.id;
            const media = mediaData[id];

            if (!media || media.type !== 'audio') return;

            handleAudioClick(targetBtn, media.src);
        });
    });

    // Audio Progress Slider (Range Input)
    document.querySelectorAll('.progress-slider').forEach(slider => {
        // Seek on input (dragging) or change (click)
        ['input', 'change'].forEach(evt => {
            slider.addEventListener(evt, (e) => {
                e.stopPropagation();

                // Find shared parent (div with gap-3 or similar structure)
                // Hierarchy: slider -> div(flex) -> div(flex-col) 
                // Button is sibling of slider
                const parent = slider.parentElement;
                const btn = parent.querySelector('.play-btn');

                if (playerState.audio && playerState.btn === btn && playerState.audio.duration) {
                    const val = parseFloat(slider.value);
                    const time = (val / 100) * playerState.audio.duration;

                    // Only update audio time if reasonably distinct (prevents stutter during fast drag)
                    if (Math.abs(playerState.audio.currentTime - time) > 0.5 || evt === 'change') {
                        playerState.audio.currentTime = time;
                    }
                }
            });
        });
    });

    // Volume Slider Listeners
    document.querySelectorAll('.v-slider-final').forEach(slider => {
        // Prevent click propagation
        slider.addEventListener('click', (e) => e.stopPropagation());

        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            // Find closest play-btn in container (glass-panel)
            const container = slider.closest('.glass-panel');
            const btn = container.querySelector('.play-btn');

            if (playerState.audio && playerState.btn === btn) {
                playerState.audio.volume = val;
            }
        });
    });

    // Handle Inline Video Playback (Stop audio when video plays)
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.volume = 0.4; // Lower default volume for video too
        video.addEventListener('play', () => {
            stopAllMedia();
        });
    });
}

// --- Audio Logic ---

function handleAudioClick(btn, src) {
    // If clicking the active button, toggle play/pause
    if (playerState.btn === btn) {
        toggleCurrentAudio();
    } else {
        // Reset everything and start new
        stopAllMedia();
        playNewAudio(btn, src);
    }
}

function playNewAudio(btn, src) {
    console.log("Starting new audio:", src);
    playerState.btn = btn;
    playerState.audio = new Audio(src);

    // Set volume based on the slider associated with this button
    const container = btn.closest('.glass-panel');
    const slider = container.querySelector('.v-slider-final');
    if (slider) {
        playerState.audio.volume = parseFloat(slider.value);
    } else {
        playerState.audio.volume = 0.1; // Default fallback
    }

    // Auto-reset on end
    playerState.audio.addEventListener('ended', () => {
        resetPlayerUI(btn);
        stopAllMedia(false); // false = don't double reset UI
    });

    // Error handling
    playerState.audio.addEventListener('error', (e) => {
        console.error("Audio error:", e);
        resetPlayerUI(btn);
        stopAllMedia();
    });

    playCurrentAudio();
}

function toggleCurrentAudio() {
    if (!playerState.audio) return;

    if (playerState.audio.paused) {
        playCurrentAudio();
    } else {
        pauseCurrentAudio();
    }
}

function playCurrentAudio() {
    if (!playerState.audio || !playerState.btn) return;

    const icon = playerState.btn.querySelector('.material-icons');

    playerState.audio.play()
        .then(() => {
            icon.textContent = 'pause';
            startProgressLoop();
        })
        .catch(err => {
            console.error("Playback failed:", err);
            icon.textContent = 'error';
        });
}

function pauseCurrentAudio() {
    if (playerState.audio) {
        playerState.audio.pause();
    }
    if (playerState.btn) {
        const icon = playerState.btn.querySelector('.material-icons');
        icon.textContent = 'play_arrow';
    }
    stopProgressLoop();
}

function stopAllMedia(resetUI = true) {
    if (playerState.audio) {
        playerState.audio.pause();
        playerState.audio = null; // Detach audio object
    }

    stopProgressLoop();

    if (resetUI && playerState.btn) {
        resetPlayerUI(playerState.btn);
    }

    playerState.btn = null;
}

function startProgressLoop() {
    stopProgressLoop(); // Safety clear

    playerState.interval = setInterval(() => {
        if (!playerState.audio || !playerState.btn) return;

        const btn = playerState.btn;
        // In new layout, siblings are different
        const parent = btn.parentElement;
        const progressBar = parent.querySelector('.progress-slider');
        const timeDisplay = parent.querySelector('.time-display');

        if (playerState.audio.duration && progressBar) {
            const percent = (playerState.audio.currentTime / playerState.audio.duration) * 100;
            progressBar.value = percent; // Default range input update
            // Also update background size for "fill" effect if desired, but native chrome thumb works well alone

            const current = formatTime(playerState.audio.currentTime);
            const total = formatTime(playerState.audio.duration);
            if (timeDisplay) timeDisplay.textContent = `${current}`;
        }
    }, 100);
}

function stopProgressLoop() {
    if (playerState.interval) {
        clearInterval(playerState.interval);
        playerState.interval = null;
    }
}

function resetPlayerUI(btn) {
    if (!btn) return;
    const icon = btn.querySelector('.material-icons');
    if (icon) icon.textContent = 'play_arrow';

    const parent = btn.parentElement;
    const progressBar = parent.querySelector('.progress-slider');
    if (progressBar) progressBar.value = 0;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Scroll Reveal Animations ---
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    reveals.forEach(reveal => {
        observer.observe(reveal);
    });
}

// --- Contact Form AJAX Submission ---
function initContactForm() {
    const form = document.getElementById('contact-form');
    const popup = document.getElementById('success-popup');
    const closeBtn = document.getElementById('close-popup');
    const submitBtn = form?.querySelector('button[type="submit"]');

    if (!form || !popup || !closeBtn) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent standard redirect

        // Visual feedback on button
        const originalBtnHTML = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="material-icons animate-spin">autorenew</span><span>Enviando...</span>';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: form.method,
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                // Success!
                form.reset(); // Clear form
                showPopup();
            } else {
                // Formspree returns errors in JSON occasionally
                const data = await response.json();
                if (Object.hasOwn(data, 'errors')) {
                    alert('Hubo un error: ' + data.errors.map(error => error.message).join(', '));
                } else {
                    alert('Hubo un error al enviar el formulario. Inténtalo más tarde.');
                }
            }
        } catch (error) {
            alert('Error de conexión. Por favor, revisa tu internet y vuelve a intentarlo.');
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalBtnHTML;
            submitBtn.disabled = false;
        }
    });

    closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        hidePopup();
    });

    // Also close on click outside the popup content
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            e.preventDefault();
            hidePopup();
        }
    });

    function showPopup() {
        popup.style.display = 'flex';
        // Small delay to allow display block to render before scaling
        setTimeout(() => {
            popup.style.opacity = '1';
            document.getElementById('success-popup-content').style.transform = 'scale(1)';
        }, 10);
    }

    function hidePopup() {
        if (popup) popup.style.opacity = '0';
        const content = document.getElementById('success-popup-content');
        if (content) content.style.transform = 'scale(0.95)';
        setTimeout(() => {
            if (popup) popup.style.display = 'none';
        }, 300); // Matches transition duration
    }
}
