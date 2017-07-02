/* eslint-disable no-console */

import rimraf from 'rimraf'
import Benchmark from 'benchmark'
import imageDiff from 'image-diff'

// Clean up actual-files
rimraf.sync(`${__dirname}/../actual-files`)

const suite = new Benchmark.Suite()

suite
  .add('image-diff diff', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      imageDiff.getFullResult(
        {
          actualImage: `${__dirname}/base.png`,
          expectedImage: `${__dirname}/compare.png`,
          diffImage: `${__dirname}/../actual-files/different.png`,
        },
        (err, result) => {
          deferred.resolve(result)
        }
      )
    },
  })
  .add('image-diff same', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      imageDiff.getFullResult(
        {
          actualImage: `${__dirname}/base.png`,
          expectedImage: `${__dirname}/base.png`,
          diffImage: `${__dirname}/../actual-files/different.png`,
        },
        (err, result) => {
          deferred.resolve(result)
        }
      )
    },
  })
  .on('cycle', event => {
    console.log(String(event.target))
  })
  .run({ async: true })
