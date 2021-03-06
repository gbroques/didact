/**
 * Analogous to a ReactElement.
 * 
 * @typedef DidactElement
 * @type {Object}
 * @property {string} type Type of DOM element to be created.
 *                         Also known as the tag name (e.g. "div", "span", etc.).
 * @property {Object} props Properties or attributes of the element being created.
 */

/**
 * Internal data structure to make it easy to find the next unit of work,
 * during the reconciliation or rendering phase.
 * 
 * Inherits from a DidactElement.
 * 
 * @see https://github.com/facebook/react/blob/v18.1.0/packages/react-reconciler/src/ReactInternalTypes.js#L64-L193
 * 
 * @typedef Fiber
 * @type {Object}
 * @property {string} type Type of DOM element to be created.
 *                         Also known as the tag name (e.g. "div", "span", etc.).
 * @property {Object} props Properties or attributes of the element being created.
 * @property {Element} dom DOM element.
 * @property {Fiber} child Child fiber.
 * @property {Fiber} sibling Sibling fiber.
 * @property {Fiber} return The fiber to which the program should return after processing the current fiber.
 *                          Also can be thought of as the parent fiber.
 *                          @see https://github.com/acdlite/react-fiber-architecture#return
 * @property {Fiber} alternate Link to the old fiber,
 *                             the fiber that was committed to the DOM
 *                             in the previous commit phase.
 *                             The alternate of the current fiber is the work-in-progress,
 *                             and the alternate of the work-in-progress is the current fiber.
 * @property {string} effectTag Describes type of change during reconciliation.
 */

/**
 * Create a Didact element (analogous to a React element),
 * which represents an element in a virtual DOM tree.
 * 
 * @param {string|function} type Type of element.
 *                               Tag name (e.g. "div", "span", etc.) or component function.
 * @param {Object} props Properties of element.
 * @param  {Array.<*>} children Children elements may be Didact elements,
 *                              primitives, or an array of Didact elements.
 * @returns {DidactElement} A Didact element.
 */
function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.flat().map(child => (
                typeof child !== "object" ?
                createTextElement(child) :
                child
            ))
        }
    };
}

function createDom(fiber) {
    const dom = fiber.type === "TEXT_ELEMENT" ?
        document.createTextNode("") :
        document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);

    return dom;
}

/**
 * Creates a text element for primitives.
 * 
 * React doesn't wrap primitive values
 * or create empty arrays when there aren't children,
 * but we do because it simplifies the code.
 * 
 * For our libary, we prefer simple code compared to performant code.
 * 
 * @param {*} value Value of text element.
 * @returns {DidactElement} Text element wrapping value.
 */
function createTextElement(value) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: value,
            children: []
        }
    }
}

// GLOBALS
let nextUnitOfWork = null;

/**
 * The current state previously committed to the browser.
 * @type {Fiber}
 */
let current = null;
/**
 * Work in progress state to be committed to the browser.
 * @type {Fiber}
 */
let workInProgress = null;
// TODO: Should deletions be a property on the fiber node?
//       https://github.com/facebook/react/blob/3dc9a8af05f98d185ca55d56f163dbb46e7ad3f4/packages/react-reconciler/src/ReactFiber.new.js#L150
let deletions = null;

function workLoop(deadline) {
    let shouldYield = false;
    while (nextUnitOfWork && !shouldYield) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1;
    }

    if (!nextUnitOfWork && workInProgress) {
        commitRoot();
    }

    // React uses the scheduler package instead of requestIdleCallback.
    // But for this use case it???s conceptually the same.
    // requestIdleCallback is actually a bit too restrictive and is not executed often enough to implement smooth UI rendering,
    // so React team implemented their own version.
    // https://indepth.dev/posts/1007/the-how-and-why-on-reacts-usage-of-linked-list-in-fiber-to-walk-the-components-tree
    // https://github.com/facebook/react/issues/13206?source=post_page---------------------------#issuecomment-418923831
    requestIdleCallback(workLoop);
}

/**
 * Create root.
 * 
 * @param {Element} rootDomElement Root DOM element to render under.
 */
 function createRoot(rootDomElement) {
    const root = {
        /**
         * @param {DidactElement} element Element to render.
         */
        render: (element) => {
            workInProgress = {
                dom: rootDomElement,
                props: {
                    children: [element]
                },
                alternate: current
            };
            deletions = [];
            nextUnitOfWork = workInProgress;
            requestIdleCallback(workLoop);
        }
    };
    return root;
}


function commitRoot() {
    deletions.forEach(commitWork);
    commitWork(workInProgress.child);
    current = workInProgress
    workInProgress = null;
}

function commitWork(fiber) {
    if (!fiber) {
        return;
    }
    // the fiber from a function component doesn???t have a DOM node
    // to find the parent of a DOM node,
    // we go up the fiber tree until we find a fiber with a DOM node.
    let domParentFiber = fiber.return;
    while (!domParentFiber.dom) {
        domParentFiber = domParentFiber.return;
    }
    const domParent = domParentFiber.dom;

    if (
        fiber.effectTag === "PLACEMENT" &&
        fiber.dom != null
    ) {
        domParent.appendChild(fiber.dom);
    } else if (
        fiber.effectTag === "UPDATE" &&
        fiber.dom != null
    ) {
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        );
    } else if (fiber.effectTag === "DELETION") {
        commitDeletion(fiber, domParent);
        return;
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
        domParent.removeChild(fiber.dom);
    } else {
        commitDeletion(fiber.child, domParent);
    }
}

