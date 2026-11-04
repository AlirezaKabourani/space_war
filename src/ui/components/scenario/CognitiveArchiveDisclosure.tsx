import { useEffect, useState } from 'react';
import { ARCHIVE_DISCLOSURE_FA, readCognitiveArchivePolicy } from '../../../services/storage/cognitiveArchivePolicy';

export function CognitiveArchiveDisclosure() {
  const [policy, setPolicy] = useState(readCognitiveArchivePolicy);
  useEffect(() => {
    const update = () => setPolicy(readCognitiveArchivePolicy());
    window.addEventListener('storage', update);
    window.addEventListener('cognitive-archive-policy-change', update);
    return () => {
      window.removeEventListener('storage', update);
      window.removeEventListener('cognitive-archive-policy-change', update);
    };
  }, []);
  return policy.enabled ? <p className="hint" role="note" dir="rtl" data-cognitive-archive-disclosure>{ARCHIVE_DISCLOSURE_FA}</p> : policy.error ? <p role="status" dir="rtl">{policy.error}</p> : null;
}
