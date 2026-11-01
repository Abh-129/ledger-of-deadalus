import { Component, ReactNode, useState } from 'react';
import Experience from './experience/Experience';
import Overlay from './overlay/Overlay';
import StaticFallback from './overlay/StaticFallback';

function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

class Boundary extends Component<{ onFail: () => void; children: ReactNode }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() { return { bad: true }; }
  componentDidCatch() { this.props.onFail(); }
  render() { return this.state.bad ? null : this.props.children; }
}

export default function App() {
  const [fallback, setFallback] = useState(() => !hasWebGL() || new URLSearchParams(location.search).has('static'));
  if (fallback) return <StaticFallback />;
  return (
    <>
      <Boundary onFail={() => setFallback(true)}><Experience onFail={() => setFallback(true)} /></Boundary>
      <Overlay />
    </>
  );
}
