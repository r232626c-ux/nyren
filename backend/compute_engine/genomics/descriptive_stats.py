"""
Descriptive statistics pipeline.

Generic per-feature summary statistics (mean, median, stdev, min, max,
coefficient of variation) over a genes/samples/values matrix. Useful beyond
gene expression — any numeric feature-by-sample matrix (biochemistry assay
readings, physics instrument channels, bioinformatics QC metrics, etc.) fits
the same dataset shape already accepted by the other pipelines.
"""
import math
from statistics import mean, median, stdev


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


def _describe_row(row):
    numeric_values = [_safe_float(x) for x in row]
    numeric_values = [x for x in numeric_values if x is not None]

    if not numeric_values:
        return {
            'mean': None, 'median': None, 'stdev': None,
            'min': None, 'max': None, 'coefficientOfVariation': None,
            'missing': len(row),
        }

    mean_value = mean(numeric_values)
    stdev_value = stdev(numeric_values) if len(numeric_values) > 1 else 0.0
    cv = (stdev_value / mean_value) if mean_value not in (0, None) else None

    return {
        'mean': round(mean_value, 6),
        'median': round(median(numeric_values), 6),
        'stdev': round(stdev_value, 6),
        'min': round(min(numeric_values), 6),
        'max': round(max(numeric_values), 6),
        'coefficientOfVariation': round(cv, 6) if cv is not None else None,
        'missing': len(row) - len(numeric_values),
    }


def run_descriptive_stats(dataset, params=None):
    params = params or {}
    genes, samples, values = _validate_matrix(dataset)

    limit = int(params.get('limit', 500))
    features = []
    for gene, row in list(zip(genes, values))[:limit]:
        stats = _describe_row(row)
        stats['feature'] = gene
        features.append(stats)

    numeric_stdevs = [f['stdev'] for f in features if f['stdev'] is not None]
    overall = {
        'featureCount': len(genes),
        'sampleCount': len(samples),
        'featuresReturned': len(features),
        'meanStdevAcrossFeatures': round(mean(numeric_stdevs), 6) if numeric_stdevs else None,
    }

    return {
        'features': features,
        'summary': overall,
    }
