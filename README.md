# Didact

Inspired and adapted from [Build your own React](https://pomb.us/build-your-own-react/).

## Prerequisites

1. Install [Node.js](https://nodejs.org/en/).
2. Install dependencies:

       npm install

## How to Run

1. Start the web server.

       npm run serve

2. Transpile `app.source.js` to `app.dist.js` with Babel for JSX.

       npm run watch

3. Navigate to http://127.0.0.1:8080.

Additionally, on UNIX-like operating systems (Linux, Mac, Git Bash on Windows), you can run `npm start`; which runs `npm run serve` and `npm run watch` in parallel.

## Limitations

* SVG is not supported.
* Not performant for production code.
* No Fragment syntax.

## Resources

* [React Source Code Walkthrough - YouTube](https://www.youtube.com/playlist?list=PLvx8w9g4qv_p-OS-XdbB3Ux_6DMXhAJC3)
* [Inside Fiber: in-depth overview of the new reconciliation algorithm in React](https://indepth.dev/posts/1008/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react)
* [Exploring how virtual DOM is implemented in React](https://indepth.dev/posts/1501/exploring-how-virtual-dom-is-implemented-in-react)
* [acdlite/react-fiber-architecture](https://github.com/acdlite/react-fiber-architecture)
* [Virtual DOM and Internals – React](https://reactjs.org/docs/faq-internals.html)
