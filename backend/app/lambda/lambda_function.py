"""
CloudBurst AWS Lambda Function
S3 Event-Driven Serverless Parallel File Processor

Architecture:
  S3 Input Bucket (Put Event) -> Lambda Handler -> Stream Processing -> S3 Output Bucket

Deployment:
  1. Zip this file alongside any pure Python dependencies.
  2. Deploy to AWS Lambda with Python 3.11/3.12/3.14 runtime.
  3. Grant Lambda execution role: s3:GetObject on Input Bucket and s3:PutObject on Output Bucket.
  4. Configure S3 Event Notification on Input Bucket: Event type "All object create events".
"""

import os
import json
import boto3
import hashlib
import urllib.parse
import time
import tempfile
from typing import Dict, Any

s3_client = boto3.client("s3")

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda entry point for S3 ObjectCreated events.
    """
    start_time = time.perf_counter()
    print(f"CloudBurst Lambda invoked. Event: {json.dumps(event)}")
    
    # Target output bucket (can be overridden via Lambda environment variable)
    output_bucket = os.environ.get("AWS_S3_OUTPUT_BUCKET", "cloudburst-output-bucket-demo")
    
    try:
        # Extract record information
        records = event.get("Records", [])
        if not records:
            return {"statusCode": 400, "body": json.dumps({"error": "No S3 Records found in event"})}
            
        processed_items = []
        for record in records:
            input_bucket = record["s3"]["bucket"]["name"]
            key = urllib.parse.unquote_plus(record["s3"]["object"]["key"], encoding="utf-8")
            file_size = record["s3"]["object"].get("size", 0)
            
            print(f"Processing object s3://{input_bucket}/{key} ({file_size} bytes)")
            
            # Download file to temp directory
            local_tmp_path = os.path.join(tempfile.gettempdir(), f"lambda_{os.path.basename(key)}")
            s3_client.download_file(input_bucket, key, local_tmp_path)
            
            # Compute SHA-256
            sha256 = hashlib.sha256()
            with open(local_tmp_path, "rb") as f:
                while chunk := f.read(65536):
                    sha256.update(chunk)
            digest = sha256.hexdigest()
            
            # Basic text / binary analysis
            line_count = 0
            word_count = 0
            char_count = 0
            try:
                with open(local_tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line in f:
                        line_count += 1
                        char_count += len(line)
                        word_count += len(line.strip().split())
            except Exception as e:
                print(f"Non-text file processing fallback: {e}")
                
            end_time = time.perf_counter()
            duration_ms = round((end_time - start_time) * 1000, 2)
            
            # Result payload
            result_payload = {
                "source_bucket": input_bucket,
                "source_key": key,
                "destination_bucket": output_bucket,
                "file_size_bytes": file_size,
                "sha256_hash": digest,
                "processing_time_ms": duration_ms,
                "processor_engine": "AWS Lambda (Serverless)",
                "metrics": {
                    "line_count": line_count,
                    "word_count": word_count,
                    "char_count": char_count
                },
                "processed_at": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime())
            }
            
            # Upload processed result to output bucket
            result_key = f"results/{key}_result.json"
            s3_client.put_object(
                Bucket=output_bucket,
                Key=result_key,
                Body=json.dumps(result_payload, indent=2),
                ContentType="application/json"
            )
            print(f"Successfully uploaded result to s3://{output_bucket}/{result_key}")
            processed_items.append(result_payload)
            
            # Clean up /tmp
            if os.path.exists(local_tmp_path):
                os.remove(local_tmp_path)
                
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": f"Successfully processed {len(processed_items)} items",
                "results": processed_items
            })
        }
        
    except Exception as e:
        print(f"Lambda execution error: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
