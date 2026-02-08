# SolidJS

[SolidJS](https://www.solidjs.com/) is a Reactive JavaScript library.

## What is reactivity?

In short, a snippet on a webpage might be dynamic; a reactive variable is used and the snippet will update itself.

As Ryan Carniato, author of SolidJS told best;
Think of it like a spreadsheet. You have a SUM and AVG here and there, together with some other calculations all over the place.
If you update one cell, the calculations will all cascade and update automatically; this is what reactivity is in short.

Also look at the [online docs](https://docs.solidjs.com/concepts/intro-to-reactivity).


### How does it compare to React?

In usage, React is fairly similar with some caveats and the main difference is that SolidJS doesn't use a virtual DOM, boosting performance and memory use.
It's a "run once" scenario that keeps internal references to the parts that need updating

Some major differences:
* signals and other reactive elements can be created outside a component; components are not leading but just a "context"
* your component's code is not reactive, only the JSX allows for reactive updates; every reactive action inside the code and outside the JSX must be taken care of with the regular "helpers" like `createEffect` and `createSignal`.
* never destructure properties or stores, it breaks reactivity.
* use array map calls with caution; for repetitive sub components use `<For>`

### Technical / in-depth
* TODO: Proxy objects

## Common helpers and components
* `createSignal()`: creates a getter and setter pair that internally sets up the variable tracking.
* `createEffect()`: see it as a callback function that is called whenever the reactive variables inside it change. 
* `createMemo()`: creates a reactive variable that is a computation of other reactive variables; if one changes, the computation (callback) will run again.
* `onMount()`: this is similar to createEffect but wil only run the first time. Note that the callback can be async, for example, to fetch external data.
* `onCleanup()`: This will be called when its parent scope is disposed of (for example, a component, but also other context-aware functions.
* `createStore()`: creates a getter and setter pair that internally sets up the variable tracking, but then recursively for objects. Every dot notation lookup will generate a tracking scope for granularly triggering updates. 

## What is JSX?
* `<Todo/>`