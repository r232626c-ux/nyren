#!/usr/bin/env python3
import json
import logging
import os
import sys
import time
import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from compute_engine.genomics import qc, normalization, differential_expression, descriptive_stats, correlation
from compute_engine.biomarker.ranking import rank_biomarkers
from ai_layer.interpreter import interpret_analysis

logging.basicConfig(
    level=logging.INFO,
    format='[PIPELINE] %(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler('pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('pipeline_router')

SUPPORTED_TASKS = {
    'qc_pipeline',
    'differential_expression_pipeline',
    'biomarker_pipeline',
    'descriptive_stats_pipeline',
    'correlation_pipeline',
}

MAX_DATASET_SIZE = 100000  # Max rows
MAX_METADATA_SIZE = 10000  # Max metadata characters


def _load_payload():
    try:
        payload = json.load(sys.stdin)
    except json.JSONDecodeError as err:
        raise ValueError(f'Invalid JSON payload: {err}')

    if not isinstance(payload, dict):
        raise ValueError('Payload must be a JSON object.')

    return payload


def _validate_payload(payload):
    job_id = payload.get('job_id')
    dataset = payload.get('dataset')
    task_type = payload.get('task_type')
    params = payload.get('params', {})

    if not job_id:
        raise ValueError('job_id is required')

    if task_type not in SUPPORTED_TASKS:
        logger.warning(f'Unsupported task_type: {task_type} for job {job_id}')
        raise ValueError(f'Unsupported task_type: {task_type}. Supported: {SUPPORTED_TASKS}')

    if not isinstance(dataset, dict):
        raise ValueError('dataset must be an object with genes, samples, and values.')

    # Validate dataset structure
    if 'genes' not in dataset or not isinstance(dataset['genes'], list):
        raise ValueError('dataset must contain a genes array')
    if 'samples' not in dataset or not isinstance(dataset['samples'], list):
        raise ValueError('dataset must contain a samples array')
    if 'values' not in dataset or not isinstance(dataset['values'], list):
        raise ValueError('dataset must contain a values array')

    # Check dataset size limits
    if len(dataset['genes']) > MAX_DATASET_SIZE:
        raise ValueError(f'Dataset too large: {len(dataset["genes"])} genes exceeds limit of {MAX_DATASET_SIZE}')

    # Validate metadata size
    metadata_str = json.dumps(dataset.get('metadata', {}))
    if len(metadata_str) > MAX_METADATA_SIZE:
        raise ValueError(f'Metadata too large: {len(metadata_str)} characters exceeds limit of {MAX_METADATA_SIZE}')

    # Check for duplicate job execution (basic check)
    job_hash = hashlib.md5(json.dumps({
        'dataset_hash': hashlib.md5(json.dumps(dataset).encode()).hexdigest(),
        'task_type': task_type,
        'params': params
    }, sort_keys=True).encode()).hexdigest()

    logger.info(f'Validated job {job_id} with hash {job_hash[:8]}...')
    return dataset, task_type, params, job_id


def _run_qc(dataset, params):
    start_time = time.time()
    logger.info('Running QC pipeline')
    try:
        report = qc.run_qc(dataset, params)
        duration = time.time() - start_time
        logger.info(f'QC pipeline completed in {duration:.2f}s')
        return {
            'pipeline': 'qc_pipeline',
            'qc_report': report,
            'dataset_type': dataset.get('type', 'gene_expression'),
            'execution_time': duration,
        }
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f'QC pipeline failed after {duration:.2f}s: {e}')
        raise

def _run_differential_expression(dataset, params):
    start_time = time.time()
    logger.info('Running differential expression pipeline')
    try:
        qc_report = qc.run_qc(dataset, params)
        normalization_method = params.get('normalization_method', 'log_zscore')
        normalized_dataset, normalization_audit = normalization.normalize(dataset, normalization_method)
        de_report = differential_expression.perform_differential_expression(normalized_dataset, params)
        duration = time.time() - start_time
        logger.info(f'Differential expression pipeline completed in {duration:.2f}s')
        return {
            'pipeline': 'differential_expression_pipeline',
            'qc_report': qc_report,
            'normalization': normalization_audit,
            'differential_expression': de_report,
            'execution_time': duration,
        }
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f'Differential expression pipeline failed after {duration:.2f}s: {e}')
        raise

