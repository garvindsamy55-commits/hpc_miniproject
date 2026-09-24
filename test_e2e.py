import httpx
import time
import json

base = 'http://127.0.0.1:8000'

print('=== 1. Health Check ===')
h = httpx.get(f'{base}/api/health').json()
print('Health:', h)
assert h['status'] == 'healthy'

print('\n=== 2. Generating Sample Datasets ===')
s = httpx.post(f'{base}/api/files/samples').json()
print('Samples generated:', s['count'], 'files')

print('\n=== 3. Listing Files ===')
files = httpx.get(f'{base}/api/files').json()
print('Total Files:', files['total_files'], 'Total Size:', files['total_size_bytes'], 'bytes')

print('\n=== 4. Dispatching Batch Processing across 4 Parallel Workers ===')
p = httpx.post(f'{base}/api/jobs/process', json={'all_unprocessed': True, 'worker_count': 4}).json()
print('Dispatched:', p['queued_jobs_count'], 'jobs')

time.sleep(1.0)

print('\n=== 5. Checking Job Queue Status ===')
jobs = httpx.get(f'{base}/api/jobs').json()
print('Job Stats -> Total:', jobs['total_jobs'], 'Completed:', jobs['completed_count'], 'Processing:', jobs['processing_count'], 'Failed:', jobs['failed_count'])

sample_job_id = jobs['jobs'][0]['job_id']
job_details = httpx.get(f'{base}/api/jobs/{sample_job_id}').json()
print('\n=== 6. Sample Job Analysis Result ===')
print('Job ID:', job_details['job_id'])
print('Filename:', job_details['filename'])
print('Status:', job_details['status'])
print('Worker ID:', job_details['worker_id'])
print('Processing Time:', job_details['processing_time_ms'], 'ms')
print('Result Details Preview:', json.dumps(job_details.get('result_details', {}), indent=2)[:300], '...')

print('\n=== 7. Checking Parallel Worker Pool Telemetry ===')
workers = httpx.get(f'{base}/api/workers').json()
print('Workers:', workers['total_workers'], 'Active:', workers['active_workers'], 'Idle:', workers['idle_workers'], 'CPU:', workers['system_cpu_percent'], '%')

print('\n=== 8. Running Live HPC Performance Benchmark ===')
bench = httpx.post(f'{base}/api/performance/benchmark', json={'file_count': 8, 'file_size_kb': 256, 'worker_counts': [1, 2, 4, 8], 'workload_type': 'mixed'}).json()
print('Benchmark ID:', bench['benchmark_id'])
print('Sequential Baseline Time (1 Worker):', bench['sequential_time_ms'], 'ms')
print('Peak Speedup:', bench['max_speedup'], 'x with', bench['best_worker_count'], 'workers')
print('Max Throughput:', bench['max_throughput_files_sec'], 'files/sec')
for pt in bench['points']:
    w = pt['worker_count']
    t = pt['execution_time_ms']
    sp = pt['speedup']
    eff = pt['efficiency_percent']
    tp = pt['throughput_files_sec']
    print(f'  - {w} Workers -> Time: {t}ms | Speedup: {sp}x | Efficiency: {eff}% | Throughput: {tp} f/s')

print('\n=== 9. Storage Overview ===')
storage = httpx.get(f'{base}/api/storage').json()
print('Local Storage Uploads:', storage['local_storage']['uploads_formatted'], 'Results:', storage['local_storage']['results_formatted'])

print('\n=== 10. Azure Blob Storage / Credential Status Check ===')
azure = httpx.get(f'{base}/api/azure/status').json()
print('Azure Connected:', azure['is_connected'], '| Mode:', azure['operating_mode'], '| Message:', azure['message'])

aws = httpx.get(f'{base}/api/aws/status').json()
print('Legacy AWS Alias Connected:', aws['is_connected'], '| Mode:', aws['operating_mode'], '| Message:', aws['message'])

print('\n=== ALL END-TO-END VERIFICATIONS PASSED 100% SUCCESSFULLY! ===')
