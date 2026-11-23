import json
import os
from groq import Groq

class InterviewEvaluator:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=api_key) if api_key else None
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    def generate_report(self, transcript, role="Candidate"):
        """
        Analyzes the transcript and returns a JSON report.
        """
        if not self.client:
            return json.dumps({
                "technical_score": 0,
                "soft_skills_score": 0,
                "feedback": "GROQ_API_KEY is missing. Please configure it in your .env file.",
                "areas_to_improve": ["Configure environment variables", "Ensure valid API access", "Restart application"]
            })

        prompt = (
            f"Review the following mock interview transcript for the role of {role}. "
            "Provide a detailed evaluation in strictly JSON format with the following keys: "
            "'technical_score' (integer 1-10), 'soft_skills_score' (integer 1-10), 'feedback' (2-sentence summary), "
            "'areas_to_improve' (list of 3 specific actionable advice strings).\n\n"
            f"Transcript: {transcript}"
        )

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in InterviewEvaluator: {e}")
            return json.dumps({
                "technical_score": 5,
                "soft_skills_score": 5,
                "feedback": f"Report generated with fallback: {str(e)}",
                "areas_to_improve": ["Clear articulation", "Structured STAR method responses", "Technical depth"]
            })