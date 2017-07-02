import rimraf from 'rimraf'
import getPixels from 'get-pixels'
import imageDifference from '../src/imageDifference'

function getPixelsAsync(filename) {
  return new Promise((accept, reject) => {
    getPixels(filename, (err, pixels) => {
      if (err) {
        reject(err)
        return
      }

      accept(pixels)
    })
  })
}

// Clean up actual-files
rimraf.sync(`${__dirname}/actual-files`)

describe('e2e', () => {
  it('diffing different images', async () => {
    const difference = await imageDifference({
      actualFilename: `${__dirname}/test-files/checkerboard.png`,
      expectedFilename: `${__dirname}/test-files/white.png`,
      diffFilename: `${__dirname}/actual-files/different.png`,
    })
    const actual = await getPixelsAsync(`${__dirname}/actual-files/different.png`)
    const expected = await getPixelsAsync(`${__dirname}/expected-files/different.png`)

    expect(difference).toMatchSnapshot()
    expect(actual).toEqual(expected)
  })

  it('diffing the same image', async () => {
    const difference = await imageDifference({
      actualFilename: `${__dirname}/test-files/checkerboard.png`,
      expectedFilename: `${__dirname}/test-files/checkerboard.png`,
      diffFilename: `${__dirname}/actual-files/same.png`,
    })
    const actual = await getPixelsAsync(`${__dirname}/actual-files/same.png`)
    const expected = await getPixelsAsync(`${__dirname}/expected-files/same.png`)

    expect(difference).toEqual({
      value: 0,
    })
    expect(actual).toEqual(expected)
  })

  it('diffing different sizes images', async () => {
    const difference = await imageDifference({
      actualFilename: `${__dirname}/test-files/checkerboard-excess.png`,
      expectedFilename: `${__dirname}/test-files/checkerboard.png`,
      diffFilename: `${__dirname}/actual-files/different-size.png`,
    })
    const actual = await getPixelsAsync(`${__dirname}/actual-files/different-size.png`)
    const expected = await getPixelsAsync(`${__dirname}/expected-files/different-size.png`)

    expect(difference).toMatchSnapshot()
    expect(actual).toEqual(expected)
  })

  it('diffing different images without an output image', async () => {
    const difference = await imageDifference({
      actualFilename: `${__dirname}/test-files/checkerboard.png`,
      expectedFilename: `${__dirname}/test-files/white.png`,
    })

    expect(difference).toMatchSnapshot()
  })

  it('diffing images which cannot scale into each other', async () => {
    const difference = await imageDifference({
      actualFilename: `${__dirname}/test-files/horizontal.png`,
      expectedFilename: `${__dirname}/test-files/vertical.png`,
      diffFilename: `${__dirname}/actual-files/horizontal-vertical.png`,
    })
    const actual = await getPixelsAsync(`${__dirname}/actual-files/horizontal-vertical.png`)
    const expected = await getPixelsAsync(`${__dirname}/expected-files/horizontal-vertical.png`)

    expect(difference).toMatchSnapshot()
    expect(actual).toEqual(expected)
  })

  it('diffing the same image where 1 has a transparent background', async () => {
    const difference = await imageDifference({
      actualFilename: `${__dirname}/test-files/checkerboard-transparent.png`,
      expectedFilename: `${__dirname}/test-files/checkerboard.png`,
      diffFilename: `${__dirname}/actual-files/different-transparent.png`,
    })
    expect(difference).toMatchSnapshot()
  })
})
