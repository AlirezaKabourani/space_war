import type { Scenario5EndStateId } from '../model/mission/index';

// Player-facing transcription of endStateResolver.ts, not a second resolver.
// Only the guarded, completed mission report renders this copy.
export const ENDING_CONDITIONS: Readonly<Record<Scenario5EndStateId, string>> = {
  critical_cargo_lost_or_compromised: 'سلامت کاروان الف کمتر از ۵۵ باشد؛ یا محموله حیاتی تا پایان ۳۶۰ دقیقه تحویل نشود و تداوم عملیاتی شبکه کمتر از ۷۵٪ باشد.',
  priority_delivered_network_degradation: 'کاروان الف با سلامت حداقل ۵۵ تا پایان ۳۶۰ دقیقه برسد، اما تداوم عملیاتی شبکه کمتر از ۱۰۰٪ باشد؛ یعنی دست‌کم یک کاروان معیار سلامت یا مهلت تحویل خود را برآورده نکند.',
  mission_incomplete_continuity_preserved: 'کاروان الف با سلامت حداقل ۵۵ تا پایان ۳۶۰ دقیقه نرسد، اما تداوم عملیاتی شبکه حداقل ۷۵٪ باقی بماند.',
  delivery_complete_threat_persistent: 'کاروان الف با سلامت حداقل ۵۵ تا پایان ۳۶۰ دقیقه برسد و تداوم شبکه ۱۰۰٪ باشد؛ منشأ اخلال از نظر عملیاتی روشن شود، اما اختلال تا پایان مهار نشود.',
  delivery_complete_attribution_unresolved: 'کاروان الف با سلامت حداقل ۵۵ تا پایان ۳۶۰ دقیقه برسد و تداوم شبکه ۱۰۰٪ باشد، اما شواهد برای روشن‌شدن منشأ اخلال از نظر عملیاتی کافی نباشند؛ وضعیت مهار، این ابهام را به‌تنهایی رفع نمی‌کند.',
  delivery_complete_threat_contained: 'کاروان الف با سلامت حداقل ۵۵ تا پایان ۳۶۰ دقیقه برسد، تداوم شبکه ۱۰۰٪ باشد، منشأ اخلال از نظر عملیاتی روشن شود و اختلال تا پایان مهار شده باشد.',
};
