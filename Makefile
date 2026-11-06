# jkrumm.com — task entry points.
#
# Thin wrappers over what the repo already has (package.json scripts, the deploy
# workflow). No new behaviour lives here — see AGENTS.md § Validate · § Deploy ·
# § Verify & Monitor.

.DEFAULT_GOAL := help

.PHONY: help check deploy verify version logs diagrams

DIAGRAMS_SRC ?= $(HOME)/SourceRoot/dotfiles/docs/archive/diagrams

help: ## List available targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-8s\033[0m %s\n", $$1, $$2}'

check: ## Frozen install, oxfmt --check, oxlint --type-aware, astro check + build
	bun install --frozen-lockfile
	bun run format:check
	bun run lint
	bun run build

deploy: ## Deploy is CI-only; push to master triggers it
	@echo "deployed by CI on push"

verify: ## Probe production — exits 0 when jkrumm.com is live and healthy
	curl -fsS https://jkrumm.com/ >/dev/null

version: ## Print the deployed commit sha (read from the live footer's build-commit link)
	@sha=$$(curl -fsS https://jkrumm.com/ | grep -oE 'github\.com/jkrumm/jkrumm\.com/commit/[0-9a-f]{7,40}' | head -1 | grep -oE '[0-9a-f]+$$'); \
	test -n "$$sha" || { echo "no build commit found on https://jkrumm.com/" >&2; exit 1; }; \
	git rev-parse --verify --quiet "$$sha^{commit}" || echo "$$sha"

logs: ## Show the last 200 lines of production logs, then exit (no follow)
	ssh vps 'docker logs --tail 200 "$$(docker ps -qf label=com.docker.compose.service=jkrumm-com | head -1)"'

diagrams: ## Copy the agent-platform diagram from its dotfiles source into public/diagrams
	cp $(DIAGRAMS_SRC)/agent-platform.html public/diagrams/agent-platform.html
