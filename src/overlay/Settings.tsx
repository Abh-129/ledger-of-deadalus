import { SETTINGS_LABELS as L } from '../content/copy';
import { useStore } from '../store';

export default function Settings() {
  const { settings: s, setSetting, showSettings } = useStore();
  const toggle = () => useStore.setState((x) => ({ showSettings: !x.showSettings }));
  const check = (k: 'sound' | 'reducedMotion') => (
    <label key={k}>{L[k]}<input type="checkbox" checked={s[k]} onChange={(e) => setSetting(k, e.target.checked)} /></label>
  );
  return (
    <>
      <div className="top-right">
        <button className="gear" onClick={toggle} aria-expanded={showSettings} aria-label="Settings">{'⚙'}</button>
      </div>
      {showSettings && (
        <div className="settings" role="dialog" aria-label="Settings">
          {check('sound')}
          <label>{L.quality}
            <select value={s.quality} onChange={(e) => setSetting('quality', e.target.value as 'high' | 'low')}>
              <option value="high">High</option><option value="low">Low</option>
            </select>
          </label>
          {check('reducedMotion')}
        </div>
      )}
    </>
  );
}
