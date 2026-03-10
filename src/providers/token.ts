import { Accessor, createContext, useContext } from 'solid-js'
import { Token } from '../utils/token';

export const TokenContext = createContext<Accessor<Token>>(
  undefined
);

export function useTokenContext() {
  const ctx = useContext(TokenContext);
  if (!ctx) {
    throw "useTokenContext must be used within a TokenContext.Provider";
  }
  return ctx;
}
