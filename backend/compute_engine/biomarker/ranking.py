import math


def _safe_score(value, default=0.0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _consistency_score(entry):
    group_a_mean = _safe_score(entry.get('group_a_mean'))
    group_b_mean = _safe_score(entry.get('group_b_mean'))
    numerator = min(abs(group_a_mean), abs(group_b_mean))
    denominator = max(abs(group_a_mean), abs(group_b_mean), 1e-8)
    stability = numerator / denominator
    return round(stability, 6)


def _significance_score(p_value):
    p = _safe_score(p_value, 1.0)
    if p <= 0:
        return 0.0
    return -math.log10(min(max(p, 1e-100), 1.0))


def _fold_change_score(log_fc):
    return abs(_safe_score(log_fc))


def rank_biomarkers(de_results, top_n=50):
    entries = []
    for item in de_results:
        log_fc = item.get('log_fold_change', 0.0)
        p_value = item.get('p_value', 1.0)
        consistency = _consistency_score(item)
        significance = _significance_score(p_value)
        score = (
            _fold_change_score(log_fc) * 2.0
            + significance * 1.5
            + consistency * 1.0
        )
        entries.append({
            'gene': item.get('gene'),
            'score': round(score, 6),
            'log_fold_change': round(log_fc, 6),
            'p_value': round(p_value, 8),
            'consistency': round(consistency, 6),
            'details': {
                'significance_score': round(significance, 6),
                'fold_change_magnitude': round(abs(log_fc), 6),
            },
        })

    sorted_entries = sorted(entries, key=lambda row: (row['score'], abs(row['log_fold_change'])), reverse=True)
    return sorted_entries[:top_n]
