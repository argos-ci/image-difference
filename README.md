# image-difference

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
    - `options.actualFilename` (*String*): Path to actual image file. **must** exist.
    - `options.expectedFilename` (*String*): Path to expected image file. **must** exist.
    - `options.diffFilename` (*String*): Optional path to output differential image.
    - `options.shadow` (*Boolean*): Optional flag to indicate if we should draw a shadow of the unchanged parts of the images
        - For example, if an image is `+` and we diff with `-`, then the image will have `|` be red but also contain a faded `-`
        - By default, this options is `false` meaning a shadow will not be drawn

#### Returns

`Promise`: Return the difference object with a `total` and `percentage` key.

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
  --shadow       Draw a shadow of unchanges parts on diff filename
```

## Contributing

```sh
brew install imagemagick@6 graphicsmagick
yarn
yarn test:watch
```

## License

MIT
