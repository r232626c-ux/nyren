import json


def build_interpretation_prompt(analysis_result):
    structured = json.dumps(analysis_result, indent=2)

    return (
        "You are a scientific AI interpreter for genomics and biomarker discovery. ``\n"
        "Produce only valid JSON with the exact keys: interpretation, biological_meaning, confidence, recommendations. ``\n"
        "Do not invent new data or hallucinate. Use only the computed results provided below. ``\n"
        "Keep a scientific tone, cite the structured metrics when appropriate, and be concise. ``\n"
        "The confidence value must be a number between 0.0 and 1.0. ``\n"
        "The recommendations array must contain zero or more concise actionable next steps. ``\n"
        "If the input is missing data or insufficient for interpretation, explain that clearly in the interpretation field and set confidence accordingly. ``\n"
        "Input: "
        "\n" + structured + "\n"
    )
