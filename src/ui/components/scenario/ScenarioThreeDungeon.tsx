import { useEffect, useMemo, useRef, useState } from "react";
import { eventLogger } from "../../../services/analytics/eventLogger";
import cargoIcon from "../../../../assets/s3/cargo_icon.png";
import cardFrameTactical from "../../../../assets/s3/card_frame_tactical.png";
import dungeonBackground from "../../../../assets/s3/scenario3_dungeon_background.png";
import enemyDroneIcon from "../../../../assets/s3/enemy_drone_icon.png";
import friendlySatelliteIcon from "../../../../assets/s3/friendly_satellite_icon.png";

type TileType =
  | "start"
  | "exit"
  | "normal"
  | "unknown"
  | "threat_ground"
  | "threat_air"
  | "signal_noise"
  | "intel"
  | "safe_cover"
  | "shortcut";

type ResourceKey =
  | "cargoHealth"
  | "time"
  | "satelliteEnergy"
  | "exposure"
  | "dataConfidence";

type S3Resources = Record<ResourceKey, number>;
type CardId = "instant_scan" | "signal_decoy" | "emergency_cover" | "route_analysis" | "data_recovery";
type ChallengeKind = "ground" | "air" | "noise";

interface ScenarioThreeDungeonProps {
  scenarioId: string | number;
  nodeId: string;
  userProfileId?: string;
  onCompletionUiActiveChange?: (active: boolean) => void;
  onComplete: () => void;
}

interface DungeonTile {
  id: string;
  x: number;
  y: number;
  type: TileType;
  label?: string;
}

interface DungeonArea {
  id: string;
  name: string;
  goal: string;
  width: number;
  height: number;
  startTileId: string;
  exitTileId: string;
  tiles: DungeonTile[];
  rewardHint: string;
}

interface TacticalCard {
  id: CardId;
  title: string;
  text: string;
}

interface Ability {
  id: string;
  title: string;
  text: string;
  active: boolean;
  level?: number;
}

interface ChallengeOption {
  id: string;
  text: string;
  cardId?: CardId;
  effects: Partial<S3Resources>;
}

interface ActiveChallenge {
  id: string;
  kind: ChallengeKind;
  tileId: string;
  title: string;
  description: string;
  options: ChallengeOption[];
}

interface Upgrade {
  id: string;
  title: string;
  text: string;
  apply: (resources: S3Resources) => S3Resources;
  cardId?: CardId;
  abilityId?: string;
}

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(value)));
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

const scenario3Assets = {
  dungeonBackground,
  cargo: cargoIcon,
  friendlySatellite: friendlySatelliteIcon,
  enemyDrone: enemyDroneIcon,
  cardFrame: cardFrameTactical,
};

const initialResources: S3Resources = {
  cargoHealth: 100,
  time: 0,
  satelliteEnergy: 80,
  exposure: 15,
  dataConfidence: 55,
};

const initialCards: TacticalCard[] = [
  { id: "instant_scan", title: "اسکن فوری", text: "چند خانه اطراف محموله آشکار می‌شود." },
  { id: "signal_decoy", title: "فریب سیگنالی", text: "سطح افشا را کاهش می‌دهد." },
  { id: "emergency_cover", title: "پوشش اضطراری", text: "آسیب تهدید بعدی را کم می‌کند." },
  { id: "route_analysis", title: "تحلیل سریع مسیر", text: "ریسک دو مسیر نزدیک را توضیح می‌دهد." },
  { id: "data_recovery", title: "بازیابی داده", text: "کیفیت داده را افزایش می‌دهد." },
];

const initialAbilities: Ability[] = [
  { id: "orbital_scan", title: "اسکن مداری سطح ۱", text: "هر راند یک خانه ناشناخته را آشکار می‌کند.", active: true, level: 1 },
  { id: "early_warning", title: "هشدار زودهنگام", text: "نزدیک شدن به تهدید با هشدار متنی مشخص می‌شود.", active: false },
  { id: "noise_filter", title: "فیلتر اختلال", text: "اثر خانه‌های signal_noise را کاهش می‌دهد.", active: false },
  { id: "emergency_pathfinder", title: "مسیر‌یاب اضطراری", text: "در هر محوطه یک خانه مجاور را امن موقت می‌کند.", active: true },
];

