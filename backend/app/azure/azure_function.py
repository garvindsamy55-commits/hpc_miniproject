"""
CloudBurst Azure Function
Blob Storage Event-Driven Serverless Parallel File Processor

Architecture:
  Azure Blob Storage (Input Container) → Event Grid Trigger → Azure Function Handler → Azure Blob Storage (Output Container)

Deployment:
  1. Install the Azure Functions Core Tools and create a Python Function App.
  2. Deploy this file as the function entry-point with a Blob trigger binding.
  3. Grant the Function's Managed Identity "Storage Blob Data Contributor" on the storage account.
  4. Configure the blob trigger pattern on the input container (e.g., "cloudburst-input-container/{name}").
"""

import os
import json
import hashlib
import time
import tempfile
from typing import Any


def function_handler(input_stream: Any, blob_name: str, output_container_client: Any) -> dict:
    """
    Azure Functions entry point for Blob Storage trigger events.
    Compatible with azure-functions Python worker v2.

    Parameters:
        input_stream      – InputStream provided by the Blob trigger binding.
        blob_name         – Name of the blob that triggered the function.
        output_container_client – Azure BlobContainerClient for the output container.
    """
    start_time = time.perf_counter()
    print(f"CloudBurst Azure Function invoked. Blob: {blob_name}")

    output_container = os.environ.get(
        "AZURE_BLOB_OUTPUT_CONTAINER", "cloudburst-output-container"
    )

    try:
        # Read blob content
        content = input_stream.read()
        file_size = len(content)

        # Write to a temp file for processing
        local_tmp_path = os.path.join(
            tempfile.gettempdir(), f"func_{os.path.basename(blob_name)}"
        )
        with open(local_tmp_path, "wb") as f:
            f.write(content)

        # Compute SHA-256
        sha256 = hashlib.sha256(content).hexdigest()

        # Basic text / binary analysis
        line_count = word_count = char_count = 0
        try:
            text = content.decode("utf-8", errors="ignore")
            for line in text.splitlines():
                line_count += 1
                char_count += len(line)
                word_count += len(line.strip().split())
        except Exception as e:
            print(f"Non-text file processing fallback: {e}")

        end_time = time.perf_counter()
        duration_ms = round((end_time - start_time) * 1000, 2)

        result_payload = {
            "source_container": "cloudburst-input-container",
            "source_blob": blob_name,
            "destination_container": output_container,
            "file_size_bytes": file_size,
            "sha256_hash": sha256,
            "processing_time_ms": duration_ms,
            "processor_engine": "Azure Functions (Serverless)",
            "metrics": {
                "line_count": line_count,
                "word_count": word_count,
                "char_count": char_count,
            },
            "processed_at": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime()),
        }

        # Upload result to output container
        result_blob_name = f"results/{blob_name}_result.json"
        result_bytes = json.dumps(result_payload, indent=2).encode("utf-8")

        if output_container_client is not None:
            output_container_client.upload_blob(
                name=result_blob_name,
                data=result_bytes,
                overwrite=True,
                content_settings=None,
            )
            print(
                f"Successfully uploaded result to {output_container}/{result_blob_name}"
            )

        # Clean up /tmp
        if os.path.exists(local_tmp_path):
            os.remove(local_tmp_path)

        return {
            "statusCode": 200,
            "body": json.dumps(
                {
                    "message": "Successfully processed 1 blob",
                    "results": [result_payload],
                }
            ),
        }

    except Exception as e:
        print(f"Azure Function execution error: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }
