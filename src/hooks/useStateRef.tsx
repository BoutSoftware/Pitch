import React, { SetStateAction } from "react";

/**
 * Hook to manage state with a reference to the current value.
 * Using the ref avoids
 * - stale closures when using the state in asynchronous callbacks.
 * - having to wait for the next render to get the latest state value.
 * 
 * @param initialValue The initial value for the state.
 * @returns A tuple containing the current state value, a function to update the state with reference to the current value, and a ref to the current state value.
 */
export default function useStateRef<T>(initialValue: T): [T, (valueOrCallback: SetStateAction<T>) => void, React.RefObject<T>] {
  const [state, setState] = React.useState(initialValue);
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setStateWithRef = (valueOrCallback: SetStateAction<T>) => {
    let newValue: T;
    if (typeof valueOrCallback === "function") {
      newValue = (valueOrCallback as (prevState: T) => T)(stateRef.current);
    } else {
      newValue = valueOrCallback;
    }

    setState(newValue);
    stateRef.current = newValue;
  };

  return [state, setStateWithRef, stateRef];
}