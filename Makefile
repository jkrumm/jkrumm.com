# jkrumm.com — task entry points.
#
# Thin wrappers over what the repo already has (package.json scripts, the deploy
# workflow). No new behaviour lives here — see AGENTS.md § Validate · § Deploy ·
# § Verify & Monitor.

.DEFAULT_GOAL := help

.PHONY: help check deploy verify logs

help: ## List available targets
	@grep -hE '^[a-zA-Z_-]+:.*## ' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*## "}; {printf "  \033[36m%-8s\033[0m %s\n", $$1, $$2}'

check: ## Run the same validation CI runs (astro check + astro build)
	bun run build

deploy: ## Deploy is CI-only; push to master triggers it
	@echo "deployed by CI on push"

verify: ## Probe production — exits 0 when jkrumm.com is live and healthy
	curl -fsS https://jkrumm.com/ >/dev/null

logs: ## Show the last 200 lines of production logs, then exit (no follow)
	ssh vps 'docker logs --tail 200 "$$(docker ps -qf label=com.docker.compose.service=jkrumm-com | head -1)"'
