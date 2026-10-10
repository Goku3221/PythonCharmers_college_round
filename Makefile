.PHONY: help dev seed demo test clean test-api test-engine build-web

PYTHON := .\.venv\Scripts\python.exe

help:
	@echo "AgentBreak — Available Commands:"
	@echo "  make dev         - Start FastAPI backend (port 8000) and Next.js frontend (port 3000)"
	@echo "  make test        - Run all pytest test suites (engine + api)"
	@echo "  make test-engine - Run engine integration tests"
	@echo "  make test-api    - Run FastAPI endpoint tests"
	@echo "  make build-web   - Build production Next.js frontend bundle"

dev-api:
	$(PYTHON) -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

dev-web:
	cd web && npm run dev

test:
	$(PYTHON) -m pytest tests -v

test-engine:
	$(PYTHON) -m pytest tests/engine -v

test-api:
	$(PYTHON) -m pytest tests/api -v

build-web:
	cd web && npm run build
