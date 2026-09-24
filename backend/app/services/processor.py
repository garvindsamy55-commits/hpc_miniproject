import os
import json
import hashlib
import time
import math
import csv
import io
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger("cloudburst.processor")

def compute_sha256(filepath: str) -> str:
    """Calculates SHA-256 hash of a file efficiently."""
    sha = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(65536):
            sha.update(chunk)
    return sha.hexdigest()

def process_text_file(filepath: str, ext: str) -> Dict[str, Any]:
    """Extracts linguistic and structural metadata from text/log/md files."""
    line_count = 0
    word_count = 0
    char_count = 0
    word_freq: Dict[str, int] = {}
    sample_lines = []
    
    log_stats = {"info_count": 0, "warn_count": 0, "error_count": 0, "debug_count": 0}
    is_log = ext in [".log", ".txt"]
    
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f):
            line_count += 1
            char_count += len(line)
            words = line.strip().split()
            word_count += len(words)
            
            for w in words:
                cleaned = w.strip(".,;:\"'!?()[]{}<>").lower()
                if len(cleaned) > 2:
                    word_freq[cleaned] = word_freq.get(cleaned, 0) + 1
                    
            if is_log:
                upper = line.upper()
                if "ERROR" in upper or "FATAL" in upper or "CRITICAL" in upper:
                    log_stats["error_count"] += 1
                elif "WARN" in upper:
                    log_stats["warn_count"] += 1
                elif "INFO" in upper:
                    log_stats["info_count"] += 1
                elif "DEBUG" in upper:
                    log_stats["debug_count"] += 1
                    
            if idx < 5:
                sample_lines.append(line.strip()[:150])
                
    # Top 10 words
    top_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    
    result = {
        "file_category": "Text / Log Document",
        "line_count": line_count,
        "word_count": word_count,
        "character_count": char_count,
        "avg_words_per_line": round(word_count / max(1, line_count), 2),
        "top_keywords": [{"word": k, "frequency": v} for k, v in top_words],
        "preview_lines": sample_lines
    }
    
    if is_log and any(log_stats.values()):
        result["log_event_counts"] = log_stats
        
    return result

def process_csv_file(filepath: str) -> Dict[str, Any]:
    """Analyzes tabular data, column schemas, and numeric distributions in CSV files."""
    row_count = 0
    headers = []
    sample_rows = []
    numeric_stats: Dict[str, Dict[str, float]] = {}
    
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        try:
            headers = next(reader, [])
        except Exception:
            headers = []
            
        col_values: Dict[int, list] = {i: [] for i in range(len(headers))}
        
        for idx, row in enumerate(reader):
            row_count += 1
            if idx < 5:
                sample_rows.append(row[:10])
            for col_idx, val in enumerate(row):
                if col_idx < len(headers):
                    try:
                        num = float(val.strip())
                        col_values[col_idx].append(num)
                    except ValueError:
                        pass
                        
    # Compute column summary
    columns_summary = []
    for col_idx, h in enumerate(headers):
        vals = col_values.get(col_idx, [])
        col_info = {"column_name": h, "index": col_idx, "numeric": len(vals) > 0}
        if vals:
            col_info["min"] = min(vals)
            col_info["max"] = max(vals)
            col_info["mean"] = round(sum(vals) / len(vals), 4)
            col_info["numeric_rows"] = len(vals)
        columns_summary.append(col_info)
        
    return {
        "file_category": "Tabular Dataset (CSV)",
        "row_count": row_count,
        "column_count": len(headers),
        "column_names": headers,
        "columns_summary": columns_summary,
        "sample_preview": sample_rows
    }

def process_json_file(filepath: str) -> Dict[str, Any]:
    """Parses JSON content, measuring key complexity, depth, and object hierarchy."""
    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
        data = json.load(f)
        
    def analyze_structure(obj, depth=1) -> tuple:
        max_d = depth
        key_cnt = 0
        if isinstance(obj, dict):
            key_cnt += len(obj)
            for v in obj.values():
                d, k = analyze_structure(v, depth + 1)
                max_d = max(max_d, d)
                key_cnt += k
        elif isinstance(obj, list):
            key_cnt += len(obj)
            for item in obj[:100]:  # sample list items
                d, k = analyze_structure(item, depth + 1)
                max_d = max(max_d, d)
                key_cnt += k
        return max_d, key_cnt

    max_depth, total_keys = analyze_structure(data)
    
    root_type = "Object/Dictionary" if isinstance(data, dict) else ("Array/List" if isinstance(data, list) else "Scalar")
    top_keys = list(data.keys())[:15] if isinstance(data, dict) else []
    
    return {
        "file_category": "Structured Data (JSON)",
        "root_structure": root_type,
        "max_nesting_depth": max_depth,
        "total_nested_keys": total_keys,
        "top_level_keys": top_keys,
        "is_array_root": isinstance(data, list),
        "array_length": len(data) if isinstance(data, list) else None
    }

