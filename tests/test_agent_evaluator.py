import json
from utils.ai_agent import InterviewAgent
from utils.evaluator import InterviewEvaluator


def test_ai_agent_without_api_key(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    agent = InterviewAgent()
    assert agent.model == "llama-3.3-70b-versatile"
    response = agent.get_response([])
    assert "Groq API key is not configured" in response


def test_evaluator_without_api_key(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    evaluator = InterviewEvaluator()
    assert evaluator.model == "llama-3.3-70b-versatile"
    report_raw = evaluator.generate_report([])
    report = json.loads(report_raw)
    assert report["technical_score"] == 0
    assert "GROQ_API_KEY is missing" in report["feedback"]
