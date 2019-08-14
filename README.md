# Glue Stack

Sticks a hierarchy of elements within the viewport instead of scrolling out of view.

## Features
- Sticky elements are replaced by their peer when a peer collides with it (pushing up from the bottom).
- Child sticky elements are replaced by their parents’ siblings (i.e. uncles, great uncles) when they collide.

## Dependencies

1. glue-stick

## Usage

### Install

```shell
npm install @informatix8/glue-stack --save-dev
```

### CDN

```html
<script src="https://unpkg.com/@informatix8/glue-stack/dist/glue-stack.all.umd.js"></script>
```

### Vanilla Javascript

```javascript
new GlueStack({
    mainContainer: document.querySelector('.main-container'),
    hierarchySelectors: ['h1', 'h2', 'h3'],
    zIndex: 1000
});
```

## Development

```shell
npm run dev
```

## Build

```shell
npm run build
```

## Release

```shell
npm run build
git tag -a vX.Y.Z
git push origin master
git push origin --tags
npm publish --access=public .
```
