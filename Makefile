# Local development helpers. Requires Docker; the Supabase CLI is installed via pnpm.
SUPABASE := pnpm exec supabase
SUPABASE_EXCLUDE := realtime,edge-runtime,logflare,vector,supavisor,imgproxy

.PHONY: help install up down logs db-start db-stop db-reset db-test types test lint e2e prod

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies on the host (needed for the Supabase CLI)
	pnpm install

up: db-start ## Start Supabase and the app (http://localhost:3000)
	docker compose up -d --build app
	@echo "\n  App:      http://localhost:3000\n  Studio:   http://localhost:54323\n  Mailpit:  http://localhost:54324\n"

down: ## Stop the app and Supabase
	docker compose down
	$(SUPABASE) stop

logs: ## Follow app logs
	docker compose logs -f app

db-start: ## Start the local Supabase stack (applies migrations + seed on first run)
	$(SUPABASE) start -x $(SUPABASE_EXCLUDE)

db-stop: ## Stop the local Supabase stack
	$(SUPABASE) stop

db-reset: ## Recreate the local database from migrations + seed
	$(SUPABASE) db reset

db-test: ## Run the RLS/security test suite (pgTAP)
	$(SUPABASE) test db

types: ## Regenerate TypeScript types from the local database schema
	$(SUPABASE) gen types typescript --local > src/infrastructure/supabase/database.types.ts

test: ## Unit tests
	pnpm test

lint: ## Lint + typecheck
	pnpm lint && pnpm typecheck

e2e: ## Playwright end-to-end tests against http://localhost:3000
	pnpm test:e2e

prod: db-start ## Build and run the production image on http://localhost:3001
	docker compose --profile prod up --build app-prod
