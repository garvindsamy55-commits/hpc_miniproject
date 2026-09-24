import os
import tempfile
import json
from app.services.processor import (
    compute_sha256,
    process_text_file,
    process_csv_file,
    process_json_file,
    process_file
)

def test_compute_sha256():
    with tempfile.NamedTemporaryFile("w+", delete=False) as f:
        f.write("CloudBurst SHA256 Test String")
        f_path = f.name
        
    try:
        digest = compute_sha256(f_path)
        assert len(digest) == 64
        assert isinstance(digest, str)
    finally:
        os.remove(f_path)

def test_process_text_file():
    with tempfile.NamedTemporaryFile("w+", suffix=".log", delete=False) as f:
        f.write("2026-09-24 INFO Worker initialized\n2026-09-24 ERROR Job timeout\n2026-09-24 WARN High memory\n")
        f_path = f.name
        
    try:
        res = process_text_file(f_path, ".log")
        assert res["line_count"] == 3
        assert res["word_count"] >= 9
        assert "log_event_counts" in res
        assert res["log_event_counts"]["error_count"] == 1
        assert res["log_event_counts"]["warn_count"] == 1
        assert res["log_event_counts"]["info_count"] == 1
    finally:
        os.remove(f_path)

def test_process_csv_file():
    with tempfile.NamedTemporaryFile("w+", suffix=".csv", delete=False) as f:
        f.write("id,value,score\n1,10.5,95\n2,20.5,85\n3,30.0,75\n")
        f_path = f.name
        
    try:
        res = process_csv_file(f_path)
        assert res["row_count"] == 3
        assert res["column_count"] == 3
        assert res["column_names"] == ["id", "value", "score"]
        assert len(res["columns_summary"]) == 3
        assert res["columns_summary"][1]["mean"] == 20.3333
    finally:
        os.remove(f_path)

def test_process_json_file():
    with tempfile.NamedTemporaryFile("w+", suffix=".json", delete=False) as f:
        json.dump({"cluster": "CloudBurst", "nodes": 4, "config": {"workers": 8, "region": "us-east-1"}}, f)
        f_path = f.name
        
    try:
        res = process_json_file(f_path)
        assert res["root_structure"] == "Object/Dictionary"
        assert res["max_nesting_depth"] >= 2
        assert "cluster" in res["top_level_keys"]
    finally:
        os.remove(f_path)
