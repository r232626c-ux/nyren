"""
Correlation analysis pipeline.

Pairwise Pearson correlation between the highest-variance features in a
genes/samples/values matrix. Applicable across domains that share this
matrix shape: co-expressed genes (bioinformatics), correlated assay readouts
(biochemistry), or correlated instrument channels (physics).
"""
from statistics import mean, stdev


def _safe_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _validate_matrix(dataset):
    genes = dataset.get('genes') or []
    samples = dataset.get('samples') or []
    values = dataset.get('values') or []

    if not genes or not samples or not values:
        raise ValueError('Dataset must contain genes, samples, and values arrays.')

    if len(values) != len(genes):
        raise ValueError('Feature count must match row count in values matrix.')

    for row in values:
        if len(row) != len(samples):
            raise ValueError('Each values row must contain a value for every sample.')

    return genes, samples, values


def _row_variance(row):
    numeric_values = [_safe_float(x) for x in row]
    numeric_values = [x for x in numeric_values if x is not None]
    if len(numeric_values) < 2:
        return 0.0
    return stdev(numeric_values) ** 2


def _pearson(row_a, row_b):
    pairs = [
        (_safe_float(a), _safe_float(b))
        for a, b in zip(row_a, row_b)
        if _safe_float(a) is not None and _safe_float(b) is not None
    ]
    if len(pairs) < 2:
        return None

    xs = [p[0] for p in pairs]
    ys = [p[1] for p in pairs]
    mean_x, mean_y = mean(xs), mean(ys)

    numerator = sum((x - mean_x) * (y - mean_y) for x, y in pairs)
    denom_x = sum((x - mean_x) ** 2 for x in xs) ** 0.5
    denom_y = sum((y - mean_y) ** 2 for y in ys) ** 0.5

    if denom_x == 0 or denom_y == 0:
        return None

    return round(numerator / (denom_x * denom_y), 6)


def run_correlation_analysis(dataset, params=None):
    params = params or {}
    genes, samples, values = _validate_matrix(dataset)

    top_n = min(int(params.get('top_n', 20)), len(genes))
    threshold = float(params.get('threshold', 0.7))

    ranked = sorted(
        zip(genes, values), key=lambda gv: _row_variance(gv[1]), reverse=True
    )[:top_n]

    top_genes = [g for g, _ in ranked]
    top_rows = [row for _, row in ranked]

    matrix = []
    strong_pairs = []
    for i in range(len(top_rows)):
        row_corrs = []
        for j in range(len(top_rows)):
            r = 1.0 if i == j else _pearson(top_rows[i], top_rows[j])
            row_corrs.append(r)
            if j > i and r is not None and abs(r) >= threshold:
                strong_pairs.append({
                    'featureA': top_genes[i],
                    'featureB': top_genes[j],
                    'correlation': r,
                })
        matrix.append(row_corrs)

    strong_pairs.sort(key=lambda p: abs(p['correlation']), reverse=True)

    return {
        'features': top_genes,
        'correlationMatrix': matrix,
        'strongPairs': strong_pairs[:50],
        'threshold': threshold,
    }
