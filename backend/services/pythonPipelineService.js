const { execFile } = require('child_process');
const path = require('path');

const PYTHON_EXECUTABLE = process.env.PYTHON_EXECUTABLE || 'python3';
const SCRIPT_PATH = path.resolve(__dirname, '../orchestrator/pipeline_router.py');

function executePipeline(payload, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const processEnv = { ...process.env };
    const child = execFile(PYTHON_EXECUTABLE, [SCRIPT_PATH], {
      cwd: path.resolve(__dirname, '..'),
      env: processEnv,
      timeout,
      maxBuffer: 20 * 1024 * 1024,
    }, (error, stdout, stderr) => {
      if (stderr) {
        console.error('[PYTHON PIPELINE]', stderr.trim());
      }

      if (error) {
        const message = stderr ? stderr.trim() : error.message;
        return reject(new Error(`Python pipeline execution failed: ${message}`));
      }

      if (!stdout || !stdout.trim()) {
        return reject(new Error('Python pipeline returned no output.'));
      }

      try {
        const parsed = JSON.parse(stdout.trim());
        return resolve(parsed);
      } catch (parseError) {
        return reject(new Error(`Unable to parse pipeline JSON output: ${parseError.message}`));
      }
    });

    child.stdin.write(JSON.stringify(payload));
    child.stdin.end();
  });
}

module.exports = { executePipeline };
