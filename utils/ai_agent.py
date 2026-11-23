import os
from groq import Groq

class InterviewAgent:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        self.client = Groq(api_key=api_key) if api_key else None
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    def get_response(self, history, role="Software Engineer", resume_text=""):
        """
        Generates the next interview question based on chat history.
        """
        if not self.client:
            return "Groq API key is not configured. Please set GROQ_API_KEY in your .env file."

        resume_context = ""
        if resume_text:
            resume_context = (
                " Use the candidate resume below as the primary source for personalized questions. "
                "Ask about specific skills, projects, experience, or claims from it. "
                "Do not invent details that are not present.\n\n"
                f"CANDIDATE RESUME:\n{resume_text[:20000]}"
            )

        system_prompt = {
            "role": "system", 
            "content": (
                f"You are a senior HR Manager interviewing a candidate for a {role} position. "
                "Keep your responses concise (under 50 words / 1-2 sentences). Ask only ONE question at a time. "
                "If the candidate gives a brief answer, ask a follow-up to dig deeper. "
                "Be professional, slightly challenging, but encouraging."
                + resume_context
            )
        }
        
        # Ensure system prompt is always at the start
        messages = [system_prompt] + [msg for msg in history if msg.get("role") != "system"]

        try:
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=150
            )
            return completion.choices[0].message.content
        except Exception as e:
            print(f"Error calling Groq in InterviewAgent: {e}")
            return "I apologize, I experienced a brief connection glitch. Could you please repeat your response?"