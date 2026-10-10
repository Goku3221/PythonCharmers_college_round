.PHONY: help dev seed demo test clean

help:
	@echo "AgentBreak — Commands:"
	@echo "  make dev      - Start FastAPI backend and Next.js frontend"
	@echo "  make seed     - Seed SQLite database from seeds/ and fixtures/"
	@echo "  make demo     - Launch warm-start demo configuration"
	@echo "  make test     - Run pytest across test suite"
	@echo "  make clean    - Clean caches and temporary runtime data"

dev:
	@echo "Starting development servers..."

seed:
	@echo "Seeding database..."

demo:
	@echo "Launching demo..."

test:
	@echo "Running tests..."

clean:
	@echo "Cleaning temporary files..."
