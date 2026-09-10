# Open Source AI Interviewer 🤖🎤

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8%2B-brightgreen.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Framework-Flask-orange.svg)](https://flask.palletsprojects.com/)
[![Groq Llama 3.3](https://img.shields.io/badge/AI-Groq%20Llama%203.3-purple.svg)](https://groq.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
An open-source, voice-interactive AI Interviewer that helps job candidates prepare for real-world interviews. Powered by **Flask**, **Socket.io**, and **Groq (Llama 3.3)**, this platform simulates realistic HR interviews with live speech-to-text, text-to-speech, webcam preview, and automated scoring reports.

---

## 🌟 Key Features

- **Role-Specific Mock Interviews**: Select target roles such as Full Stack Developer, Product Designer, Data Analyst, AI Researcher, Sales Executive, etc.
- **Voice-Enabled Interaction**: Speak naturally using Web Speech API with Hold-to-Speak microphone controls.
- **Context-Aware AI HR Manager**: Powered by **Llama 3.3 (via Groq)** to generate intelligent follow-ups and realistic questions.
- **Real-Time Speech Synthesis (TTS)**: The AI interviewer speaks back responses dynamically.
- **Live Webcam Preview**: Visual feedback to help you monitor your posture and body language during the session.
- **Comprehensive Evaluation Report**: Generates an end-of-interview scorecard featuring:
  - Technical Proficiency Score (1–10)
  - Soft Skills Score (1–10)
  - Executive Summary Feedback
  - Actionable Items for Improvement

---

## 🛠️ Tech Stack

- **Backend**: Python, Flask, Flask-SocketIO, Simple-WebSocket
- **AI / LLM**: [Groq Cloud API](https://console.groq.com/) with `llama-3.3-70b-versatile`
- **Frontend**: HTML5, Modern CSS (TailwindCSS CDN), JavaScript (ES6+)
- **Browser APIs**: Web Speech Recognition, Web SpeechSynthesis, MediaDevices (Webcam/Mic)

---

## 📦 Quick Start & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/EduLinkUp/open-source-ai-interviewer.git
cd open-source-ai-interviewer
```

### 2. Create and Activate Virtual Environment
```bash
# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate

# On Windows:
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and set your credentials:
```bash
cp .env.example .env
```
Inside `.env`:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
FLASK_SECRET=your_flask_secret_key_here
PORT=5000
```
> 🔑 Get a free high-speed Groq API key at [console.groq.com](https://console.groq.com/).

---

## 🎮 Usage

1. **Launch the application**:
   ```bash
   python app.py
   ```
2. Open your browser and navigate to:
   ```text
   http://localhost:5000
   ```
3. Choose your target role and click **"Start Session"**.
4. Allow Camera & Microphone permissions when prompted.
5. Hold the **Microphone** button to speak your answers.
6. Click **"End Interview"** when finished to view your performance report!

---

## 📂 Project Structure

```text
open-source-ai-interviewer/
├── static/
│   ├── css/               # Styling stylesheets
│   └── js/                # Client-side scripts (interview.js, main.js)
├── templates/             # Jinja2 HTML templates
│   ├── index.html         # Landing and role selection
│   ├── interview.html     # Live interview room with webcam & mic
│   └── report.html        # Scorecard and performance analysis
├── utils/                 # Modular helper classes
│   ├── ai_agent.py        # Interview LLM conversation agent
│   ├── audio_processor.py # Speech transcription cleaning
│   └── evaluator.py       # Performance report generator
├── app.py                 # Flask server and WebSocket event handlers
├── requirements.txt       # Python dependencies
├── .env.example           # Environment template
├── CONTRIBUTING.md        # Open-source contribution guidelines
├── CODE_OF_CONDUCT.md     # Contributor covenant code of conduct
├── LICENSE                # MIT License
└── README.md              # Project documentation
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are very welcome!
Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) before getting started.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🛡️ License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 🌟 Acknowledgements

- [EduLinkUp Community](https://github.com/EduLinkUp)
- [Groq Fast Inference](https://groq.com)
