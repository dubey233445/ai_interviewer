# Contributing to AI Interviewer

Thank you for your interest in contributing to the **AI Interviewer** project! We welcome contributions from developers of all skill levels.

---

## 🌟 How Can You Contribute?

You can contribute in several ways:
- **Reporting Bugs**: Open an issue detailing the unexpected behavior.
- **Suggesting Features**: Propose enhancements or new interview modes.
- **Improving Documentation**: Fix typos, add examples, or improve explanations.
- **Submitting Code**: Fix open issues or implement requested features.

---

## 🚀 Getting Started

### 1. Fork and Clone the Repository
```bash
# Clone your fork
git clone https://github.com/<your-username>/open-source-ai-interviewer.git
cd open-source-ai-interviewer
```

### 2. Set Up Virtual Environment
```bash
# On Linux / macOS
python3 -m venv venv
source venv/bin/activate

# On Windows
python -m venv venv
venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and configure your credentials:
```bash
cp .env.example .env
```
Add your [Groq API Key](https://console.groq.com/keys) to `.env`.

### 5. Run the Application
```bash
python app.py
```
Open `http://localhost:5000` in Google Chrome (recommended for Web Speech API support).

---

## 🌿 Branching & Pull Request Workflow

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
   Or for bug fixes:
   ```bash
   git checkout -b fix/issue-description
   ```

2. Make clean, atomic commits with descriptive messages:
   ```bash
   git commit -m "feat: add multi-turn audio transcription support"
   ```

3. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a **Pull Request** targeting the `main` branch with a clear description of changes.

---

## 📝 Code Style Guidelines

- **Python**: Follow [PEP 8](https://peps.python.org/pep-0008/) style standards.
- **JavaScript**: Use modern ES6+ syntax and clean naming conventions.
- **Security**: Never commit API keys or sensitive secrets. Always use `.env`.

---

## 💬 Community & Questions

If you have questions, feel free to open a Discussion or reach out in an Issue. Happy coding!
