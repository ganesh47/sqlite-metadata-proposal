class CLIError(Exception):
    """Base error for CLI failures."""


class DatasetValidationError(CLIError):
    """Raised when a dataset payload is invalid."""


class IngestionError(CLIError):
    """Raised when ingestion fails while calling the API."""
