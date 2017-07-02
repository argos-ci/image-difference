/* eslint-disable no-console */

import rimraf from 'rimraf'
import Benchmark from 'benchmark'
import imageDifference from '../../src/imageDifference'

// Clean up actual-files
rimraf.sync(`${__dirname}/../actual-files`)

const suite = new Benchmark.Suite()

suite
  .add('image-difference graphicsmagick diff', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      imageDifference({
        actualFilename: `${__dirname}/base.png`,
        expectedFilename: `${__dirname}/compare.png`,
        diffFilename: `${__dirname}/../actual-files/different.png`,
        implementation: 'graphicsmagick',
      }).then(different => {
        deferred.resolve(different)
      })
    },
  })
  .add('image-difference graphicsmagick same', {
    minSamples: 20,
    defer: true,
    fn: deferred => {
      imageDifference({
        actualFilename: `${__dirname}/base.png`,
        expectedFilename: `${__dirname}/base.png`,
        diffFilename: `${__dirname}/../actual-files/different.png`,
        implementation: 'graphicsmagick',
      }).then(different => {
        deferred.resolve(different)
      })
    },
  })
  .on('cycle', event => {
    console.log(String(event.target))
  })
  .run({ async: true })
