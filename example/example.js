/* eslint-disable no-console */

import imageDiff from '../src/imageDifference'

imageDiff(
  {
    actualImage: `${__dirname}/images/hello-world.png`,
    expectedImage: `${__dirname}/images/hello.png`,
    diffImage: `${__dirname}/images/hello-diff.png`,
  },
  console.log
)
