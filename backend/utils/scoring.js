export function calculateMatchScore(profile, opportunity) {
  let score = 0;

  /* ✅ DEGREE MATCH */
  if (opportunity.degree.includes(profile.degree)) {
    score += 35;
  } else {
    score -= 10;
  }

  /* ✅ INTEREST MATCH */
  const interestMatches = opportunity.fields.filter(field =>
    profile.interests.some(interest =>
      field.toLowerCase().includes(interest.toLowerCase())
    )
  ).length;

  score += interestMatches * 20;

  /* ✅ SKILL MATCH */
  const skillMatches = opportunity.skills.filter(skill =>
    profile.skills.some(userSkill =>
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  ).length;

  score += skillMatches * 10;

  if (skillMatches >= 2) {
    score += 10;
  }

  /* ✅ DEADLINE URGENCY */
  const daysLeft = getDaysUntil(opportunity.deadline);

  if (daysLeft <= 7) {
    score += 10;
  } else if (daysLeft <= 30) {
    score += 5;
  }

  return Math.max(0, Math.min(score, 100));
}

export function getEligibilityConfidence(score) {
  if (score >= 75) return "High";
  if (score >= 45) return "Moderate";
  return "Low";
}

export function getRecommendationReasons(profile, opportunity) {
  const reasons = [];

  if (opportunity.degree.includes(profile.degree)) {
    reasons.push("Matches your degree");
  }

  const interestMatch = opportunity.fields.some(field =>
    profile.interests.some(interest =>
      field.toLowerCase().includes(interest.toLowerCase())
    )
  );

  if (interestMatch) {
    reasons.push("Aligns with your interests");
  }

  const skillMatch = opportunity.skills.some(skill =>
    profile.skills.some(userSkill =>
      skill.toLowerCase().includes(userSkill.toLowerCase())
    )
  );

  if (skillMatch) {
    reasons.push("Relevant to your skills");
  }

  const daysLeft = getDaysUntil(opportunity.deadline);

  if (daysLeft < 10) {
    reasons.push("Deadline approaching soon");
  }

  return reasons;
}

export function getDeadlineUrgency(deadline) {
  const daysLeft = getDaysUntil(deadline);

  if (daysLeft <= 7) return "Closing Soon";
  if (daysLeft <= 30) return "Upcoming";
  return "Safe";
}

function getDaysUntil(deadline) {
  const today = new Date();
  const end = new Date(deadline);

  return Math.ceil(
    (end - today) / (1000 * 60 * 60 * 24)
  );
}