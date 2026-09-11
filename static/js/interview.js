/**
 * interview.js - Core Logic for Camera, Mic, and AI HR Interaction
 */

const socket = io();
const chatLog = document.getElementById('chat-log');
const recordBtn = document.getElementById('record-btn');
const finishBtn = document.getElementById('finish-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const unlockFullscreenBtn = document.getElementById('unlock-fullscreen-btn');
const screenLock = document.getElementById('screen-lock');
const integrityStatus = document.getElementById('integrity-status');
const videoElement = document.getElementById('videoElement');
const urlParams = new URLSearchParams(window.location.search);
const resumeId = urlParams.get('resume_id') || '';
const currentRole = 'Resume-based interview';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const SILENCE_THRESHOLD = 0.015;
const SILENCE_DURATION_MS = 1500;

let recognition = null;
let isRecording = false;
let isProcessing = false;
let answerTranscript = '';
let hasDetectedSpeech = false;
let silenceStartedAt = null;
let silenceMonitorFrame = null;
let analyser = null;
let mediaStream = null;
let lastFocusEventAt = 0;
let hasReportedFullscreenExit = false;
let isFullscreenReady = false;
let isScreenLocked = true;
let interviewStartRequested = false;
let tabSwitchCount = 0;
let interviewEnded = false;
const MAX_TAB_SWITCHES = 3;

function updateMicState(active) {
    if (!recordBtn) return;
    recordBtn.classList.toggle('bg-red-600', active);
    recordBtn.classList.toggle('animate-pulse', active);
    recordBtn.classList.toggle('bg-blue-600', !active);
    recordBtn.classList.toggle('hover:bg-blue-500', !active);
    recordBtn.setAttribute('aria-label', active ? 'Listening' : 'Start answering');
}

function setScreenLock(locked) {
    isScreenLocked = locked;
    isFullscreenReady = !locked;
    if (screenLock) {
        screenLock.classList.toggle('hidden', !locked);
        screenLock.classList.toggle('flex', locked);
    }
    if (recordBtn) {
        recordBtn.disabled = locked || interviewEnded;
        recordBtn.setAttribute('aria-label', locked ? 'Enter fullscreen to start' : 'Start answering');
    }
}

function reportIntegrityEvent(type, details) {
    socket.emit('integrity_event', {
        type,
        details,
        timestamp: new Date().toISOString()
    });
}

function startInterviewWhenReady() {
    if (interviewStartRequested || !resumeId || !socket.connected || !document.fullscreenElement || isScreenLocked || interviewEnded) return;
    interviewStartRequested = true;
    socket.emit('start_interview', { resume_id: resumeId });
}

function endInterview(reason) {
    if (interviewEnded) return;
    interviewEnded = true;
    isProcessing = true;
    stopListening();
    window.speechSynthesis?.cancel();
    if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
    socket.emit('generate_report', { role: currentRole });
    addMessage("System", `${reason} Analyzing your performance... please wait.`, "system-msg");
}

function updateIntegrityStatus(message, isWarning = false) {
    if (!integrityStatus) return;
    integrityStatus.textContent = message;
    integrityStatus.classList.toggle('text-amber-400', isWarning);
    integrityStatus.classList.toggle('border-amber-500/20', isWarning);
    integrityStatus.classList.toggle('bg-amber-500/5', isWarning);
    integrityStatus.classList.toggle('text-emerald-400', !isWarning);
    integrityStatus.classList.toggle('border-emerald-500/20', !isWarning);
    integrityStatus.classList.toggle('bg-emerald-500/5', !isWarning);
}

function monitorMediaTrack(track, deviceName) {
    const updateStatus = () => {
        const state = track.readyState === 'live' && !track.muted ? 'active' : 'unavailable';
        reportIntegrityEvent(`${deviceName}_${state}`, `${deviceName} track is ${state}`);
        updateIntegrityStatus(`${deviceName} ${state}`, state !== 'active');
    };

    track.addEventListener('ended', updateStatus);
    track.addEventListener('mute', updateStatus);
    track.addEventListener('unmute', updateStatus);
}

function setupIntegrityMonitoring() {
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            tabSwitchCount += 1;
            reportIntegrityEvent('tab_switch', 'Interview tab is no longer visible');
            if (tabSwitchCount < MAX_TAB_SWITCHES) {
                const warningMessage = `Warning ${tabSwitchCount}/${MAX_TAB_SWITCHES - 1}: Do not switch tabs during the interview.`;
                updateIntegrityStatus(`Tab switch warning ${tabSwitchCount}/2`, true);
                alert(warningMessage);
            } else {
                updateIntegrityStatus('Interview ended: tab switching limit reached', true);
                alert('Interview ended because the tab-switch limit was reached.');
                endInterview('Interview ended because the tab-switch limit was reached.');
            }
        } else {
            reportIntegrityEvent('tab_return', 'Interview tab became visible again');
            if (!interviewEnded) updateIntegrityStatus('Integrity monitoring active');
        }
    });

    window.addEventListener('blur', () => {
        const now = Date.now();
        if (now - lastFocusEventAt < 1000) return;
        lastFocusEventAt = now;
        reportIntegrityEvent('window_blur', 'Interview window lost focus');
        updateIntegrityStatus('Window focus lost', true);
    });

    window.addEventListener('focus', () => {
        updateIntegrityStatus('Integrity monitoring active');
    });

    document.addEventListener('fullscreenchange', () => {
        const isFullscreen = Boolean(document.fullscreenElement);
        if (!isFullscreen && hasReportedFullscreenExit) {
            reportIntegrityEvent('fullscreen_exit', 'Candidate exited fullscreen mode');
            updateIntegrityStatus('Fullscreen exited', true);
            stopListening();
            window.speechSynthesis?.cancel();
            if (mediaStream) {
                mediaStream.getTracks().forEach((track) => track.stop());
                mediaStream = null;
                analyser = null;
            }
            setScreenLock(true);
        }
        hasReportedFullscreenExit = isFullscreen;
        if (isFullscreen) {
            setScreenLock(false);
            updateIntegrityStatus('Integrity monitoring active');
            if (!mediaStream) setupCamera();
            startInterviewWhenReady();
        }
        if (fullscreenBtn) fullscreenBtn.textContent = isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen';
    });

    ['copy', 'cut', 'paste'].forEach((eventName) => {
        document.addEventListener(eventName, (event) => {
            event.preventDefault();
            reportIntegrityEvent(eventName, `${eventName} was blocked during the interview`);
            updateIntegrityStatus(`${eventName} blocked`, true);
        });
    });

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', async () => {
            try {
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                } else {
                    await document.documentElement.requestFullscreen();
                    hasReportedFullscreenExit = true;
                }
            } catch (err) {
                reportIntegrityEvent('fullscreen_error', err.message);
            }
        });
    }

    if (unlockFullscreenBtn) {
        unlockFullscreenBtn.addEventListener('click', async () => {
            try {
                await document.documentElement.requestFullscreen();
            } catch (err) {
                reportIntegrityEvent('fullscreen_error', err.message);
                updateIntegrityStatus('Fullscreen is required to continue', true);
            }
        });
    }

    if (navigator.mediaDevices?.addEventListener) {
        navigator.mediaDevices.addEventListener('devicechange', () => {
            reportIntegrityEvent('media_device_change', 'Available camera or microphone devices changed');
        });
    }
}

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: true
        });
        mediaStream = stream;
        if (videoElement) videoElement.srcObject = stream;
        stream.getVideoTracks().forEach((track) => monitorMediaTrack(track, 'camera'));
        stream.getAudioTracks().forEach((track) => monitorMediaTrack(track, 'microphone'));

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        audioContext.createMediaStreamSource(stream).connect(analyser);
    } catch (err) {
        console.warn("Media devices access warning:", err);
    }
}