def process_image_file(filepath: str) -> Dict[str, Any]:
    """Extracts image properties, color depth, format, and dimensions using Pillow."""
    try:
        from PIL import Image
        with Image.open(filepath) as img:
            width, height = img.size
            format_name = img.format or "UNKNOWN"
            mode = img.mode
            megapixels = round((width * height) / 1_000_000, 2)
            aspect_ratio = f"{round(width / max(1, height), 2)}:1"
            
            # Basic dominant color analysis
            img_small = img.resize((32, 32)).convert("RGB")
            colors = img_small.getcolors(maxcolors=1024)
            dominant_rgb = [0, 0, 0]
            if colors:
                colors.sort(key=lambda x: x[0], reverse=True)
                dominant_rgb = list(colors[0][1])
                
            return {
                "file_category": "Raster Image",
                "width_px": width,
                "height_px": height,
                "megapixels": megapixels,
                "aspect_ratio": aspect_ratio,
                "color_mode": mode,
                "format": format_name,
                "dominant_color_rgb": dominant_rgb,
                "dominant_color_hex": f"#{dominant_rgb[0]:02x}{dominant_rgb[1]:02x}{dominant_rgb[2]:02x}"
            }
    except Exception as e:
        logger.warning(f"Pillow image processing error: {e}")
        return {
            "file_category": "Raster Image",
            "error": str(e),
            "note": "Basic image processing fallback applied"
        }

def process_pdf_file(filepath: str) -> Dict[str, Any]:
    """Extracts PDF metadata, page count, and encryption info."""
    try:
        from pypdf import PdfReader
        reader = PdfReader(filepath)
        page_count = len(reader.pages)
        is_encrypted = reader.is_encrypted
        
        meta = reader.metadata or {}
        extracted_meta = {
            "title": str(meta.get("/Title", "")),
            "author": str(meta.get("/Author", "")),
            "creator": str(meta.get("/Creator", "")),
            "producer": str(meta.get("/Producer", "")),
        }
        
        # Sample text length from first page
        first_page_text_len = 0
        if page_count > 0 and not is_encrypted:
            try:
                first_page_text_len = len(reader.pages[0].extract_text() or "")
            except Exception:
                pass
                
        return {
            "file_category": "PDF Document",
            "page_count": page_count,
            "is_encrypted": is_encrypted,
            "metadata": {k: v for k, v in extracted_meta.items() if v},
            "first_page_chars": first_page_text_len
        }
    except Exception as e:
        logger.warning(f"PDF processing error: {e}")
        return {
            "file_category": "PDF Document",
            "error": str(e),
            "note": "PDF parser fallback applied"
        }

def process_file(filepath: str, job_id: str, results_dir: str) -> Dict[str, Any]:
    """
    Main file processing entry point. Performs genuine file computation based on format,
    measures processing duration, computes cryptographic hash, and writes output artifact.
    """
    start_time = time.perf_counter()
    path_obj = Path(filepath)
    
    if not path_obj.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
        
    file_size = path_obj.stat().st_size
    sha256 = compute_sha256(filepath)
    ext = path_obj.suffix.lower()
    
    # Run format-specific processor
    metadata = {}
    if ext in [".txt", ".log", ".md", ".xml", ".html"]:
        metadata = process_text_file(filepath, ext)
    elif ext == ".csv":
        metadata = process_csv_file(filepath)
    elif ext == ".json":
        metadata = process_json_file(filepath)
    elif ext in [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"]:
        metadata = process_image_file(filepath)
    elif ext == ".pdf":
        metadata = process_pdf_file(filepath)
    else:
        # Fallback for other formats
        metadata = {
            "file_category": "Binary / Other",
            "extension": ext,
            "byte_count": file_size
        }
        
    end_time = time.perf_counter()
    processing_duration_ms = round((end_time - start_time) * 1000, 2)
    
    # Standardized result package
    result_package = {
        "job_id": job_id,
        "filename": path_obj.name,
        "file_extension": ext,
        "file_size_bytes": file_size,
        "file_size_formatted": f"{round(file_size / 1024, 2)} KB" if file_size < 1048576 else f"{round(file_size / 1048576, 2)} MB",
        "sha256_hash": sha256,
        "processing_time_ms": processing_duration_ms,
        "computed_metadata": metadata,
        "timestamp_utc": time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime())
    }
    
    # Save output artifact to results folder
    result_filename = f"{job_id}_result.json"
    result_filepath = os.path.join(results_dir, result_filename)
    with open(result_filepath, "w", encoding="utf-8") as f:
        json.dump(result_package, f, indent=2)
        
    result_package["result_filepath"] = result_filepath
    return result_package
