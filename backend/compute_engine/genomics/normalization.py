import math
from statistics import mean, stdev


def _safe_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (ValueError, TypeError):
        return None


def _safe_values(values):
    return [_safe_float(x) for x in values]


def _z_score(row):
    numeric_row = [x for x in row if x is not None]
    if not numeric_row:
        return [0.0 for _ in row]

    avg = mean(numeric_row)
    if len(numeric_row) > 1:
        std = stdev(numeric_row)
    else:
        std = 0.0

    if std <= 0:
        return [0.0 if x is None else 0.0 for x in row]

    normalized = []
    for x in row:
        if x is None:
            normalized.append(None)
        else:
            normalized.append((x - avg) / std)
    return normalized


def log_transform(values):
    flattened = [x for row in values for x in row if x is not None]
    min_value = min(flattened) if flattened else 0.0
    offset = 0.0 if min_value >= 0 else abs(min_value)

    transformed = []
    for row in values:
        transformed.append([
            None if x is None else math.log2(max(x + offset, 0.0) + 1)
            for x in row
        ])

    return transformed


def z_score_normalize(values):
    normalized = []
    for row in values:
        normalized.append(_z_score(row))
    return normalized


def normalize(dataset, method='log_zscore'):
    values = dataset.get('values') or []
    normalized_values = _safe_values(values)

    if method == 'log':
        normalized_values = log_transform(normalized_values)
    elif method == 'z_score':
        normalized_values = z_score_normalize(normalized_values)
    elif method == 'log_zscore':
        normalized_values = z_score_normalize(log_transform(normalized_values))
    else:
        raise ValueError(f'Unsupported normalization method: {method}')

    normalized_dataset = {
        'genes': dataset.get('genes'),
        'samples': dataset.get('samples'),
        'metadata': dataset.get('metadata', {}),
        'type': dataset.get('type', 'gene_expression'),
        'values': normalized_values,
    }

    audit = {
        'method': method,
        'gene_count': len(normalized_dataset['genes'] or []),
        'sample_count': len(normalized_dataset['samples'] or []),
    }

    return normalized_dataset, audit