function submitAnswer() {
    const transcript = answerTranscript.trim();
    if (!transcript || isProcessing) return;

    isProcessing = true;
    addMessage("You", transcript, "user-msg");
    socket.emit('user_answer', { text: transcript, role: currentRole });
}

function monitorSilence() {
    if (!analyser || silenceMonitorFrame) return;

    const samples = new Uint8Array(analyser.fftSize);
    const checkAudio = () => {
        silenceMonitorFrame = null;
        if (!isRecording) return;

        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        for (const sample of samples) {
            const normalizedSample = (sample - 128) / 128;
            sum += normalizedSample * normalizedSample;
        }
        const volume = Math.sqrt(sum / samples.length);

        if (volume > SILENCE_THRESHOLD) {
            hasDetectedSpeech = true;
            silenceStartedAt = null;
        } else if (hasDetectedSpeech) {
            silenceStartedAt ??= performance.now();
            if (performance.now() - silenceStartedAt >= SILENCE_DURATION_MS) {
                stopListening();
                return;
            }
        }

        silenceMonitorFrame = requestAnimationFrame(checkAudio);
    };

    silenceMonitorFrame = requestAnimationFrame(checkAudio);
}

function startListening() {
    if (!recognition || isRecording || isProcessing || !isFullscreenReady || isScreenLocked || interviewEnded) return;
    try {
        recognition.start();
    } catch (err) {
        console.warn("Failed to start recognition:", err);
    }
}

