#!/bin/zsh
# Claude Code PostToolUse hook: after an edit to a file the rules document is
# written from, rewrite docs/QUY_DINH_TRONG_APP.md (see scripts/gen-rules-doc.ts).
file=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).tool_input?.file_path??"")}catch{}})')
case "$file" in
  */lib/conduct.ts|*/lib/pricing.ts|*/lib/connection.ts|*/lib/catalog.ts|*/lib/docs/rules-doc.ts)
    cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" && npm run -s docs:rules >/dev/null && echo "docs/QUY_DINH_TRONG_APP.md đã được cập nhật theo $file" ;;
esac
exit 0