function updateDom(dom, prevProps, nextProps) {
    // remove properties
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(nextProps))
        .forEach(name => {
            dom[name] = "";
        });

    // set new or change properties
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name];
        });

    // remove old or changed event listeners
    Object.keys(prevProps)
        .filter(isEvent)
        .filter(key => (
            !(key in nextProps) ||
            isNew(prevProps, nextProps)(key)
        )).forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2);
            dom.removeEventListener(eventType, prevProps[name]);
        });
    
    // add event listeners
    Object.keys(nextProps)
        .filter(isEvent)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            const eventType = name
                .toLowerCase()
                .substring(2);
            dom.addEventListener(eventType, nextProps[name]);
        });
}

function isNew(prev, next) {
    return key => prev[key] !== next[key];
}

function isGone(next) {
    return key => !(key in next);
}

function isEvent(key) {
    return key.startsWith("on");
}

function isProperty(key) {
    return key !== "children" && !isEvent(key);
}

function performUnitOfWork(fiber) {
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
        updateFunctionComponent(fiber);
    } else {
        updateHostComponent(fiber);
    }
    /**
     * Search for the next unit of work.
     * First try with the child,
     * then with the sibling,
     * then with the uncle, and so on.
     * 
     * Consider the following example:
     * 
     *  <div>
     *    <h1>
     *      <p />
     *      <a />
     *    </h1>
     *    <h2 />
     *  </div>
     * 
     * From our example,
     * when we finish working on the div fiber
     * the next unit of work will be the h1 fiber.
     * 
     * If the fiber doesn???t have a child,
     * we use the sibling as the next unit of work.
     * 
     * For example,
     * the p fiber doesn???t have a child so we move to the a fiber after finishing it.
     * 
     * If the fiber doesn???t have a child or a sibling
     * we go to the "uncle": the sibling of the parent.
     * 
     * In our example,
     * when we finish working on the a fiber
     * the next unit of work will be the h2 fiber.
     * 
     *  root
     *  ??? ???
     *  ??? ???
     *  ??? ???
     *  <div>
     *  ??? ???
     *  ??? ??? ????????????
     *  ??? ???    ???
     *  <h1>?????????<h2>
     *  ??? ???
     *  ??? ??? ???????????????
     *  ??? ???     ???
     *  <p>????????????<a>
     */
    if (fiber.child) {
        return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
        if (nextFiber.sibling) {
            return nextFiber.sibling;
        }
        nextFiber = nextFiber.return;
    }
}

// GLOBALS for hooks
let wipFiber = null;
let hookIndex = null;

function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    hookIndex = 0;
    wipFiber.hooks = [];
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
    if (!fiber.dom) {
        fiber.dom = createDom(fiber);
    }
    reconcileChildren(fiber, fiber.props.children);
}

/**
 * Reconcile children for placing, updating, or deleting nodes.
 * Compare the elements we receive on the render function
 * to the last fiber tree that was committed to the DOM.
 * 
 * Reconciliation is the algorithm for diffing two virtual DOM trees.
 * https://reactjs.org/docs/reconciliation.html
 * 
 * https://github.com/facebook/react/blob/v18.1.0/packages/react-reconciler/src/ReactFiberBeginWork.new.js#L287-L318
 */
function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    let prevSibling = null;

    // Iterate over an array and a linked list at the same time
    // Inside the while loop is the oldFiber and element.
    // The element is the thing we want to render to the DOM
    // and the oldFiber is what we rendered the last time.

    // We need to compare them to see if there???s any change we need to apply to the DOM.
    while (index < elements.length || oldFiber) {
        const element = elements[index];
        let newFiber = null;

        const sameType = (
            oldFiber &&
            element &&
            element.type == oldFiber.type
        );

        if (sameType) {
            // update node
            newFiber = {
                type: oldFiber.type,
                props: element.props,
                dom: oldFiber.dom,
                return: wipFiber,
                alternate: oldFiber,
                effectTag: "UPDATE"
            };
        }
        if (element && !sameType) {
            // add this node
            // When a React element is converted into a fiber node for the first time,
            // React uses the data from the element to create a fiber in the createFiberFromTypeAndProps function
            // createFiberFromElement -> createFiberFromTypeAndProps
            // https://github.com/facebook/react/blob/v18.1.0/packages/react-reconciler/src/ReactFiber.new.js#L639
            // https://indepth.dev/posts/1008/inside-fiber-in-depth-overview-of-the-new-reconciliation-algorithm-in-react
            newFiber = {
                type: element.type,
                props: element.props,
                dom: null,
                return: wipFiber,
                alternate: null,
                effectTag: "PLACEMENT"
            };
        }
        if (oldFiber && !sameType) {
            // delete oldFiber's node
            oldFiber.effectTag = "DELETION";
            deletions.push(oldFiber);
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        // set new fiber as child or sibling.
        if (index === 0) {
            wipFiber.child = newFiber;
        } else if (element) {
            prevSibling.sibling = newFiber;
        }

        prevSibling = newFiber;
        index++;
    }
}

function useState(initial) {
    const oldHook = (
        wipFiber.alternate &&
        wipFiber.alternate.hooks &&
        wipFiber.alternate.hooks[hookIndex]);
    const hook = {
        state: oldHook ? oldHook.state : initial,
        queue: []
    };

    const actions = oldHook ? oldHook.queue : [];
    actions.forEach(action => {
        hook.state = action(hook.state);
    });

    const setState = action => {
        hook.queue.push(action);
        // do something similiar to render function
        // set wipRoop and nextUnitOfWork
        workInProgress = {
            dom: current.dom,
            props: current.props,
            alternate: current
        };
        nextUnitOfWork = workInProgress;
        deletions = [];
    };

    wipFiber.hooks.push(hook);
    hookIndex++;
    return [hook.state, setState];
}

const Didact = {
    createElement,
    createRoot,
    useState
};

export {Didact as default};
