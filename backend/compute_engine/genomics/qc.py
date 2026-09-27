import math
from statistics import mean, stdev, median


def _safe_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (ValueError, TypeError):
        return None


def _validate_matrix(dataset):
    genes = dataset.get('genes') or []
    samples = dataset.get('samples') or []
    values = dataset.get('values') or []

    if not genes or not samples or not values:
        raise ValueError('Dataset must contain genes, samples, and values arrays.')

    if len(values) != len(genes):
        raise ValueError('Gene count must match row count in values matrix.')

    for row in values:
        if len(row) != len(samples):
            raise ValueError('Each values row must contain a value for every sample.')

    return genes, samples, values


def _flatten(matrix):
    return [x for row in matrix for x in row if x is not None]


def _is_nonnegative(data):
    return all((x is None or x >= 0) for x in data)


def _compute_variance(row):
    numeric_values = [x for x in row if x is not None]
    if len(numeric_values) < 2:
        return 0.0
    return stdev(numeric_values) ** 2


def _describe_distribution(values):
    numeric_values = [x for x in values if x is not None]
    if not numeric_values:
        return {
            'min': None,
            'max': None,
            'mean': None,
            'median': None,
            'skew': None,
        }

    values_sorted = sorted(numeric_values)
    mean_value = mean(numeric_values)
    median_value = median(numeric_values)
    skew = None
    if len(numeric_values) > 2:
        variance = sum((x - mean_value) ** 2 for x in numeric_values) / (len(numeric_values) - 1)
        std = math.sqrt(variance)
        if std > 0:
            skew = sum((x - mean_value) ** 3 for x in numeric_values) / ((len(numeric_values) - 1) * (std ** 3))

    return {
        'min': values_sorted[0],
        'max': values_sorted[-1],
        'mean': mean_value,
        'median': median_value,
        'skew': skew,
    }


def run_qc(dataset, params=None):
    params = params or {}
    genes, samples, values = _validate_matrix(dataset)

    transformed = []
    for row in values:
        transformed.append([_safe_float(x) for x in row])

    gene_reports = []
    sample_missing = {sample: 0 for sample in samples}
    total_missing = 0

    for gene, row in zip(genes, transformed):
        missing = sum(1 for x in row if x is None or (isinstance(x, float) and math.isnan(x)))
        total_missing += missing
        for idx, x in enumerate(row):
            if x is None or (isinstance(x, float) and math.isnan(x)):
                sample_missing[samples[idx]] += 1

        numeric_row = [x for x in row if x is not None]
        gene_variance = _compute_variance(numeric_row)
        gene_reports.append({
            'gene': gene,
            'missing_values': missing,
            'variance': gene_variance,
            'sample_count': len(samples),
            'valid_points': len(numeric_row),
        })

    variance_values = [item['variance'] for item in gene_reports]
    variance_threshold = params.get('variance_threshold')
    if variance_threshold is None:
        variance_threshold = median(variance_values) * 0.25 if variance_values else 0.0

    low_variance_genes = [item['gene'] for item in gene_reports if item['variance'] < variance_threshold]

    flattened = _flatten(transformed)
    distribution = _describe_distribution(flattened)

    needs_normalization = False
    recommended_method = None
    if distribution['median'] is not None and distribution['mean'] is not None:
        if distribution['median'] / distribution['mean'] < 0.85 and _is_nonnegative(flattened):
            needs_normalization = True
            recommended_method = 'log_transform'
        elif distribution['skew'] is not None and abs(distribution['skew']) > 1.0:
            needs_normalization = True
            recommended_method = 'log_transform' if _is_nonnegative(flattened) else 'z_score'
        elif distribution['mean'] and distribution['max'] and distribution['max'] / distribution['mean'] > 10:
            needs_normalization = True
            recommended_method = 'log_transform'

    qc_report = {
        'dataset_type': dataset.get('type', 'gene_expression'),
        'genes': len(genes),
        'samples': len(samples),
        'total_missing_values': total_missing,
        'sample_missing_distribution': sample_missing,
        'variance_threshold': variance_threshold,
        'low_variance_genes': low_variance_genes,
        'distribution': distribution,
        'needs_normalization': needs_normalization,
        'recommended_normalization': recommended_method,
    }

    return qc_report
