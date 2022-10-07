# image-difference

> :warning: **This project is deprecated and no longer maintained.**

> Create image differential between two images

[![npm package](https://img.shields.io/npm/v/image-difference.svg)](https://www.npmjs.org/package/image-difference)
[![Build Status](https://travis-ci.org/argos-ci/image-difference.svg?branch=master)](https://travis-ci.org/argos-ci/image-difference)

[![PeerDependencies](https://img.shields.io/david/peer/argos-ci/image-difference.svg)](https://david-dm.org/argos-ci/image-difference#info=peerDependencies&view=list)
[![Dependencies](https://img.shields.io/david/argos-ci/image-difference.svg)](https://david-dm.org/argos-ci/image-difference)
[![DevDependencies](https://img.shields.io/david/dev/argos-ci/image-difference.svg)](https://david-dm.org/argos-ci/image-difference#info=devDependencies&view=list)

## The problem solved

![difference](example/example.png)

This is a fork of [image-diff](https://github.com/uber-archive/image-diff) that is no longer maintained.
This was created as part of a [visual regression](http://www.youtube.com/watch?v=1wHr-O6gEfc) project and now supported as part of [Argos-CI](https://www.argos-ci.com/).

## Installation

`image-difference` depends on [ImageMagick](http://www.imagemagick.org/script/index.php) Please install this before continuing.

```sh
npm install --save image-difference
```

## API

### `imageDifference(options) => Promise`

Create image differential between two images

#### Arguments

1. `options` (*Object*)
    - `options.metric` (*String*, default to `AE`): Optional metric used for the computation of the output.
        - [documentation](http://legacy.imagemagick.org/script/command-line-options.php#metric)
        - [guide](http://www.imagemagick.org/Usage/compare/)
        - [implementation](https://github.com/ImageMagick/ImageMagick/blob/master/MagickCore/compare.c)
    - `options.actualFilename` (*String*): Path to actual image file. **must** exist.
    - `options.expectedFilename` (*String*): Path to expected image file. **must** exist.
    - `options.diffFilename` (*String*): Optional path to output differential image.

#### Returns

`Promise`: Return the output of the process. It's an object that contains the `width`, `height` properties.

Also, depending on the metric used, we either returns `value` or `value 1`, `value2`, `valueX`.
Those values are in the order of the ImageMagick output.
For instance, with the default `AE` metric, `value` is the number of different pixels after the `fuzz` being applied.

#### [Example](https://github.com/argos-ci/image-difference/tree/master/example)

```js
import imageDifference from '../src/imageDifference'

imageDifference(
  {
    actualFilename: `${__dirname}/images/hello-world.png`,
    expectedFilename: `${__dirname}/images/hello.png`,
    diffFilename: `${__dirname}/images/hello-diff.png`,
  },
  console.log
)
```

## CLI Usage

```sh
Usage:  [options] <actual-filename> <expected-filename> [diff-filename]

Create image differential between two images

Options:

  -h, --help     output usage information
  -V, --version  output the version number
```


## Benchmark

We use `imagemagick1` as the default implmentation

```sh
image-diff diff x 1.11 ops/sec ±1.21% (25 runs sampled)
image-diff same x 1.07 ops/sec ±0.80% (25 runs sampled)

image-difference imagemagick1 diff x 4.43 ops/sec ±0.40% (41 runs sampled)
image-difference imagemagick1 same x 4.45 ops/sec ±0.49% (41 runs sampled)

image-difference imagemagick2 diff x 2.96 ops/sec ±0.49% (34 runs sampled)
image-difference imagemagick2 same x 2.94 ops/sec ±0.87% (34 runs sampled)

image-difference graphicsmagick diff x 2.32 ops/sec ±0.60% (31 runs sampled)
image-difference graphicsmagick same x 2.30 ops/sec ±0.72% (31 runs sampled)

pixelmatch diff x 0.79 ops/sec ±0.94% (23 runs sampled)
pixelmatch same x 3.58 ops/sec ±2.07% (37 runs sampled)

resemble diff x 0.59 ops/sec ±4.76% (22 runs sampled)
resemble same x 0.94 ops/sec ±0.85% (24 runs sampled)

looksSame diff x 2.09 ops/sec ±3.08% (30 runs sampled)
looksSame same x 1.08 ops/sec ±3.76% (25 runs sampled)
```

## Contributing

```sh
brew install imagemagick@6 graphicsmagick
yarn
yarn test:watch
```

## License

MIT
