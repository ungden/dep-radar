/**
 * Writes docs/QUY_DINH_TRONG_APP.md from lib/docs/rules-doc.ts.
 *
 *   npm run docs:rules   # after changing lib/conduct.ts, lib/pricing.ts or lib/connection.ts
 *
 * tests/rules-doc.test.ts fails while the committed file differs.
 */
import { writeFileSync } from "node:fs"
import { rulesDoc } from "../lib/docs/rules-doc"

const RULES_DOC_PATH = "docs/QUY_DINH_TRONG_APP.md"
writeFileSync(RULES_DOC_PATH, rulesDoc())
console.log(`Wrote ${RULES_DOC_PATH}`)