const tile = (x: number, y: number, type: TileType, label?: string): DungeonTile => ({
  id: `t${x}-${y}`,
  x,
  y,
  type,
  label,
});

const areas: DungeonArea[] = [
  {
    id: "area_1",
    name: "کریدور آغازین",
    goal: "حرکت، اسکن و مصرف کارت را تمرین کنید.",
    width: 5,
    height: 5,
    startTileId: "t0-2",
    exitTileId: "t4-2",
    rewardHint: "پاداش محوطه: تثبیت اسکن مداری سطح ۱",
    tiles: [
      tile(0, 2, "start"),
      tile(1, 2, "normal"),
      tile(2, 2, "intel"),
      tile(3, 2, "threat_ground"),
      tile(4, 2, "exit"),
      tile(1, 1, "safe_cover"),
      tile(2, 1, "unknown"),
      tile(3, 1, "shortcut"),
      tile(1, 3, "unknown"),
      tile(2, 3, "signal_noise"),
      tile(3, 3, "normal"),
    ],
  },
  {
    id: "area_2",
    name: "منطقه تعقیب",
    goal: "سطح افشا را کنترل کنید و از تهدیدهای فعال عبور کنید.",
    width: 6,
    height: 5,
    startTileId: "t0-2",
    exitTileId: "t5-2",
    rewardHint: "پاداش محوطه: هشدار زودهنگام",
    tiles: [
      tile(0, 2, "start"),
      tile(1, 2, "normal"),
      tile(2, 2, "threat_air"),
      tile(3, 2, "safe_cover"),
      tile(4, 2, "threat_ground"),
      tile(5, 2, "exit"),
      tile(1, 1, "unknown"),
      tile(2, 1, "shortcut"),
      tile(3, 1, "threat_air"),
      tile(4, 1, "intel"),
      tile(1, 3, "safe_cover"),
      tile(2, 3, "signal_noise"),
      tile(3, 3, "unknown"),
      tile(4, 3, "normal"),
    ],
  },
  {
    id: "area_3",
    name: "منطقه داده ناقص",
    goal: "با اطمینان داده پایین تصمیم بگیرید و اختلال را مدیریت کنید.",
    width: 6,
    height: 6,
    startTileId: "t0-3",
    exitTileId: "t5-2",
    rewardHint: "پاداش محوطه: فیلتر اختلال",
    tiles: [
      tile(0, 3, "start"),
      tile(1, 3, "signal_noise"),
      tile(2, 3, "unknown"),
      tile(3, 3, "signal_noise"),
      tile(4, 3, "threat_air"),
      tile(5, 2, "exit"),
      tile(1, 2, "normal"),
      tile(2, 2, "intel"),
      tile(3, 2, "signal_noise"),
      tile(4, 2, "normal"),
      tile(1, 4, "safe_cover"),
      tile(2, 4, "shortcut"),
      tile(3, 4, "threat_ground"),
      tile(4, 4, "unknown"),
    ],
  },
];

