# Orion
Canvas 2D particles animation
[Demo](https://dobrapyra.github.io/Orion/)  

## Usage
### Install
Add the main Orion script
```html
<script type="text/javascript" src="./dist/orion.min.js"></script>
```
### Define constellation
Define border points
```js
var borderPoints = [
  { x: 100, y: 100 },
  { x: 150, y: 100 },
  { x: 200, y: 100 },
  { x: 200, y: 150 },
  { x: 200, y: 200 },
  { x: 150, y: 200 },
  { x: 100, y: 200 },
  { x: 100, y: 150 }
];
```
Define inside points
```js
var insidePoints = [
  { x: 125, y: 125 },
  { x: 175, y: 125 },
  { x: 175, y: 175 },
  { x: 125, y: 175 },
  { x: 150, y: 150 }
];
```
### Initialize
Initialize the orion script
```js
var myOrion = new Orion({
  viewport: document.getElementById('viewport'),
  w: 300,
  h: 300,
  constellation: {
    points: {
      border: borderPoints,
      inside: insidePoints
    }
  }
});
```
## Parameters
Example for all available parameters
```js
{
  viewport: document.getElementById('viewport'), // main viewport element
  eventHandler: document.getElementById('container'), // mouse move event handler element (default the same as viewport)
  fpsMeter: document.getElementById('fps'), // FPS meter element
  fpsLimit: 36, // FPS limitation
  w: 1280, // canvas width
  h: 720, // canvas height
  constellation: {
    points: {
      border: borderPoints, // border points - array of objects like {x,y}
      inside: insidePoints // border points - array of objects like {x,y}
    },
    force: { // edge force for each type of points
      border: 40,
      inside: 20,
      cursor: 120
    },
    amplitude: { // amplitude range for inside points
      min: 10,
      max: 30
    },
    speed: { // speed range for inside points
      min: .0008,
      max: .0016
    },
    opacity: { // edge opacity
      border: 0.5
    },
    onlyInside: true // only inside mode for cursor point
  },
  customCursorOffset: {
    x: 0,
    y: 0
  }
});
```
## Extra methods
It is the good practice to pause the animation when the viewport element is not visible for the user.
It allows to improve the performance of the site, because the animation is high CPU/GPU demanding.
You can deal with it by implementing your own script using inner methods of the loop.
```js
var myOrion = new Orion(/*...*/); // the instance of the Orion class
```
If you want to stop the animation just call a `loop.stop` method:
```js
myOrion.loop.stop();
```
Then you can start it again by `loop.start` method:
```js
myOrion.loop.start();
```