def _run_biomarker_pipeline(dataset, params):
    start_time = time.time()
    logger.info('Running biomarker discovery pipeline')
    try:
        qc_report = qc.run_qc(dataset, params)
        normalization_method = params.get('normalization_method', 'log_zscore')
        normalized_dataset, normalization_audit = normalization.normalize(dataset, normalization_method)
        de_report = differential_expression.perform_differential_expression(normalized_dataset, params)
        ranked = rank_biomarkers(de_report.get('results', []), top_n=params.get('top_n', 100))
        duration = time.time() - start_time
        logger.info(f'Biomarker discovery pipeline completed in {duration:.2f}s')
        return {
            'pipeline': 'biomarker_pipeline',
            'qc_report': qc_report,
            'normalization': normalization_audit,
            'differential_expression': de_report,
            'biomarker_rankings': ranked,
            'execution_time': duration,
        }
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f'Biomarker discovery pipeline failed after {duration:.2f}s: {e}')
        raise


def _run_descriptive_stats(dataset, params):
    start_time = time.time()
    logger.info('Running descriptive statistics pipeline')
    try:
        report = descriptive_stats.run_descriptive_stats(dataset, params)
        duration = time.time() - start_time
        logger.info(f'Descriptive statistics pipeline completed in {duration:.2f}s')
        return {
            'pipeline': 'descriptive_stats_pipeline',
            'descriptive_stats': report,
            'execution_time': duration,
        }
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f'Descriptive statistics pipeline failed after {duration:.2f}s: {e}')
        raise


def _run_correlation_pipeline(dataset, params):
    start_time = time.time()
    logger.info('Running correlation analysis pipeline')
    try:
        report = correlation.run_correlation_analysis(dataset, params)
        duration = time.time() - start_time
        logger.info(f'Correlation analysis pipeline completed in {duration:.2f}s')
        return {
            'pipeline': 'correlation_pipeline',
            'correlation_analysis': report,
            'execution_time': duration,
        }
    except Exception as e:
        duration = time.time() - start_time
        logger.error(f'Correlation analysis pipeline failed after {duration:.2f}s: {e}')
        raise


def _interpret_if_requested(result, params):
    if not params.get('interpret', True):
        return None

    logger.info('Running AI interpretation')
    interpretation_payload = {
        'pipeline': result.get('pipeline'),
        'qc_report': result.get('qc_report'),
        'normalization': result.get('normalization'),
        'differential_expression': result.get('differential_expression'),
        'biomarker_rankings': result.get('biomarker_rankings'),
        'task_params': params,
    }
    return interpret_analysis(interpretation_payload, model=params.get('ai_model'))


def _execute_task(dataset, task_type, params):
    if task_type == 'qc_pipeline':
        return _run_qc(dataset, params)
    if task_type == 'differential_expression_pipeline':
        return _run_differential_expression(dataset, params)
    if task_type == 'biomarker_pipeline':
        return _run_biomarker_pipeline(dataset, params)
    if task_type == 'descriptive_stats_pipeline':
        return _run_descriptive_stats(dataset, params)
    if task_type == 'correlation_pipeline':
        return _run_correlation_pipeline(dataset, params)
    raise ValueError(f'Unsupported pipeline task: {task_type}')


def main():
    payload = _load_payload()
    dataset, task_type, params, job_id = _validate_payload(payload)
    max_retries = int(payload.get('max_retries', 2))
    backoff_seconds = int(payload.get('backoff_seconds', 5))

    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f'Executing pipeline job {job_id or "unknown"} attempt {attempt}')
            result = _execute_task(dataset, task_type, params)
            interpretation = _interpret_if_requested(result, params)
            output = {
                'status': 'success',
                'job_id': job_id,
                'attempt': attempt,
                'result': result,
                'interpretation': interpretation,
            }
            print(json.dumps(output))
            return 0
        except Exception as err:
            logger.error(f'Pipeline execution failed on attempt {attempt}: {err}')
            last_error = str(err)
            if attempt < max_retries:
                time.sleep(backoff_seconds)
                continue
            output = {
                'status': 'failed',
                'job_id': job_id,
                'attempt': attempt,
                'error': last_error,
            }
            print(json.dumps(output))
            return 1


if __name__ == '__main__':
    sys.exit(main())
