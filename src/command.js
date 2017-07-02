/* eslint-disable no-console */

import program from 'commander'
import chalk from 'chalk'
import pkg from '../package.json'
import imageDifference from './imageDifference'
import { displayError, displaySuccess } from './display'

program
  .version(pkg.version)
  .description('Create image differential between two images')
  .usage('[options] <actual-filename> <expected-filename> [diff-filename]')
  .action(async (actualFilename, expectedFilename, diffFilenameArgs, command) => {
    let options = command
    let diffFilename = diffFilenameArgs

    // If there is no program, then assume diffFilename was left out
    if (command === undefined) {
      options = diffFilenameArgs
      diffFilename = undefined
    }

    let difference

    try {
      difference = await imageDifference({
        actualFilename,
        diffFilename,
        expectedFilename,
        ...options,
      })
    } catch (error) {
      displayError('Sorry an error happened:')

      console.error(chalk.bold.red(error.stack))
      process.exit(1)
    }

    if (difference.total === 0) {
      displaySuccess('No difference')
    } else {
      displayError(
        `A difference was detected (total: ${difference.total}, percentage: ${difference.percentage})`
      )
      process.exit(1)
    }
  })

if (!process.argv.slice(3).length) {
  program.outputHelp()
} else {
  program.parse(process.argv)
}
