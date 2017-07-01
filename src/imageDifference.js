import fs from 'fs'
import path from 'path'
import gm from 'gm'
import spawn from 'cross-spawn'
import mkdirp from 'mkdirp'
import tmp from 'tmp'

const gmMagick = gm.subClass({ imageMagick: true })

function transparent(filename, options) {
  if (!options.width || !options.height) {
    throw new Error('Wrong options provided to transparent()')
  }

  const gmImage = gmMagick(filename)
  gmImage.background('transparent') // Fill in new space with white background
  gmImage.gravity('NorthWest') // Anchor image to upper-left
  gmImage.extent(options.width, options.height) // Specify new image size

  return gmImage
}

function getImageSize(filename) {
  return new Promise((accept, reject) => {
    fs.stat(filename, err => {
      if (err) {
        reject(err)
        return
      }
      gmMagick(filename).size((err2, value) => {
        if (err2) {
          reject(err2)
          return
        }
        accept(value)
      })
    })
  })
}

export function extractDifference(raw) {
  // Find variant between 'all: 0 (0)', 'all: 40131.8 (0.612372)', or 'all: 0.460961 (7.03381e-06)'
  // According to http://www.imagemagick.org/discourse-server/viewtopic.php?f=1&t=17284
  // These values are the total square root mean square (RMSE) pixel difference
  // across all pixels and its percentage
  const resultInfo = raw.match(
    /all: (\d+(?:\.\d+)?(?:[Ee]-?\d+)?) \((\d+(?:\.\d+)?(?:[Ee]-?\d+)?)\)/
  )

  if (!resultInfo) {
    throw new Error(`Expected raw to contain 'all' but received "${raw}"`)
  }

  return {
    total: parseFloat(resultInfo[1], 10),
    percentage: parseFloat(resultInfo[2], 10),
  }
}

function resizeImage(filename, options) {
  if (!options.width || !options.height) {
    throw new Error('Wrong options provided to resizeImage()')
  }

  return new Promise((accept, reject) => {
    // Get a temporary filepath
    tmp.tmpName({ postfix: '.png' }, (err, tmpFilename) => {
      // If there was an error, callback
      if (err) {
        reject(err)
        return
      }

      transparent(filename, {
        width: options.width,
        height: options.height,
      }).write(tmpFilename, err2 => {
        if (err2) {
          reject(err2)
          return
        }

        accept(tmpFilename)
      })
    })
  })
}

function createDifference(options) {
  const { shadow, actualFilename, expectedFilename, diffFilename } = options

  if (!actualFilename || !expectedFilename) {
    throw new Error('Wrong options provided to createDifference()')
  }

  const diffArgs = [
    '-verbose',
    '-metric', // http://www.imagemagick.org/script/command-line-options.php#metric
    'MSE',
    '-highlight-color',
    'RED',
  ]
    // Shadow options if options.shadow is set
    .concat(shadow ? [] : ['-compose', 'Src'])
    // Paths to actual, expected, and diff images
    .concat([
      actualFilename,
      expectedFilename,
      // If there is no output image, then output to `stdout` (which is ignored)
      diffFilename || '-',
    ])

  return new Promise((accept, reject) => {
    // https://github.com/aheckmann/gm/blob/master/lib/compare.js
    //
    // http://www.graphicsmagick.org/GraphicsMagick.html
    // gm.compare(
    //
    // http://www.imagemagick.org/script/compare.php
    // gmMagick().compare(
    //   actualFilename,
    //   expectedFilename,
    //   {
    //     tolerance: 0.4,
    //     // highlightColor: 'RED',
    //     // highlightStyle: 'Assign',
    //     file: diffFilename,
    //   },
    //   (err, Boolean, equality, rawOutput) => {
    //     if (err) {
    //       reject(err)
    //       return
    //     }

    //     accept({
    //       percentage: equality,
    //     })
    //   }
    // )

    const proc = spawn('compare', diffArgs)
    let stdout = ''
    let stderr = ''
    proc.stdout.on('data', data => {
      stdout += data
    })
    proc.stderr.on('data', data => {
      stderr += data
    })
    proc.on('close', code => {
      const isImageMagick = true
      // ImageMagick returns err code 2 if err, 0 if similar, 1 if dissimilar
      if (isImageMagick) {
        if (code === 0 || code === 1) {
          stdout = stderr
        } else {
          reject(stderr)
          return
        }
      } else if (code !== 0) {
        reject(stderr)
        return
      }
      accept(stdout)
    })
  })
}

export async function rawDifference(options) {
  const { actualFilename, expectedFilename, diffFilename, shadow } = options

  // Assert our options are passed in
  if (!actualFilename) {
    throw new Error('`options.actualFilename` was not passed to `image-difference`')
  }

  if (!expectedFilename) {
    throw new Error('`options.expectedFilename` was not passed to `image-difference`')
  }

  await Promise.all(
    [actualFilename, expectedFilename].map(
      filename =>
        new Promise((accept, reject) => {
          fs.exists(filename, actualExists => {
            if (actualExists) {
              accept()
              return
            }

            reject(
              new Error(
                `\`image-difference\` expected "${filename}" filename to exist but it didn't`
              )
            )
          })
        })
    )
  )

  const sizes = await Promise.all([getImageSize(actualFilename), getImageSize(expectedFilename)])

  // Find the maximum dimensions
  const actualSize = sizes[0]
  const expectedSize = sizes[1]
  const maxWidth = Math.max(actualSize.width, expectedSize.width)
  const maxHeight = Math.max(actualSize.height, expectedSize.height)

  let actualTmpFilename
  let expectedTmpFilename

  if (actualSize.width !== maxWidth || actualSize.height !== maxHeight) {
    actualTmpFilename = await resizeImage(actualFilename, {
      width: maxWidth,
      height: maxHeight,
    })
  }

  if (expectedSize.width !== maxWidth || expectedSize.height !== maxHeight) {
    expectedTmpFilename = await resizeImage(expectedFilename, {
      width: maxWidth,
      height: maxHeight,
    })
  }

  if (diffFilename) {
    await new Promise((accept, reject) => {
      mkdirp(path.dirname(diffFilename), err => {
        if (err) {
          reject(err)
          return
        }

        accept()
      })
    })
  }

  const raw = await createDifference({
    actualFilename: actualTmpFilename || actualFilename,
    expectedFilename: expectedTmpFilename || expectedFilename,
    diffFilename,
    shadow,
  })

  // Clean up the temporary files
  await Promise.all(
    [actualTmpFilename, expectedTmpFilename].filter(filename => filename).map(
      filename =>
        new Promise((accept, reject) => {
          fs.unlink(filename, err => {
            if (err) {
              reject(err)
              return
            }

            accept()
          })
        })
    )
  )

  return raw
}

export default async function imageDifference(options) {
  const raw = await rawDifference(options)
  return extractDifference(raw)
}
