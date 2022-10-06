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

export function handleRaw(difference, options) {
  const { raw, ...other } = difference

  // Only process once
  if (typeof raw === 'number') {
    return difference
  }

  let resultInfo

  switch (options.metric) {
    case 'PAE':
    case 'MSE':
    case 'RMSE':
    case 'MAE':
      // Find variant between 'all: 0 (0)', 'all: 40131.8 (0.612372)', or 'all: 0.460961 (7.03381e-06)'
      // According to http://www.imagemagick.org/discourse-server/viewtopic.php?f=1&t=17284
      // These values are the total root mean square (MSE) pixel difference
      // across all pixels and its percentage
      resultInfo = raw.match(/all: (\d+(?:\.\d+)?(?:[Ee]-?\d+)?) \((\d+(?:\.\d+)?(?:[Ee]-?\d+)?)\)/)
      if (!resultInfo) {
        throw new Error(`Expected raw to contain 'all' but received "${raw}"`)
      }

      return {
        ...other,
        value1: parseFloat(resultInfo[1], 10),
        value2: parseFloat(resultInfo[2], 10),
      }

    case 'PHASH':
    case 'PSNR':
    case 'AE':
    case 'NCC':
    case 'FUZZ':
      resultInfo = raw.match(/all: (.+)\n/)
      if (!resultInfo) {
        throw new Error(`Expected raw to contain 'all' but received "${raw}"`)
      }
      return {
        ...other,
        value: parseFloat(resultInfo[1], 10),
      }

    default:
      throw new Error('Unknown metric')
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
  const {
    actualFilename,
    expectedFilename,
    diffFilename,
    implementation,
    metric,
    highlightColor,
    lowlightColor,
    fuzz,
  } = options

  const diffArgs = [
    '-verbose',
    '-highlight-color',
    highlightColor,
    '-lowlight-color',
    lowlightColor,
    // http://legacy.imagemagick.org/script/command-line-options.php#metric
    // http://www.imagemagick.org/Usage/compare/
    // https://github.com/ImageMagick/ImageMagick/blob/master/MagickCore/compare.c
    '-metric',
    metric,
  ]
    .concat(fuzz ? ['-fuzz', fuzz] : [])
    // Paths to actual, expected, and diff images
    .concat([
      actualFilename,
      expectedFilename,
      // If there is no output image, then output to `stdout` (which is ignored)
      diffFilename || '-',
    ])

  return new Promise((accept, reject) => {
    switch (implementation) {
      case 'imagemagick1': {
        // http://www.imagemagick.org/script/compare.php
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
        break
      }

      case 'imagemagick2':
        // http://www.imagemagick.org/script/compare.php
        // https://github.com/aheckmann/gm/blob/master/lib/compare.js
        gmMagick().compare(
          actualFilename,
          expectedFilename,
          {
            file: diffFilename,
          },
          (err, Boolean, equality) => {
            if (err) {
              reject(err)
              return
            }

            accept(equality)
          }
        )
        break

      case 'graphicsmagick': {
        // http://www.graphicsmagick.org/GraphicsMagick.html
        // https://github.com/aheckmann/gm/blob/master/lib/compare.js
        gm.compare(
          actualFilename,
          expectedFilename,
          {
            highlightColor: 'RED',
            highlightStyle: 'Assign',
            file: diffFilename,
          },
          (err, Boolean, equality) => {
            if (err) {
              reject(err)
              return
            }

            accept(equality)
          }
        )
        break
      }

      default:
        throw new Error('Unknow implementation')
    }
  })
}

export async function rawDifference(options) {
  const { actualFilename, expectedFilename, diffFilename, ...other } = options

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
    ...other,
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

  return {
    raw,
    width: maxWidth,
    height: maxHeight,
  }
}

export default async function imageDifference(optionsWithoutDefault) {
  const {
    actualFilename,
    expectedFilename,
    implementation = 'imagemagick1',
    metric = 'AE',
    highlightColor = 'red',
    lowlightColor = 'white',
    fuzz = 0,
    ...other
  } = optionsWithoutDefault

  // Assert our options are passed in
  if (!actualFilename) {
    throw new Error('`options.actualFilename` was not passed to `image-difference`')
  }

  if (!expectedFilename) {
    throw new Error('`options.expectedFilename` was not passed to `image-difference`')
  }

  const options = {
    actualFilename,
    expectedFilename,
    implementation,
    metric,
    highlightColor,
    lowlightColor,
    fuzz,
    ...other,
  }

  const difference = await rawDifference(options)
  return handleRaw(difference, options)
}
