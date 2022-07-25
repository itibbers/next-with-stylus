# next-with-stylus

> Forked from [next-with-less](https://github.com/elado/next-with-less).

[Next.js](https://nextjs.org/) + [Stylus CSS](https://www.stylus.com/) Support

Next.js supports SASS/SCSS, but not stylus. This plugin adds stylus support by duplicating SASS webpack rules and adding support for `.styl` files with `stylus-loader`.
It mimics the exact behavior of CSS extraction/css-modules/errors/client/server of SASS.

⚠️ _**Use with caution - Next.js implementation can chance in any version, and the monkey patching may not work anymore.**_

Tested with `next@11.0.1` (with webpack5), `next@12.0.7`.

## Install

```sh
yarn add next-with-stylus

npm i next-with-stylus
```

Peer dependencies to install: `stylus` `stylus-loader`.

## Usage

```js
// next.config.js
const withStylus = require('next-with-stylus')

module.exports = withStylus({
  stylusLoaderOptions: {
    /* ... */
  },
})
```

You can see all the options available to `stylus-loader` [here](https://webpack.js.org/loaders/stylus-loader/#options).

### Usage with [`next-compose-plugins`](https://github.com/cyrilwanner/next-compose-plugins)

```js
// next.config.js
const withPlugins = require('next-compose-plugins')

const withStylus = require('next-with-stylus')

const plugins = [
  /* ...other plugins... */
  [
    withStylus,
    {
      stylusLoaderOptions: {
        /* ... */
      },
    },
  ],
  /* ...other plugins... */
]

module.exports = withPlugins(plugins, {
  /* ... */
})
```
