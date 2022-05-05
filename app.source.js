// Tell Babel to use Didact.createElement for JSX.
// https://babeljs.io/docs/en/babel-plugin-transform-react-jsx#customizing-the-classic-runtime-import
/** @jsx Didact.createElement */

import Didact from "./didact.js";

export default function App() {
    const [count, setCount] = Didact.useState(0);
    const handleClick = (event) => {
        setCount(c => c + 1);
    };
    const animals = ["dog", "cat", "fish"];
    return (
        <div>
            <h1>Didact</h1>
            <h1>{count}</h1>
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
            <ul>
            {
                animals.map(animal => <li>{animal}</li>)
            }
            </ul>
        </div>
    );
}
