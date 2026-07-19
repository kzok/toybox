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
	@echo "Makefile as a task runner used for local development and CI."
	@echo ""
	@echo "Targets:"
	@grep -E '^\.PHONY: [a-zA-Z_/-]+ ##' $(MAKEFILE_LIST) |\
		sed -r "s/\.PHONY: //" |\
		awk 'BEGIN {FS = " ## "}; {printf "  \033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: check ## do precommit check (type-check, test and lint)
check: node_modules
	npm run fmt
	npm run type-check
	npm run test -- --changed --run

.PHONY: dev-ss-edit ## start dev server of ss-edit
dev-ss-edit: node_modules
	npm run -w app/ss-edit dev

.PHONY: build ## build static files for GitHub pages
build: node_modules
	rm -fr ./dist && mkdir -p ./dist
	npm run -w app/ss-edit build
	mv ./app/ss-edit/dist ./dist/ss-edit
