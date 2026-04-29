#services/logger_config.py

# Logger configuration for consistent logging across the application.

import logging


def setup_logger():
    """Sets up a logger with a specific format and level."""
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)  # Set default logging level to INFO

    # Create console handler with a higher log level
    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)

    # Create formatter and add it to the handlers
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    ch.setFormatter(formatter)

    # Add the handlers to the logger
    if not logger.hasHandlers():
        logger.addHandler(ch)

setup_logger()