const getChallenge = (tileType: TileType, tileId: string): ActiveChallenge | null => {
  if (tileType === "threat_ground") {
    return {
      id: `challenge-ground-${tileId}`,
      kind: "ground",
      tileId,
      title: "نشانه‌های کمین زمینی",
      description: "رد حرارتی و توقف‌های کوتاه در مسیر دیده می‌شود. محموله در معرض کشف زمینی است.",
      options: [
        { id: "fast", text: "ادامه مسیر با سرعت بالا", effects: { time: 4, exposure: 12, cargoHealth: -16 } },
        { id: "scan", text: "توقف و درخواست اسکن", effects: { time: 10, satelliteEnergy: -12, dataConfidence: 16 } },
        { id: "cover", text: "استفاده از پوشش اضطراری", cardId: "emergency_cover", effects: { time: 6, exposure: -4, cargoHealth: 0 } },
      ],
    };
  }
  if (tileType === "threat_air") {
    return {
      id: `challenge-air-${tileId}`,
      kind: "air",
      tileId,
      title: "تهدید هوایی نزدیک",
      description: "یک پهپاد شناسایی دشمن در لایه بالایی مسیر دیده شده و پنجره عبور محدود است.",
      options: [
        { id: "cover_run", text: "حرکت سریع به سمت پوشش", effects: { time: 5, exposure: 14, cargoHealth: -10 } },
        { id: "silent", text: "خاموشی موقت ارتباطی", effects: { time: 8, exposure: -14, dataConfidence: -12 } },
        { id: "decoy", text: "استفاده از فریب سیگنالی", cardId: "signal_decoy", effects: { exposure: -22, satelliteEnergy: -4 } },
      ],
    };
  }
  if (tileType === "signal_noise") {
    return {
      id: `challenge-noise-${tileId}`,
      kind: "noise",
      tileId,
      title: "داده مخدوش",
      description: "تصویر ماهواره‌ای روی این بخش دچار نویز است و اعتماد مسیر پایین آمده است.",
      options: [
        { id: "imperfect", text: "تصمیم با داده ناقص", effects: { time: 3, dataConfidence: -12, exposure: 8 } },
        { id: "clean", text: "مصرف انرژی برای پاکسازی داده", effects: { satelliteEnergy: -14, time: 7, dataConfidence: 18 } },
        { id: "recover", text: "استفاده از کارت بازیابی داده", cardId: "data_recovery", effects: { dataConfidence: 24 } },
      ],
    };
  }
  return null;
};

const baseUpgrades: Upgrade[] = [
  { id: "energy_10", title: "افزایش انرژی ماهواره", text: "+۱۰ انرژی ماهواره", apply: (r) => ({ ...r, satelliteEnergy: clamp(r.satelliteEnergy + 10) }) },
  { id: "confidence_10", title: "افزایش کیفیت داده", text: "+۱۰ اطمینان داده", apply: (r) => ({ ...r, dataConfidence: clamp(r.dataConfidence + 10) }) },
  { id: "exposure_down", title: "پاکسازی رد مسیر", text: "-۱۰ سطح افشا", apply: (r) => ({ ...r, exposure: clamp(r.exposure - 10) }) },
  { id: "new_card", title: "دریافت کارت جدید", text: "یک کارت اسکن فوری اضافه می‌شود.", apply: (r) => r, cardId: "instant_scan" },
];

const resourceLabels: Record<ResourceKey, string> = {
  cargoHealth: "سلامت محموله",
  time: "زمان مصرف‌شده",
  satelliteEnergy: "انرژی ماهواره",
  exposure: "سطح افشا",
  dataConfidence: "اطمینان داده",
};

