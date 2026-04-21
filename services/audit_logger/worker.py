"""Celery worker for async storage."""
from celery import Celery
celery_app = Celery()
