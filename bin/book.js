#!/usr/bin/env node
import { buildBook } from '../src/build.js'

const [command, directory = '.'] = process.argv.slice(2)
if (command !== 'build') {
  console.error('Usage: euiyun-book build [directory]')
  process.exit(2)
}
try {
  const result = await buildBook(directory)
  console.log(`Built ${result.pages} pages for ${result.domain} in ${result.output}`)
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