export const ScenarioThreeDungeon = ({
  scenarioId,
  nodeId,
  userProfileId,
  onCompletionUiActiveChange,
  onComplete,
}: ScenarioThreeDungeonProps) => {
  const [areaIndex, setAreaIndex] = useState(0);
  const [position, setPosition] = useState(areas[0].startTileId);
  const [revealed, setRevealed] = useState<Set<string>>(
    () => new Set([areas[0].startTileId, "t1-2", "t1-1", "t1-3"])
  );
  const [resources, setResources] = useState<S3Resources>(initialResources);
  const [cards, setCards] = useState<TacticalCard[]>(initialCards);
  const [abilities, setAbilities] = useState<Ability[]>(initialAbilities);
  const [activeChallenge, setActiveChallenge] = useState<ActiveChallenge | null>(null);
  const [upgradeChoices, setUpgradeChoices] = useState<Upgrade[] | null>(null);
  const [safeMarkedTileId, setSafeMarkedTileId] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [statusText, setStatusText] = useState("محموله در ورودی محوطه منتظر دستور است.");
  const [localLog, setLocalLog] = useState<string[]>([]);
  const actionStartedAtRef = useRef(now());

  const area = areas[areaIndex];
  const tileById = useMemo(() => new Map(area.tiles.map((item) => [item.id, item])), [area]);
  const currentTile = tileById.get(position) ?? area.tiles[0];
  const hasCard = (cardId: CardId) => cards.some((card) => card.id === cardId);
  const hasAbility = (abilityId: string) => abilities.some((ability) => ability.id === abilityId && ability.active);

  const logDungeonEvent = (
    actionType: string,
    tileId: string | undefined,
    resourceStateBefore: S3Resources,
    resourceStateAfter: S3Resources,
    extra: Record<string, unknown> = {}
  ) => {
    const elapsedMs = Math.round(now() - actionStartedAtRef.current);
    eventLogger.log({
      type: `s3_${actionType}`,
      scenarioId,
      nodeId,
      userId: userProfileId,
      elapsedMs,
      detail: {
        dungeonId: area.id,
        tileId,
        actionType,
        resourceStateBefore,
        resourceStateAfter,
        elapsedMs,
        currentRound: round,
        dataConfidence: resourceStateAfter.dataConfidence,
        exposure: resourceStateAfter.exposure,
        ...extra,
      },
    });
    actionStartedAtRef.current = now();
  };

  const pushLog = (text: string) => setLocalLog((prev) => [text, ...prev].slice(0, 8));

  const applyResourceDelta = (base: S3Resources, delta: Partial<S3Resources>) => ({
    cargoHealth: clamp(base.cargoHealth + (delta.cargoHealth ?? 0)),
    time: clamp(base.time + (delta.time ?? 0), 0, 999),
    satelliteEnergy: clamp(base.satelliteEnergy + (delta.satelliteEnergy ?? 0)),
    exposure: clamp(base.exposure + (delta.exposure ?? 0)),
    dataConfidence: clamp(base.dataConfidence + (delta.dataConfidence ?? 0)),
  });

  const revealAround = (tileId: string, radius: number) => {
    const center = tileById.get(tileId);
    if (!center) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      area.tiles.forEach((item) => {
        const distance = Math.abs(item.x - center.x) + Math.abs(item.y - center.y);
        if (distance <= radius) next.add(item.id);
      });
      return next;
    });
  };

  const enterArea = (nextAreaIndex: number, nextResources = resources) => {
    const nextArea = areas[nextAreaIndex];
    setAreaIndex(nextAreaIndex);
    setPosition(nextArea.startTileId);
    setRevealed(new Set([nextArea.startTileId]));
    setActiveChallenge(null);
    setUpgradeChoices(null);
    setSafeMarkedTileId(null);
    setRound((prev) => prev + 1);
    setStatusText(`${nextArea.name}: ${nextArea.goal}`);
    pushLog(`ورود به ${nextArea.name}`);
    logDungeonEvent("dungeon_enter", nextArea.startTileId, nextResources, nextResources);
  };

  useEffect(() => {
    onCompletionUiActiveChange?.(false);
    logDungeonEvent("dungeon_enter", area.startTileId, initialResources, initialResources);
    pushLog("ورود به کریدور آغازین");
    revealAround(area.startTileId, 1);
  }, []);

  const neighbors = useMemo(() => {
    if (!currentTile) return [];
    return area.tiles.filter((candidate) => {
      const distance = Math.abs(candidate.x - currentTile.x) + Math.abs(candidate.y - currentTile.y);
      return distance === 1;
    });
  }, [area.tiles, currentTile]);

  const warningText = useMemo(() => {
    if (!hasAbility("early_warning")) return "";
    const threat = neighbors.find((item) => item.type === "threat_air" || item.type === "threat_ground");
    if (!threat) return "";
    return `هشدار زودهنگام: تهدید در خانه مجاور ${threat.id} تشخیص داده شد.`;
  }, [abilities, neighbors]);

  const moveTo = (tileId: string) => {
    const target = tileById.get(tileId);
    if (!target || activeChallenge || upgradeChoices) return;
    if (!neighbors.some((item) => item.id === tileId)) return;

    const before = resources;
    const movementCost: Partial<S3Resources> = target.type === "shortcut"
      ? { time: 4, exposure: 8 }
      : target.type === "safe_cover"
        ? { time: 7, exposure: -3 }
        : { time: 6, exposure: 2 };
    const after = applyResourceDelta(before, movementCost);
    setResources(after);
    setPosition(tileId);
    setRevealed((prev) => new Set(prev).add(tileId));
    setRound((prev) => prev + 1);
    pushLog(`حرکت محموله به ${target.label ?? target.id}`);
    logDungeonEvent("cargo_move", tileId, before, after);

    if (target.type === "intel") {
      const intelAfter = applyResourceDelta(after, { dataConfidence: 8 });
      setResources(intelAfter);
      revealAround(tileId, 1);
      logDungeonEvent("intel_tile", tileId, after, intelAfter);
      setStatusText("نقطه اطلاعاتی کیفیت داده را بهتر کرد و چند خانه اطراف آشکار شد.");
    } else if (target.type === "exit") {
      finishArea(after);
    } else {
      const challenge = safeMarkedTileId === tileId ? null : getChallenge(target.type, tileId);
      if (challenge) {
        setActiveChallenge(challenge);
        pushLog(`چالش فعال شد: ${challenge.title}`);
        logDungeonEvent("threat_enter", tileId, after, after, { challengeId: challenge.id });
      }
    }
  };

  const useCard = (cardId: CardId) => {
    if (!hasCard(cardId) || activeChallenge || upgradeChoices) return;
    const before = resources;
    let after = before;
    let message = "";
    if (cardId === "instant_scan") {
      after = applyResourceDelta(before, { satelliteEnergy: -6, dataConfidence: 4 });
      revealAround(position, 2);
      message = "اسکن فوری اجرا شد و محیط اطراف روشن‌تر شد.";
    }
    if (cardId === "signal_decoy") {
      after = applyResourceDelta(before, { exposure: -18, satelliteEnergy: -4 });
      message = "فریب سیگنالی رد مسیر را کاهش داد.";
    }
    if (cardId === "emergency_cover") {
      after = applyResourceDelta(before, { cargoHealth: 6, exposure: -4 });
      message = "پوشش اضطراری برای تهدید بعدی آماده شد.";
    }
    if (cardId === "route_analysis") {
      after = applyResourceDelta(before, { dataConfidence: 6, time: 3 });
      message = "تحلیل مسیر: مسیر کوتاه‌تر افشا را بالا می‌برد؛ مسیر پوشش امن زمان بیشتری مصرف می‌کند.";
    }
    if (cardId === "data_recovery") {
      after = applyResourceDelta(before, { dataConfidence: 18 });
      message = "بازیابی داده کیفیت تصویر عملیاتی را افزایش داد.";
    }
    setResources(after);
    setCards((prev) => prev.filter((card) => card.id !== cardId));
    setStatusText(message);
    pushLog(message);
    logDungeonEvent("card_use", position, before, after, { cardUsed: cardId });
  };

  const performOrbitalScan = () => {
    if (activeChallenge || upgradeChoices || resources.satelliteEnergy < 5) return;
    const target = neighbors.find((item) => !revealed.has(item.id)) ?? area.tiles.find((item) => !revealed.has(item.id));
    if (!target) return;
    const before = resources;
    const after = applyResourceDelta(before, { satelliteEnergy: -5, dataConfidence: 3, time: 2 });
    setResources(after);
    setRevealed((prev) => new Set(prev).add(target.id));
    setStatusText(`اسکن مداری خانه ${target.id} را آشکار کرد.`);
    pushLog(`اسکن خانه ${target.id}`);
    logDungeonEvent("scan", target.id, before, after);
  };

  const markSafePath = () => {
    if (!hasAbility("emergency_pathfinder") || safeMarkedTileId || activeChallenge || upgradeChoices) return;
    const target = neighbors.find((item) => item.type !== "exit");
    if (!target) return;
    setSafeMarkedTileId(target.id);
    setStatusText(`خانه ${target.id} به‌عنوان مسیر امن موقت علامت‌گذاری شد.`);
    pushLog(`مسیر امن موقت: ${target.id}`);
    logDungeonEvent("ability_use", target.id, resources, resources, { selectedOption: "emergency_pathfinder" });
  };

  const resolveChallenge = (option: ChallengeOption) => {
    if (!activeChallenge) return;
    if (option.cardId && !hasCard(option.cardId)) return;
    const before = resources;
    const filteredEffects =
      activeChallenge.kind === "noise" && hasAbility("noise_filter")
        ? { ...option.effects, dataConfidence: (option.effects.dataConfidence ?? 0) + 8 }
        : option.effects;
    const after = applyResourceDelta(before, filteredEffects);
    setResources(after);
    if (option.cardId) setCards((prev) => prev.filter((card) => card.id !== option.cardId));
    setActiveChallenge(null);
    setStatusText(`چالش حل شد: ${option.text}`);
    pushLog(`انتخاب چالش: ${option.text}`);
    logDungeonEvent("challenge_option", activeChallenge.tileId, before, after, {
      selectedOption: option.id,
      cardUsed: option.cardId,
      challengeId: activeChallenge.id,
    });
    if (after.cargoHealth <= 0 || after.exposure >= 100) {
      onCompletionUiActiveChange?.(true);
      logDungeonEvent("failure", activeChallenge.tileId, before, after, { selectedOption: option.id });
    }
  };

  const finishArea = (currentResources: S3Resources) => {
    pushLog(`${area.name} کامل شد.`);
    logDungeonEvent("dungeon_complete", area.exitTileId, currentResources, currentResources);
    if (areaIndex >= areas.length - 1) {
      onCompletionUiActiveChange?.(true);
      eventLogger.log({
        type: "s3_success",
        scenarioId,
        nodeId,
        userId: userProfileId,
        detail: {
          dungeonId: area.id,
          actionType: "success",
          resourceStateBefore: currentResources,
          resourceStateAfter: currentResources,
          elapsedMs: 0,
          currentRound: round,
          dataConfidence: currentResources.dataConfidence,
          exposure: currentResources.exposure,
        },
      });
      setStatusText("سه محوطه عبور شد. مأموریت کریدور امن با موفقیت ثبت شد.");
      return;
    }

    const contextualUpgrade: Upgrade =
      areaIndex === 0
        ? { id: "orbital_upgrade", title: "تثبیت اسکن مداری", text: "اسکن مداری سطح ۱ فعال می‌ماند.", apply: (r) => r, abilityId: "orbital_scan" }
        : areaIndex === 1
          ? { id: "early_warning", title: "فعال شدن هشدار زودهنگام", text: "تهدیدهای مجاور با هشدار متنی دیده می‌شوند.", apply: (r) => r, abilityId: "early_warning" }
          : { id: "noise_filter", title: "فعال شدن فیلتر اختلال", text: "اثر داده مخدوش کاهش می‌یابد.", apply: (r) => r, abilityId: "noise_filter" };
    setUpgradeChoices([contextualUpgrade, ...baseUpgrades.slice(0, 2)]);
    onCompletionUiActiveChange?.(true);
  };

  const chooseUpgrade = (upgrade: Upgrade) => {
    const before = resources;
    const after = upgrade.apply(before);
    setResources(after);
    if (upgrade.cardId) {
      const template = initialCards.find((card) => card.id === upgrade.cardId);
      if (template) setCards((prev) => [...prev, template]);
    }
    if (upgrade.abilityId) {
      setAbilities((prev) =>
        prev.map((ability) => ability.id === upgrade.abilityId ? { ...ability, active: true } : ability)
      );
    }
    pushLog(`ارتقا انتخاب شد: ${upgrade.title}`);
    logDungeonEvent("upgrade_select", area.exitTileId, before, after, { selectedOption: upgrade.id });
    onCompletionUiActiveChange?.(false);
    enterArea(areaIndex + 1, after);
  };

  const missionFailed = resources.cargoHealth <= 0 || resources.exposure >= 100;
  const missionSucceeded = areaIndex === areas.length - 1 && currentTile?.type === "exit" && !upgradeChoices;

  const renderResource = (key: ResourceKey) => {
    const value = resources[key];
    const danger = key === "cargoHealth" ? value <= 35 : key === "exposure" ? value >= 70 : value <= 25;
    return (
      <div key={key} className={`s3-resource ${danger ? "danger" : ""}`}>
        <span>{resourceLabels[key]}</span>
        <strong>{value}</strong>
        <i><em style={{ width: `${key === "time" ? Math.min(value, 100) : value}%` }} /></i>
      </div>
    );
  };

  return (
    <div className="s3-dungeon" dir="rtl">
      <header className="s3-topbar">
        <div>
          <span>سناریو ۳ — کریدور امن</span>
          <h2>{area.name}</h2>
          <p>{area.goal}</p>
        </div>
        <div className="s3-mission-state">
          <strong>محوطه {areaIndex + 1} از {areas.length}</strong>
          <span>راند {round}</span>
          <span>{area.rewardHint}</span>
        </div>
      </header>

      <main className="s3-layout">
        <aside className="s3-panel s3-status-panel">
          <div className="s3-panel-head">
            <img src={scenario3Assets.friendlySatellite} alt="" />
            <div>
              <h3>وضعیت ماهواره‌ای</h3>
              <span>منابع اصلی همیشه فعال هستند.</span>
            </div>
          </div>
          <div className="s3-resource-list">
            {(["cargoHealth", "time", "satelliteEnergy", "exposure", "dataConfidence"] as ResourceKey[]).map(renderResource)}
          </div>
          <div className="s3-abilities">
            <h3>قابلیت‌های دائمی</h3>
            {abilities.map((ability) => (
              <button
                key={ability.id}
                type="button"
                className={`s3-ability ${ability.active ? "active" : "locked"}`}
                disabled={!ability.active || (ability.id !== "orbital_scan" && ability.id !== "emergency_pathfinder")}
                onClick={() => ability.id === "orbital_scan" ? performOrbitalScan() : ability.id === "emergency_pathfinder" ? markSafePath() : undefined}
              >
                <strong>{ability.title}</strong>
                <span>{ability.text}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="s3-map-shell" style={{ backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.74)), url(${scenario3Assets.dungeonBackground})` }}>
          <div className="s3-map-header">
            <strong>هدف فعلی: رسیدن محموله به خروجی</strong>
            <button type="button" onClick={performOrbitalScan} disabled={resources.satelliteEnergy < 5 || Boolean(activeChallenge || upgradeChoices)}>
              اسکن مداری
            </button>
          </div>
          {warningText && <div className="s3-warning">{warningText}</div>}
          <div className="s3-grid" style={{ gridTemplateColumns: `repeat(${area.width}, 72px)`, gridTemplateRows: `repeat(${area.height}, 58px)` }}>
            {area.tiles.map((item) => {
              const isRevealed = revealed.has(item.id);
              const isCargo = item.id === position;
              const isNeighbor = neighbors.some((neighbor) => neighbor.id === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  className={[
                    "s3-tile",
                    `type-${isRevealed ? item.type : "unknown"}`,
                    isCargo ? "cargo" : "",
                    isNeighbor ? "neighbor" : "",
                    safeMarkedTileId === item.id ? "safe-marked" : "",
                  ].join(" ")}
                  style={{ gridColumn: item.x + 1, gridRow: item.y + 1 }}
                  onClick={() => moveTo(item.id)}
                  disabled={!isNeighbor || Boolean(activeChallenge || upgradeChoices || missionFailed || missionSucceeded)}
                >
                  <span className="s3-tile-label">{isRevealed ? item.label ?? item.type : "unknown"}</span>
                  {isRevealed && item.type === "threat_air" && <img src={scenario3Assets.enemyDrone} alt="" className="s3-threat-icon" />}
                  {isCargo && <img src={scenario3Assets.cargo} alt="محموله" className="s3-cargo-icon" />}
                </button>
              );
            })}
          </div>
        </section>

        <aside className="s3-panel s3-decision-panel">
          <h3>پنل تصمیم</h3>
          {activeChallenge ? (
            <div className="s3-challenge">
              <strong>{activeChallenge.title}</strong>
              <p>{activeChallenge.description}</p>
              {activeChallenge.kind === "air" && <img src={scenario3Assets.enemyDrone} alt="" />}
              <div className="s3-challenge-options">
                {activeChallenge.options.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    disabled={Boolean(option.cardId && !hasCard(option.cardId))}
                    onClick={() => resolveChallenge(option)}
                  >
                    <span>{option.text}</span>
                    {option.cardId && <em>{hasCard(option.cardId) ? "مصرف کارت" : "کارت در دست نیست"}</em>}
                  </button>
                ))}
              </div>
            </div>
          ) : missionFailed ? (
            <div className="s3-terminal-state critical">
              <strong>مأموریت شکست خورد</strong>
              <p>سلامت محموله یا سطح افشا به آستانه بحرانی رسید.</p>
              <button type="button" onClick={onComplete}>ثبت پایان سناریو</button>
            </div>
          ) : missionSucceeded ? (
            <div className="s3-terminal-state success">
              <strong>عبور موفق</strong>
              <p>محموله از سه محوطه اولیه عبور کرد و اسکلت سناریو کامل شد.</p>
              <button type="button" onClick={onComplete}>پایان سناریو</button>
            </div>
          ) : (
            <div className="s3-status-message">
              <strong>وضعیت فعلی</strong>
              <p>{statusText}</p>
              <span>{warningText || "چالش فعالی وجود ندارد. یک خانه مجاور را انتخاب کنید یا اسکن انجام دهید."}</span>
            </div>
          )}
          <div className="s3-event-log">
            <h3>لاگ تصمیم‌ها</h3>
            {localLog.map((item, index) => <p key={`${item}-${index}`}>{item}</p>)}
          </div>
        </aside>
      </main>

      <section className="s3-card-hand">
        {cards.map((card) => (
          <button
            key={`${card.id}-${card.title}-${cards.indexOf(card)}`}
            type="button"
            className="s3-card"
            style={{ backgroundImage: `url(${scenario3Assets.cardFrame})` }}
            onClick={() => useCard(card.id)}
            disabled={Boolean(activeChallenge || upgradeChoices || missionFailed || missionSucceeded)}
          >
            <strong>{card.title}</strong>
            <span>{card.text}</span>
          </button>
        ))}
      </section>

      {upgradeChoices && (
        <div className="s3-upgrade-backdrop">
          <div className="s3-upgrade-modal">
            <h3>ارتقای پس از عبور</h3>
            <p>یکی از گزینه‌ها را انتخاب کنید تا محوطه بعدی آغاز شود.</p>
            <div className="s3-upgrade-grid">
              {upgradeChoices.map((upgrade) => (
                <button
                  key={upgrade.id}
                  type="button"
                  className="s3-upgrade-card"
                  style={{ backgroundImage: `url(${scenario3Assets.cardFrame})` }}
                  onClick={() => chooseUpgrade(upgrade)}
                >
                  <strong>{upgrade.title}</strong>
                  <span>{upgrade.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
