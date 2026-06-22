import type { WasteAiClass } from "./waste-ai-taxonomy";

/** Map MobileNet ImageNet labels → taksonomi sampah PACUL. */
const RULES: Array<{ class: WasteAiClass; patterns: RegExp[] }> = [
  {
    class: "plastic_pet",
    patterns: [
      /water bottle/i,
      /pop bottle/i,
      /plastic bag/i,
      /lotion/i,
      /sunscreen/i,
      /soap dispenser/i,
      /pill bottle/i,
      /syringe/i,
      /nipple/i,
      /grocery bag/i,
    ],
  },
  {
    class: "plastic_other",
    patterns: [/bucket/i, /rain barrel/i, /shower cap/i, /plastic/i, /cellular/i, /remote/i, /mouse/i, /keyboard/i],
  },
  {
    class: "paper_cardboard",
    patterns: [
      /envelope/i,
      /toilet tissue/i,
      /paper towel/i,
      /carton/i,
      /book/i,
      /comic book/i,
      /notebook/i,
      /menu/i,
      /cardboard/i,
      /newspaper/i,
      /packet/i,
      /shopping bag/i,
    ],
  },
  {
    class: "metal_can",
    patterns: [/beer/i, /can opener/i, /tin/i, /soda/i, /pop can/i, /oil filter/i, /metal/i, /aluminum/i],
  },
  {
    class: "glass",
    patterns: [/wine bottle/i, /beer bottle/i, /goblet/i, /vase/i, /beaker/i, /hourglass/i, /glass/i, /pitcher/i],
  },
  {
    class: "electronics",
    patterns: [
      /cellular/i,
      /laptop/i,
      /keyboard/i,
      /mouse/i,
      /modem/i,
      /monitor/i,
      /television/i,
      /remote/i,
      /hard disc/i,
      /microphone/i,
      /camera/i,
      /printer/i,
      /radio/i,
      /screen/i,
      /hand-held computer/i,
    ],
  },
  {
    class: "organic",
    patterns: [
      /banana/i,
      /apple/i,
      /orange/i,
      /lemon/i,
      /fig/i,
      /mushroom/i,
      /cucumber/i,
      /broccoli/i,
      /cauliflower/i,
      /head cabbage/i,
      /pineapple/i,
      /strawberry/i,
      /food/i,
      /meat/i,
      /bread/i,
      /coffee/i,
      /potato/i,
      /corn/i,
      /grocery/i,
    ],
  },
  {
    class: "textile",
    patterns: [/jean/i, /jersey/i, /sweater/i, /sock/i, /shoe/i, /handbag/i, /backpack/i, /diaper/i, /towel/i, /quilt/i],
  },
];

export function mapImageNetPredictions(
  predictions: Array<{ className: string; probability: number }>,
): Map<WasteAiClass, { score: number; evidence: string }> {
  const scores = new Map<WasteAiClass, { score: number; evidence: string }>();

  for (const pred of predictions) {
    for (const rule of RULES) {
      if (rule.patterns.some((pattern) => pattern.test(pred.className))) {
        const current = scores.get(rule.class);
        const nextScore = (current?.score ?? 0) + pred.probability;
        scores.set(rule.class, {
          score: nextScore,
          evidence: current?.evidence ?? pred.className,
        });
      }
    }
  }

  return scores;
}
