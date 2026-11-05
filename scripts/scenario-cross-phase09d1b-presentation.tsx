// TEST ONLY: scalar presentation fixtures, never archive inputs or scientific runs.
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import '../src/ui/components/admin/CrossScenarioCognitiveDashboard.css';
import { CognitiveSignedSpectrum, CognitiveStoredValue, CrossScenarioCognitiveDashboard } from '../src/ui/components/admin/CrossScenarioCognitiveDashboard';

export function PresentationWitness() {
  return <><main className="cross-dashboard" dir="rtl"><h1>آزمون نمایش — داده‌های نمونه آزمایشی</h1>
    {[-1, 0, 1, null].map((value, i) => <section key={i} data-scalar-case={String(value)}>
      <CognitiveSignedSpectrum label="جهت‌گیری آزمایشی" value={value} field={`orientation-${i}`} />
      <CognitiveSignedSpectrum label="ریسک آزمایشی" value={value} field={`risk-${i}`} risk />
    </section>)}
    <section data-zero-case><CognitiveStoredValue label="صفر" field="zero" value={0} bar /></section>
    <section data-null-case><CognitiveStoredValue label="داده ناکافی" field="null" value={null} bar /></section>
    <section data-missing-case><CognitiveStoredValue label="فیلد حذف‌شده" field="missing" value={undefined as unknown as number} bar /></section>
  </main><section data-denied-props><CrossScenarioCognitiveDashboard targetProfileId="not-authorized" access={null} profiles={[]} onBack={() => {}} /></section></>;
}
createRoot(document.getElementById('root')!).render(<PresentationWitness />);
