from flask import request

from log import logger


def log_request():
    logger.info("%s %s", request.method, request.path)


def log_response(response):
    logger.info("%s %s %s", request.method, request.path, response.status_code)
    return response