function stopListening() {
    if (!recognition || !isRecording) return;
    try {
        recognition.stop();
    } catch (err) {
        console.warn("Failed to stop recognition:", err);
    }
}

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        isRecording = true;
        answerTranscript = '';
        hasDetectedSpeech = false;
        silenceStartedAt = null;
        updateMicState(true);
        monitorSilence();
    };

    recognition.onresult = (event) => {
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
            const result = event.results[index];
            if (result[0].transcript.trim()) hasDetectedSpeech = true;
            if (result.isFinal) answerTranscript += `${result[0].transcript} `;
        }
    };

    recognition.onend = () => {
        isRecording = false;
        updateMicState(false);
        if (!isProcessing) submitAnswer();
    };

    recognition.onerror = (event) => {
        isRecording = false;
        updateMicState(false);
        if (event.error !== 'aborted' && !isProcessing) submitAnswer();
        console.warn("Speech recognition error:", event.error);
    };
} else {
    alert("Speech Recognition is not supported in this browser. Please use Google Chrome.");
}

if (recordBtn) {
    recordBtn.addEventListener('click', (event) => {
        event.preventDefault();
        startListening();
    });
}

socket.on('connect', () => {
    startInterviewWhenReady();
});

socket.on('interview_error', (data) => {
    alert(data.message || 'Unable to start the interview.');
    window.location.href = '/';
});

socket.on('hr_question', (data) => {
    isProcessing = false;
    addMessage("AI HR", data.text, "hr-msg");
    speakText(data.text);
});

function speakText(text) {
    if (!('speechSynthesis' in window)) {
        startListening();
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find((voice) => voice.name.includes("Google US English") || voice.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.onend = startListening;
    window.speechSynthesis.speak(utterance);
}

function addMessage(sender, text, className) {
    if (!chatLog) return;
    const msgDiv = document.createElement('div');
    const isHr = sender === "AI HR";
    msgDiv.className = isHr
        ? "bg-blue-500/10 p-4 rounded-2xl rounded-tl-none border border-blue-500/20"
        : "bg-white/10 p-4 rounded-2xl rounded-tr-none border border-white/20 self-end text-right";
    msgDiv.innerHTML = `
        <p class="text-sm ${isHr ? 'text-blue-400' : 'text-purple-300'} font-bold mb-1">${sender}</p>
        <p class="text-gray-200">${text}</p>
    `;
    chatLog.appendChild(msgDiv);
    chatLog.scrollTop = chatLog.scrollHeight;
}

if (finishBtn) {
    finishBtn.onclick = () => {
        if (confirm("Are you sure you want to end the interview and generate your performance report?")) {
            endInterview('Interview ended by candidate.');
        }
    };
}

socket.on('final_report', (data) => {
    sessionStorage.setItem('last_report', typeof data === 'string' ? data : JSON.stringify(data));
    sessionStorage.setItem('last_role', currentRole);
    window.location.href = `/report?role=${encodeURIComponent(currentRole)}`;
});

if (!window.__mobileDeviceBlocked) {
    setupIntegrityMonitoring();
    setScreenLock(!document.fullscreenElement);
    if (document.fullscreenElement) {
        setupCamera();
        startInterviewWhenReady();
    }
}
