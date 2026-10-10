"""
AnnaSetu AI — Structured Logging & Operational Alerting Module
Formats logs in structured JSON for cloud aggregators and provides alerting hooks.
"""

import os
import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """Formats log records as single-line JSON objects."""
    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "line": record.lineno,
        }
        if hasattr(record, "props"):
            log_entry.update(record.props)
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_telemetry() -> logging.Logger:
    """Configures root logger with structured JSON output and Sentry if configured."""
    logger = logging.getLogger("annasetu")
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers on reload
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JSONFormatter())
        logger.addHandler(handler)

    # Optional Sentry initialization
    sentry_dsn = os.getenv("SENTRY_DSN")
    if sentry_dsn:
        try:
            import sentry_sdk
            sentry_sdk.init(
                dsn=sentry_dsn,
                traces_sample_rate=0.2,
                profiles_sample_rate=0.1,
                environment=os.getenv("ENVIRONMENT", "production"),
            )
            logger.info("Sentry integration initialized successfully.")
        except ImportError:
            logger.warning("sentry-sdk not installed; skipping Sentry initialization.")

    return logger


logger = setup_telemetry()


def send_ops_alert(title: str, details: Dict[str, Any], severity: str = "WARNING") -> Dict[str, Any]:
    """
    Dispatch critical operational alerts (e.g. food safety violation, driver drop-out).
    Can integrate with Slack webhook, PagerDuty, or SMS gateway in production.
    """
    alert_payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "severity": severity,
        "title": title,
        "details": details,
        "service": "annasetu-backend",
    }
    logger.warning(f"OPERATIONAL_ALERT: {title}", extra={"props": alert_payload})
    return alert_payload
