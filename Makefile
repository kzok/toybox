SHELL:=/usr/bin/env bash
.DEFAULT_GOAL:=help

################################################################################
# DEPS
################################################################################

node_modules: package-lock.json
	npm ci
	touch -m node_modules

################################################################################
# TASKS
################################################################################

.PHONY: help ## display this help message
help:
	@echo "Makefile as a task runner for local development."
	@echo ""
	@echo "Targets:"
	@grep -E '^\.PHONY: [a-zA-Z_/-]+ ##' $(MAKEFILE_LIST) |\
		sed -r "s/\.PHONY: //" |\
		awk 'BEGIN {FS = " ## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: precommit ## do precommit check (type-check, test and lint)
precommit: node_modules
	npm run type-check
	npm run test -- --changed --run
	npm run fmt

.PHONY: dev/screencap-deco ## start dev server of screencap-deco
dev/screencap-deco: node_modules
	npm run -w @~/screencap-deco dev

.PHONY: build ## build static files for GitHub pages
build: node_modules
	rm -fr ./dist && mkdir -p ./dist
	npm run -w @~/screencap-deco build
	mv ./app/screencap-deco/dist ./dist/screencap-deco
