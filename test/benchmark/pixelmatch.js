/* eslint-disable no-console, no-use-before-define */

import rimraf from 'rimraf'
import fs from 'fs'
import Benchmark from 'benchmark'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

// Clean up actual-files
rimraf.sync(`${__dirname}/../actual-files`)

const suite = new Benchmark.Suite()

suite
  .add('pixelmatch diff', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      const img1 = fs
        .createReadStream(`${__dirname}/base.png`)
        .pipe(new PNG())
        .on('parsed', doneReading)
      const img2 = fs
        .createReadStream(`${__dirname}/compare.png`)
        .pipe(new PNG())
        .on('parsed', doneReading)
      let filesRead = 0

      function doneReading() {
        filesRead += 1
        if (filesRead < 2) {
          return
        }

        const diff = new PNG({ width: img1.width, height: img1.height })
        const difference = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
          threshold: 0.01,
          includeAA: true,
        })

        if (difference) {
          diff.pack().pipe(fs.createWriteStream('diff.png')).on('finish', () => {
            deferred.resolve(difference)
          })
        } else {
          deferred.resolve(difference)
        }
      }
    },
  })
  .add('pixelmatch same', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      const img1 = fs
        .createReadStream(`${__dirname}/base.png`)
        .pipe(new PNG())
        .on('parsed', doneReading)
      const img2 = fs
        .createReadStream(`${__dirname}/base.png`)
        .pipe(new PNG())
        .on('parsed', doneReading)
      let filesRead = 0

      function doneReading() {
        filesRead += 1
        if (filesRead < 2) {
          return
        }

        const diff = new PNG({ width: img1.width, height: img1.height })
        const difference = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
          threshold: 0.01,
          includeAA: true,
        })

        if (difference) {
          diff.pack().pipe(fs.createWriteStream('diff.png')).on('finish', () => {
            deferred.resolve(difference)
          })
        } else {
          deferred.resolve(difference)
        }
      }
    },
  })
  .on('cycle', event => {
    console.log(String(event.target))
  })
  .run({ async: true })
