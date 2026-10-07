export type ApprovalAffirmation = {
  emoji: string;
  message: string;
};

export const APPROVAL_AFFIRMATIONS: ApprovalAffirmation[] = [
  { emoji: "🎉", message: "You crushed it — this creative is ready to ship!" },
  { emoji: "⭐", message: "Roger & Todd said yes. That's the dream team stamp of approval." },
  { emoji: "🚀", message: "Fully approved! Q4 is one asset closer to greatness." },
  { emoji: "💪", message: "Boom. Dual sign-off unlocked. Keep the momentum going." },
  { emoji: "✨", message: "Chef's kiss. Roger and Todd are aligned — beautiful work." },
  { emoji: "🏆", message: "Champions approve champions. Well done." },
  { emoji: "🎯", message: "Bullseye. Both approvers signed — gold star creative." },
  { emoji: "🌟", message: "Shining moment — Roger & Todd are all in." },
  { emoji: "🔥", message: "That creative is on fire. Fully approved!" },
  { emoji: "💫", message: "Magic happens when Roger and Todd agree." },
  { emoji: "🙌", message: "High five! Full sign-off achieved." },
  { emoji: "🎊", message: "Celebration time — this asset is good to go!" },
  { emoji: "🦄", message: "Rare unicorn status: Roger AND Todd approved." },
  { emoji: "🌈", message: "Roger pink, Todd teal, creative sealed — perfection." },
  { emoji: "👏", message: "Standing ovation. Dual approval complete." },
  { emoji: "🥳", message: "Roger and Todd are vibing. This one's a winner." },
  { emoji: "💎", message: "Gem of a creative — fully signed off." },
  { emoji: "🎨", message: "Art approved by the masters. Ship it!" },
];

export function pickRandomAffirmation(): ApprovalAffirmation {
  return APPROVAL_AFFIRMATIONS[Math.floor(Math.random() * APPROVAL_AFFIRMATIONS.length)];
}

export const CAMPAIGN_COMPLETE_AFFIRMATIONS: ApprovalAffirmation[] = [
  { emoji: "🏁", message: "Campaign complete! Roger and Todd signed off on every asset." },
  { emoji: "👑", message: "You cleared the whole campaign — absolute legend status." },
  { emoji: "🎆", message: "Full campaign sign-off! Q4 creative is locked and loaded." },
  { emoji: "🍾", message: "Pop the confetti — this campaign is fully approved." },
  { emoji: "🚀", message: "Mission accomplished. Every asset has the Roger & Todd seal." },
  { emoji: "💫", message: "What a run. The entire campaign got the double thumbs up." },
  { emoji: "🌟", message: "Star performer! You reviewed every asset to completion." },
  { emoji: "🎯", message: "Clean sweep — 100% approved across the board." },
  { emoji: "🥇", message: "Gold medal review session. Campaign fully signed off." },
  { emoji: "🦄", message: "Unicorn campaign — Roger AND Todd on every single asset." },
];

export function pickRandomCampaignAffirmation(): ApprovalAffirmation {
  return CAMPAIGN_COMPLETE_AFFIRMATIONS[
    Math.floor(Math.random() * CAMPAIGN_COMPLETE_AFFIRMATIONS.length)
  ];
}
