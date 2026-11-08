import React from "react";
// Only the GPU renderer is replaced in DOM tests; the real UI and match rules run.
export default function Scene({ screen, engine }) {
  globalThis.uiTestEngine = engine.current;
  return <div data-testid="scene" data-screen={screen} />;
}

export function Dice(){return null;}
