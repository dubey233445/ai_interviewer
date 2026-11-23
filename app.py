import os
import json
import uuid
from io import BytesIO
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, emit
from dotenv import load_dotenv
from pypdf import PdfReader
from docx import Document

from utils.ai_agent import InterviewAgent
from utils.evaluator import InterviewEvaluator
from utils.audio_processor import AudioProcessor

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET', 'open-source-ai-interviewer-secret-key')
socketio = SocketIO(app, cors_allowed_origins="*", async_mode=None)

# Initialize AI Agent and Evaluator
agent = InterviewAgent()
evaluator = InterviewEvaluator()
audio_proc = AudioProcessor()

# In-memory storage for session history
# In production, consider Redis or a database backend
chat_histories = {}
integrity_events = {}
resume_sessions = {}
interview_sessions = {}

# --- ROUTES ---

@app.route('/')
def index():
    """Landing page for resume upload."""
    return render_template('index.html')

@app.post('/start-interview')
def start_interview():
    resume_file = request.files.get('resume')
    if not resume_file or not resume_file.filename:
        return render_template('index.html', error='Please upload your resume to continue.'), 400

    extension = os.path.splitext(resume_file.filename)[1].lower()
    try:
        if extension == '.pdf':
            resume_text = '\n'.join(page.extract_text() or '' for page in PdfReader(resume_file).pages)
        elif extension == '.docx':
            document = Document(BytesIO(resume_file.read()))
            resume_text = '\n'.join(paragraph.text for paragraph in document.paragraphs)
        elif extension == '.txt':
            resume_text = resume_file.read().decode('utf-8', errors='replace')
        else:
            return render_template('index.html', error='Upload a PDF, DOCX, or TXT resume.'), 400
    except Exception:
        return render_template('index.html', error='We could not read that resume. Please try another file.'), 400

    resume_text = resume_text.strip()
    if not resume_text:
        return render_template('index.html', error='The uploaded resume does not contain readable text.'), 400

    resume_id = uuid.uuid4().hex
    resume_sessions[resume_id] = resume_text[:20000]
    return redirect(f'/interview?resume_id={resume_id}')

@app.route('/interview')
def interview():
    """The live interview room."""
    return render_template('interview.html', role='Resume-based interview')

@app.route('/report')
def report():
    """The final performance analysis page."""
    return render_template('report.html')

# --- SOCKET LOGIC ---

@socketio.on('user_answer')
def handle_answer(data):
    session_id = request.sid
    session = interview_sessions.get(session_id, {})
    role = session.get('role', 'Resume-based interview')
    raw_text = data.get('text', '')
    user_text = audio_proc.clean_transcript(raw_text)
    if not user_text:
        return

    # Initialize history if new session
    if session_id not in chat_histories:
        chat_histories[session_id] = []
    
    # Append user answer
    chat_histories[session_id].append({"role": "user", "content": user_text})

    # Get AI HR Response
    ai_response = agent.get_response(
        chat_histories[session_id],
        role=role,
        resume_text=session.get('resume_text', '')
    )
    chat_histories[session_id].append({"role": "assistant", "content": ai_response})
    
    # Send voice-ready text back to frontend
    emit('hr_question', {'text': ai_response})

@socketio.on('start_interview')
def handle_start_interview(data):
    resume_id = str(data.get('resume_id', ''))
    resume_text = resume_sessions.pop(resume_id, '')
    if not resume_text:
        emit('interview_error', {'message': 'Resume session expired. Please upload your resume again.'})
        return

    session_id = request.sid
    interview_sessions[session_id] = {
        'role': 'Resume-based interview',
        'resume_text': resume_text
    }
    chat_histories[session_id] = []
    first_question = agent.get_response([], role='Resume-based interview', resume_text=resume_text)
    chat_histories[session_id].append({'role': 'assistant', 'content': first_question})
    emit('hr_question', {'text': first_question})

@socketio.on('integrity_event')
def handle_integrity_event(data):
    session_id = request.sid
    event_type = str(data.get('type', 'unknown'))[:80]
    details = str(data.get('details', ''))[:300]

    if session_id not in integrity_events:
        integrity_events[session_id] = []

    integrity_events[session_id].append({
        'type': event_type,
        'details': details,
        'timestamp': data.get('timestamp')
    })

@socketio.on('generate_report')
def handle_report(data):
    session_id = request.sid
    role = data.get('role', 'Candidate')
    history = chat_histories.get(session_id, [])
    session_events = integrity_events.get(session_id, [])
    
    if not history:
        fallback = json.dumps({
            "technical_score": 0,
            "soft_skills_score": 0,
            "feedback": "No interview transcript recorded. Please complete at least one question.",
            "areas_to_improve": ["Ensure mic permissions are granted", "Speak clearly into microphone", "Attempt multiple questions"],
            "integrity_events": session_events
        })
        emit('final_report', fallback)
        integrity_events.pop(session_id, None)
        return

    try:
        report_data = json.loads(evaluator.generate_report(history, role=role))
    except Exception as e:
        report_data = {
            "technical_score": 5,
            "soft_skills_score": 5,
            "feedback": f"Report generated with fallback: {str(e)}",
            "areas_to_improve": ["Clear articulation", "Structured STAR method responses", "Technical depth"]
        }
    report_data['integrity_events'] = session_events
    report_json_str = json.dumps(report_data)
    
    # Clean up session memory
    chat_histories.pop(session_id, None)
    integrity_events.pop(session_id, None)
    interview_sessions.pop(session_id, None)
    
    # Send the JSON string to the frontend
    emit('final_report', report_json_str)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    socketio.run(app, debug=debug, port=port)