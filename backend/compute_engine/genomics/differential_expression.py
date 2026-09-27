import math
from statistics import mean, stdev


class PipelineError(Exception):
    pass


def _safe_float(value):
    try:
        if value is None:
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _group_indices(dataset, params):
    metadata = dataset.get('metadata', {}) or {}
    samples = dataset.get('samples') or []
    group_a = params.get('group_a')
    group_b = params.get('group_b')
    group_key = params.get('group_key', 'condition')

    if group_a and group_b:
        a_indices = [i for i, sample in enumerate(samples) if metadata.get(sample, {}).get(group_key) == group_a]
        b_indices = [i for i, sample in enumerate(samples) if metadata.get(sample, {}).get(group_key) == group_b]
    else:
        groups = {}
        for idx, sample in enumerate(samples):
            value = metadata.get(sample, {}).get(group_key)
            if value is not None:
                groups.setdefault(value, []).append(idx)

        if len(groups) < 2:
            raise PipelineError('Unable to infer two comparison groups from dataset metadata.')

        group_names = sorted(groups.keys())[:2]
        a_indices = groups[group_names[0]]
        b_indices = groups[group_names[1]]
        group_a, group_b = group_names

    if not a_indices or not b_indices:
        raise PipelineError('Group indices for differential analysis are invalid or incomplete.')

    return group_a, group_b, a_indices, b_indices


def _variance(values):
    numeric_values = [x for x in values if x is not None]
    if len(numeric_values) < 2:
        return 0.0
    return stdev(numeric_values) ** 2


def _safe_mean(values):
    numeric_values = [x for x in values if x is not None]
    return mean(numeric_values) if numeric_values else 0.0


def _log2(x):
    return math.log2(x) if x > 0 else 0.0


def _student_t_p_value(t_stat, df):
    if df <= 0:
        return 1.0

    x = df / (df + t_stat * t_stat)
    a = df / 2.0
    b = 0.5
    try:
        ib = _betai(a, b, x)
    except Exception:
        return 1.0

    p = min(1.0, max(0.0, ib))
    return 2.0 * min(p, 1.0 - p)


def _betacf(a, b, x, max_iter=200, eps=3e-7):
    am = 1.0
    bm = 1.0
    az = 1.0
    qab = a + b
    qap = a + 1.0
    qam = a - 1.0
    bz = 1.0 - qab * x / qap

    for m in range(1, max_iter + 1):
        em = float(m)
        tem = em + em
        d = em * (b - em) * x / ((qam + tem) * (a + tem))
        ap = az + d * am
        bp = bz + d * bm
        d = -(a + em) * (qab + em) * x / ((a + tem) * (qap + tem))
        app = ap + d * az
        bpp = bp + d * bz
        aold = az
        am = ap / bpp
        bm = bp / bpp
        az = app / bpp
        bz = 1.0 + (b - em) * x / (qam + tem) * bm
        if abs(az - aold) < (eps * abs(az)):
            return az

    return az


def _betai(a, b, x):
    if x < 0.0 or x > 1.0:
        raise ValueError('x must be between 0 and 1 in betai')

    if x == 0.0 or x == 1.0:
        return x

    lbeta = math.lgamma(a) + math.lgamma(b) - math.lgamma(a + b)
    prefix = math.exp(a * math.log(x) + b * math.log(1.0 - x) - lbeta) / a
    if x < (a + 1.0) / (a + b + 2.0):
        return prefix * _betacf(a, b, x)
    return 1.0 - prefix * _betacf(b, a, 1.0 - x)


def _adjust_pvalues(results):
    sorted_results = sorted(results, key=lambda item: item['p_value'] if item['p_value'] is not None else 1.0)
    n = len(sorted_results)
    for rank, entry in enumerate(sorted_results, start=1):
        p = entry['p_value'] if entry['p_value'] is not None else 1.0
        entry['adjusted_p_value'] = min(1.0, p * n / rank)
    return sorted_results


def perform_differential_expression(dataset, params=None):
    params = params or {}
    genes = dataset.get('genes') or []
    values = dataset.get('values') or []

    if not genes or not values:
        raise PipelineError('Empty gene expression dataset provided.')

    group_a, group_b, a_indices, b_indices = _group_indices(dataset, params)
    results = []

    for gene, row in zip(genes, values):
        row = [_safe_float(x) for x in row]
        a_values = [row[i] for i in a_indices if row[i] is not None]
        b_values = [row[i] for i in b_indices if row[i] is not None]

        if not a_values or not b_values:
            p_value = 1.0
            t_stat = 0.0
        else:
            a_mean = _safe_mean(a_values)
            b_mean = _safe_mean(b_values)
            a_var = _variance(a_values)
            b_var = _variance(b_values)
            n_a = len(a_values)
            n_b = len(b_values)
            denom = math.sqrt((a_var / n_a if n_a else 0.0) + (b_var / n_b if n_b else 0.0))
            t_stat = (a_mean - b_mean) / denom if denom > 0 else 0.0
            df_num = ((a_var / n_a if n_a else 0.0) + (b_var / n_b if n_b else 0.0)) ** 2
            df_denom = ((a_var ** 2) / ((n_a ** 2) * (n_a - 1)) if n_a > 1 else 0.0) + ((b_var ** 2) / ((n_b ** 2) * (n_b - 1)) if n_b > 1 else 0.0)
            df = df_num / df_denom if df_denom > 0 else min(n_a, n_b) - 1
            p_value = _student_t_p_value(abs(t_stat), df) if df > 0 else 1.0

        log_fc = _log2(_safe_mean(a_values) + 1) - _log2(_safe_mean(b_values) + 1)
        results.append({
            'gene': gene,
            'group_a': group_a,
            'group_b': group_b,
            'group_a_mean': _safe_mean(a_values),
            'group_b_mean': _safe_mean(b_values),
            'log_fold_change': log_fc,
            't_statistic': t_stat,
            'p_value': p_value,
            'sample_count_a': len(a_values),
            'sample_count_b': len(b_values),
        })

    adjusted = _adjust_pvalues(results)
    return {
        'task': 'differential_expression',
        'comparison': {
            'group_a': group_a,
            'group_b': group_b,
            'indexes_a': a_indices,
            'indexes_b': b_indices,
        },
        'results': adjusted,
    }
