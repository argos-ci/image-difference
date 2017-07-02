/* eslint-disable no-console, no-use-before-define */

import rimraf from 'rimraf'
import fs from 'fs'
import Benchmark from 'benchmark'
import resemble from 'resemblejs-node'

// Clean up actual-files
rimraf.sync(`${__dirname}/../actual-files`)

const suite = new Benchmark.Suite()

suite
  .add('resemble diff', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      const diff = resemble(`${__dirname}/base.png`).compareTo(`${__dirname}/compare.png`)
      diff.onComplete(diffResult => {
        if (diffResult.rawMisMatchPercentage > 0) {
          diffResult
            .getDiffImage()
            .pack()
            .pipe(fs.createWriteStream('diff.png'))
            .on('finish', () => {
              deferred.resolve()
            })
        } else {
          deferred.resolve()
        }
      })
    },
  })
  .add('resemble same', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      const diff = resemble(`${__dirname}/base.png`).compareTo(`${__dirname}/base.png`)
      diff.onComplete(diffResult => {
        if (diffResult.rawMisMatchPercentage > 0) {
          diffResult
            .getDiffImage()
            .pack()
            .pipe(fs.createWriteStream('diff.png'))
            .on('finish', () => {
              deferred.resolve()
            })
        } else {
          deferred.resolve()
        }
      })
    },
  })
  .on('cycle', event => {
    console.log(String(event.target))
  })
  .run({ async: true })
