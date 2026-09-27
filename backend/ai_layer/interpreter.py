import json
import os
import re
import sys
import urllib.request
import urllib.error
from ai_layer.prompts import build_interpretation_prompt

# Strict AI safety controls
ALLOWED_DATA_TYPES = {'qc_report', 'normalization', 'differential_expression', 'biomarker_rankings'}
MAX_PROMPT_LENGTH = 8000
MAX_RESPONSE_LENGTH = 2000
PROHIBITED_PATTERNS = [
    r'<script',
    r'javascript:',
    r'on\w+\s*=',
    r'<iframe',
    r'<object',
    r'\\x[0-9a-fA-F]{2}',  # Hex escape sequences
    r'\\u[0-9a-fA-F]{4}',  # Unicode escape sequences
]


def _validate_structured_data(data):
    """Ensure AI only receives structured data from compute_engine"""
    if not isinstance(data, dict):
        raise ValueError("AI input must be a structured dictionary")

    # Check that only allowed data types are present
    for key in data.keys():
        if key not in ALLOWED_DATA_TYPES and key not in {'pipeline', 'task_params'}:
            raise ValueError(f"Disallowed data type in AI input: {key}")

    # Validate data doesn't contain raw dataset
    if 'raw_dataset' in data or 'dataset' in data:
        raise ValueError("Raw dataset input to AI is prohibited")

    return True

def _sanitize_text(text):
    """Remove potentially harmful content from text"""
    if not isinstance(text, str):
        return str(text)

    # Remove prohibited patterns
    for pattern in PROHIBITED_PATTERNS:
        text = re.sub(pattern, '[FILTERED]', text, flags=re.IGNORECASE)

    return text

def _validate_prompt_length(prompt):
    """Ensure prompt doesn't exceed maximum length"""
    if len(prompt) > MAX_PROMPT_LENGTH:
        raise ValueError(f"Prompt too long: {len(prompt)} > {MAX_PROMPT_LENGTH}")
    return True


def _load_api_key():
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise RuntimeError('OPENAI_API_KEY environment variable is required for AI interpretation.')
    return api_key


def _build_openai_payload(prompt, model):
    return json.dumps({
        'model': model,
        'messages': [
            {'role': 'system', 'content': 'You are a precise scientific interpretation engine.'},
            {'role': 'user', 'content': prompt},
        ],
        'temperature': 0.0,
        'max_tokens': 500,
        'top_p': 1.0,
    }).encode('utf-8')


def _extract_json(text):
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        raise ValueError('Unable to extract JSON from OpenAI response.')
    return match.group(0)


def _call_openai(prompt, model):
    api_key = _load_api_key()
    url = os.getenv('OPENAI_API_URL', 'https://api.openai.com/v1/chat/completions')
    payload = _build_openai_payload(prompt, model)
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}',
    }

    request = urllib.request.Request(url, data=payload, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return response.read().decode('utf-8')
    except urllib.error.HTTPError as exc:
        body = exc.read().decode('utf-8')
        raise RuntimeError(f'OpenAI API failed ({exc.code}): {body}')
    except urllib.error.URLError as exc:
        raise RuntimeError(f'OpenAI request failed: {exc.reason}')


def interpret_analysis(analysis_result, model=None):
    # AI Safety Layer: Validate input structure
    _validate_structured_data(analysis_result)

    model = model or os.getenv('OPENAI_MODEL') or 'gpt-3.5-turbo'
    prompt = build_interpretation_prompt(analysis_result)

    # Sanitize and validate prompt
    prompt = _sanitize_text(prompt)
    _validate_prompt_length(prompt)

    print(f'[AI SAFETY] Sending structured analysis data to {model}', file=sys.stderr)

    response_text = _call_openai(prompt, model)

    # Validate response length
    if len(response_text) > MAX_RESPONSE_LENGTH:
        raise ValueError(f"AI response too long: {len(response_text)} > {MAX_RESPONSE_LENGTH}")

    raw_json = _extract_json(response_text)
    interpretation = json.loads(raw_json)

    if not isinstance(interpretation, dict):
        raise ValueError('Interpreter response is not valid JSON object.')

    required_keys = {'interpretation', 'biological_meaning', 'confidence', 'recommendations'}
    if not required_keys.issubset(interpretation.keys()):
        raise ValueError(f'Interpreter JSON must include {sorted(required_keys)}.')

    confidence = interpretation.get('confidence')
    if not isinstance(confidence, (int, float)) or not 0.0 <= float(confidence) <= 1.0:
        raise ValueError('confidence must be a numeric value between 0.0 and 1.0')

    # Sanitize output
    result = {
        'interpretation': _sanitize_text(interpretation['interpretation']),
        'biological_meaning': _sanitize_text(interpretation['biological_meaning']),
        'confidence': float(confidence),
        'recommendations': [_sanitize_text(rec) for rec in interpretation['recommendations']] if isinstance(interpretation['recommendations'], list) else [_sanitize_text(interpretation['recommendations'])],
        'raw_response': response_text,  # Keep raw for debugging but don't expose
        'model': model,
    }

    print(f'[AI SAFETY] Successfully processed interpretation with confidence {result["confidence"]}', file=sys.stderr)
    return result


if __name__ == '__main__':
    if len(sys.argv) != 2 or sys.argv[1] != '--test':
        print('This module is intended to be imported by the pipeline router.', file=sys.stderr)
        sys.exit(1)
    print('AI interpreter module loaded successfully.')
