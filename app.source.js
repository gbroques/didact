// Tell Babel to use Didact.createElement for JSX.
// https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#customizing-the-classic-runtime-import
/** @jsx Didact.createElement */

import Didact from "./didact.js";

export default function App() {
    const [count, setCount] = Didact.useState(0);
    const handleClick = (event) => {
        setCount(c => c + 1);
    };
    return (
        <div>
            <header style="display: flex">
                <h1>Didact</h1>
                <img src="react-icon.svg" alt="Didact" style="max-width: 35px; margin-left: 8px" />
            </header>
            
            <h2>{count}</h2>
            <button onClick={handleClick}>
                Increment
            </button>
            <p>
                Inspired from:
                <a href="https://pomb.us/build-your-own-react/" target="_blank">
                    Build your own React - Rodrigo Pombo
                </a>
                .
            </p>
        </div>
    );
}
