// Test-only host. Runs production components from their initial state via normal UI actions.
// No restored runtime, mocked cognitive result, React state injection or model changes.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import '../src/App.css';
import { ScenarioFourRedesignedScenarioOne } from '../src/ui/components/scenario/ScenarioFourRedesignedScenarioOne';
import { ScenarioFiveSimulation } from '../src/ui/components/scenario/ScenarioFiveSimulation';
import { SystemManagement } from '../src/ui/components/admin/SystemManagement';
import { loadProfileState, saveProfileState } from '../src/services/storage/profileStorage';
import { eventLogger } from '../src/services/analytics/eventLogger';
const initial = loadProfileState(3);
saveProfileState(initial);
export function Witness() {
  const [view, setView] = useState('home');
  const [owner, setOwner] = useState('test-player');
  const profile = initial.profiles.find(p => p.id === owner)!;
  eventLogger.setUserContext(profile);
  const finish = () => setView('home');
  return <><nav style={{ padding: 8, background: '#112033', color: 'white' }}>محیط آزمون جداگانه — اجرای واقعی با مؤلفه‌های محصول
    <button data-host="admin" onClick={() => setView('admin')}>تنظیمات ادمین</button>
    <button data-host="s1" onClick={() => setView('s1')}>اجرای سناریو ۱</button>
    <button data-host="s2" onClick={() => setView('s2')}>اجرای سناریو ۲</button>
    <button data-host="switch" onClick={() => setOwner(x => x === 'test-player' ? 'scenario-tester' : 'test-player')}>تغییر پروفایل</button>
    <button data-host="home" onClick={finish}>خروج آزمون</button><span data-host-owner>{owner}</span>
  </nav>
  {view === 'admin' && <SystemManagement activeProfile={initial.profiles.find(p => p.id === 'admin')!} profiles={initial.profiles} onBack={finish} onManageProfiles={finish} />}
  {view === 's1' && <ScenarioFourRedesignedScenarioOne scenarioId="s4_redesigned_scenario_one" nodeId="witness-real-route" userProfileId={owner} onComplete={finish} />}
  {view === 's2' && <ScenarioFiveSimulation scenarioId="s5_silent_waves_redesign" nodeId="witness-real-route" userProfileId={owner} onComplete={finish} />}
  </>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Witness /></React.StrictMode>);
