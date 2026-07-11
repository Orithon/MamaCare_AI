import json
import re
import google.generativeai as genai
from core.config import get_settings

settings = get_settings()

genai.configure(api_key=settings.GEMINI_API_KEY)
# Updated to use the 2.5-flash model as specified by the AI engineer
model = genai.GenerativeModel("gemini-2.5-flash")

LANGUAGE_NAMES = {
    "en": "English",
    "yo": "Yoruba",
    "ig": "Igbo",
    "ha": "Hausa",
}


def _clean_json(text: str) -> str:
    """Strip markdown code fences from Gemini JSON responses."""
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    return text.strip()


def rule_based_check(symptoms: list[str]) -> str | None:
    """Returns a forced minimum risk level, or None if no override applies."""
    critical_symptoms = ["vaginal bleeding", "severe abdominal pain"]
    for symptom in symptoms:
        if symptom.lower() in critical_symptoms:
            return "critical" # Note: using critical to match our backend scale if we want, or high as AI eng used. Let's stick to 'high' if the AI eng used high, but our backend uses CRITICAL. The AI eng used "high".
    return None


RISK_LEVELS = {"low": 0, "moderate": 1, "high": 2, "critical": 3}

async def predict_risk(health_data: dict, language: str = "en") -> dict:
    """
    Send patient health data to Gemini and get a structured risk assessment.
    Returns: { risk_level, conditions_flagged, explanation, recommendations }
    """
    lang_name = LANGUAGE_NAMES.get(language, "English")
    
    # Filter out None values
    filtered_data = {k: v for k, v in health_data.items() if v is not None}

    prompt = f""" You are a maternal health risk assessment AI. Analyse the provided health data and return
              a JSON response only. No markdown, no explanation outside the JSON.

            Assess the maternal health risk for a pregnant patient. Note: not all readings may be available- 
            base your assessment on whatever data is provided, and mention in your explanation if key missing 
            readings would help refine the assessment.

            Patient Data: {json.dumps(filtered_data)}
            Language for response : {lang_name}

            Return JSON: 
            {{
                "risk_level" : "low|moderate|high|critical",
                "conditions_flagged": ["condition1", "condition2"],
                "explanation": "plain language explanation in {lang_name}",
                "recommendations" : ["action1", "action2", "action3"]
            }}"""

    response = model.generate_content(prompt)
    cleaned = _clean_json(response.text)

    try:
        result = json.loads(cleaned)
        
        # Apply rule-based safety override
        symptoms = health_data.get("symptoms", [])
        forced_minimum = rule_based_check(symptoms)
        
        # Ensure risk_level is in our dictionary and uppercase it for standardisation
        current_risk = str(result.get("risk_level", "moderate")).lower()
        if current_risk not in RISK_LEVELS:
            current_risk = "moderate"
            
        if forced_minimum and RISK_LEVELS.get(current_risk, 0) < RISK_LEVELS.get(forced_minimum, 0):
            result["risk_level"] = forced_minimum.upper()
        else:
            result["risk_level"] = current_risk.upper()
            
        return result
    except json.JSONDecodeError:
        # Fallback structure if Gemini response is malformed
        return {
            "risk_level": "MODERATE",
            "conditions_flagged": ["Unable to fully analyze data"],
            "explanation": "We were unable to process your data properly. Please consult your healthcare provider.",
            "recommendations": ["Please visit your nearest health facility for a full assessment"]
        }


async def summarize_report(extracted_text: str, language: str = "en") -> dict:
    """
    Takes raw extracted text from a medical report and returns
    a plain-language summary and recommendations.
    Returns: dict with 'simplified_summary' and 'recommendations'
    """
    lang_name = LANGUAGE_NAMES.get(language, "English")
    
    prompt = f""" You are a maternal health assistant helping a pregnant patient understand her medical report.
             Use simple, compassionate language. Respond only in {lang_name}.

             Please explain this medical report to me.
             
             {extracted_text[:4000]}
             
             Tell me:
            1. What the key values mean
            2. Explain (if any) side notes by the doctor
            3. Which values (if any) are abnormal
            4. What should I do next

            Return ONLY a valid JSON object with NO extra text, NO markdown, in this exact structure:
            {{
                "simplified_summary": "A 2-4 sentence simple explanation covering points 1, 2, and 3",
                "recommendations": ["A list of actionable next steps for the patient based on point 4"]
            }}
            """

    response = model.generate_content(prompt)
    cleaned = _clean_json(response.text)

    try:
        result = json.loads(cleaned)
        return result
    except json.JSONDecodeError:
        return {
            "simplified_summary": "We were unable to fully process this report. Please consult your healthcare provider.",
            "recommendations": ["Please visit your nearest health facility to review these results with a doctor."]
        }


async def chat_response(message: str, language: str, conversation_history: list = []) -> str:
    """
    Responds to a maternal health question in the specified language.
    Maintains conversation context via history.
    """
    lang_name = LANGUAGE_NAMES.get(language, "English")

    system_prompt = f"""
You are MamaCare, a friendly maternal health assistant.
Only answer questions related to pregnancy, maternal health, nutrition, symptoms 
and when to see a doctor. If asked off-topic questions, politely redirect to maternal health.
Always consider that the pregnant woman is a nigerian and is based in nigeria
Always repsond in {lang_name}. Keep responses under 150 words.
"""

    # Build conversation for context
    history_text = ""
    for msg in conversation_history[-6:]:  # last 3 exchanges
        role = "User" if msg["role"] == "user" else "MamaCare AI"
        history_text += f"{role}: {msg['content']}\n"

    full_prompt = f"{system_prompt}\n\nConversation so far:\n{history_text}\nQuestion: {message}\n"

    response = model.generate_content(full_prompt)
    return response.text.strip()


async def generate_health_tip(gestational_age_weeks: int, pre_existing_conditions: list, language: str = "en") -> str:
    """
    Generate a personalized daily health tip based on the patient's
    current gestational week and health profile.
    """
    lang_name = LANGUAGE_NAMES.get(language, "English")
    conditions_text = ', '.join(pre_existing_conditions) if pre_existing_conditions else "none"

    prompt = f"""
You are MamaCare AI, a maternal health assistant.

Generate ONE practical, encouraging, and personalized daily health tip for a pregnant woman with the following profile:
- Gestational Age: {gestational_age_weeks} weeks pregnant
- Pre-existing conditions: {conditions_text}

The tip should be:
- Directly relevant to where she is in her pregnancy (week {gestational_age_weeks})
- Specific — not generic advice like "drink water"
- Warm and encouraging in tone
- Maximum 3 sentences
- Written in {lang_name}

Return ONLY the tip text. No labels, no JSON, no extra text.
"""

    response = model.generate_content(prompt)
    return response.text.strip()