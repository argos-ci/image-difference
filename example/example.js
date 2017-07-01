/* eslint-disable no-console */

import imageDifference from '../src/imageDifference'

imageDifference(
  {
    actualFilename: `${__dirname}/images/hello-world.png`,
    expectedFilename: `${__dirname}/images/hello.png`,
    diffFilename: `${__dirname}/images/hello-diff.png`,
  },
  console.log
)
