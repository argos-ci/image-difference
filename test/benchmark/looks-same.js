/* eslint-disable no-console */

import rimraf from 'rimraf'
import Benchmark from 'benchmark'
import looksSame from 'looks-same'

// Clean up actual-files
rimraf.sync(`${__dirname}/../actual-files`)

const suite = new Benchmark.Suite()

suite
  .add('looksSame diff', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      looksSame(`${__dirname}/base.png`, `${__dirname}/compare.png`, (err, equal) => {
        if (err) {
          deferred.reject(err)
          return
        }

        deferred.resolve(equal)
      })
    },
  })
  .add('looksSame same', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      looksSame(`${__dirname}/base.png`, `${__dirname}/base.png`, (err, equal) => {
        if (err) {
          deferred.reject(err)
          return
        }

        deferred.resolve(equal)
      })
    },
  })
  .on('cycle', event => {
    console.log(String(event.target))
  })
  .run({ async: true })
