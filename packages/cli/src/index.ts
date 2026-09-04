#!/usr/bin/env node
/**
 * The validator, as a command.
 *
 * Argument parsing is `node:util.parseArgs` rather than a dependency: two commands and
 * two flags do not earn one.
 */
import { readFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import {
  fromA2AMetadata,
  fromCredentialSubject,
  fromDsse,
  fromMcpExtension,
  noInfluence,
  validateInfluence,
  type Extracted,
  type InfluenceSection,
} from 'influence-disclosure'

const USAGE = `influence — validate a paid-influence disclosure section

  influence validate <file>   validate a section, or find one inside a host document
  influence example           print a valid section to start from

  --json                      machine-readable output
  --quiet                     suppress warnings (schema errors still print)

Host documents understood: W3C Verifiable Credential, DSSE envelope,
A2A task or message metadata, MCP audit record.

Exit codes: 0 valid, 1 invalid, 2 could not read input.`

type Source = 'bare section' | 'verifiable credential' | 'DSSE envelope' | 'A2A metadata' | 'MCP audit record'

/** Try the section itself first, then each host format. Report where it was found. */
function locate(document: unknown): { source: Source; result: Extracted } {
  const direct = validateInfluence(document)
  if (direct.valid) {
    return { source: 'bare section', result: { present: true, valid: true, section: document as InfluenceSection } }
  }

  const hosts: [Source, (d: unknown) => Extracted][] = [
    ['verifiable credential', fromCredentialSubject],
    ['DSSE envelope', fromDsse],
    ['A2A metadata', fromA2AMetadata],
    ['MCP audit record', fromMcpExtension],
  ]
  for (const [source, read] of hosts) {
    const result = read(document)
    if (result.present) return { source, result }
  }

  // Nothing recognised it. The most useful report is why the document failed as a
  // section, not "no section found", which would hide a typo in a section the user
  // clearly meant to write.
  return {
    source: 'bare section',
    result: { present: true, valid: false, errors: direct.errors },
  }
}

function main(argv: string[]): number {
  let parsed
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: { json: { type: 'boolean' }, quiet: { type: 'boolean' }, help: { type: 'boolean', short: 'h' } },
    })
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n\n${USAGE}\n`)
    return 2
  }

  const { values, positionals } = parsed
  const [command, file] = positionals

  if (values.help === true || command === undefined) {
    process.stdout.write(`${USAGE}\n`)
    return command === undefined && values.help !== true ? 2 : 0
  }

  if (command === 'example') {
    process.stdout.write(`${JSON.stringify(noInfluence(), null, 2)}\n`)
    return 0
  }

  if (command !== 'validate') {
    process.stderr.write(`unknown command "${command}"\n\n${USAGE}\n`)
    return 2
  }

  if (file === undefined) {
    process.stderr.write(`validate needs a file\n\n${USAGE}\n`)
    return 2
  }

  let document: unknown
  try {
    document = JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    process.stderr.write(`cannot read ${file}: ${(error as Error).message}\n`)
    return 2
  }

  const { source, result } = locate(document)
  const warnings = result.present && result.valid ? validateInfluence(result.section).warnings : []

  if (values.json === true) {
    const payload = result.present && result.valid
      ? { valid: true, source, warnings }
      : { valid: false, source, errors: result.present ? result.errors : [] }
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`)
    return payload.valid ? 0 : 1
  }

  if (!result.present || !result.valid) {
    const errors = result.present ? result.errors : []
    process.stdout.write(`invalid — ${errors.length} problem${errors.length === 1 ? '' : 's'} (read as ${source})\n`)
    for (const e of errors) process.stdout.write(`  ${e.path === '' ? '/' : e.path}  ${e.message}\n`)
    return 1
  }

  process.stdout.write(`valid — found in ${source}\n`)
  const { section } = result
  const affecting = section.relationships.filter((r) => r.effect.kind !== 'none')
  process.stdout.write(
    section.relationships.length === 0
      ? `  declares no paid relationship bore on this decision (completeness: ${section.completeness})\n`
      : `  ${section.relationships.length} relationship(s), ${affecting.length} affected the outcome (completeness: ${section.completeness})\n`,
  )
  if (section.completeness === 'partial') {
    process.stdout.write(`  partial disclosure: ${String(section.withheld_reason)}\n`)
  }
  if (values.quiet !== true) {
    for (const w of warnings) process.stdout.write(`  warning  ${w.path === '' ? '/' : w.path}  ${w.message}\n`)
  }
  return 0
}

process.exitCode = main(process.argv.slice(2))
