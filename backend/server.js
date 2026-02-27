import express from "express";
import cors from "cors";
import dataset from "./data/opportunities.json" with { type: "json" };

import {
  calculateMatchScore,
  getEligibilityConfidence,
  getRecommendationReasons,
  getDeadlineUrgency
} from "./utils/scoring.js";

import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";

const app = express();
app.use(cors());
app.use(express.json());

/* ✅ BEDROCK CLIENT */
const bedrock = new BedrockRuntimeClient({
  region: "us-east-1"
});

/* ✅ BEDROCK HELPER */
async function callBedrock(query) {

  const command = new InvokeModelCommand({
    modelId: "amazon.titan-text-lite-v1",
    body: JSON.stringify({
      inputText: query
    }),
    contentType: "application/json"
  });

  const response = await bedrock.send(command);

  const decoded = JSON.parse(
    new TextDecoder().decode(response.body)
  );

  return decoded;
}
/* ✅ AI ASSISTANT */
app.post("/assistant", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({
      error: "Query missing"
    });
  }

  try {
    const aiResponse = await callBedrock(query);

    const results = dataset.filter(item =>
      aiResponse.keywords.some(keyword =>
        item.title.toLowerCase().includes(keyword.toLowerCase()) ||
        item.fields.some(field =>
          field.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    );

    res.json(results);

  } catch (error) {
    console.error("🔥 BEDROCK FULL ERROR:");
console.error(error);
console.error("🔥 ERROR DETAILS:");
console.error(JSON.stringify(error, null, 2));

    res.status(500).json({
      error: "AI assistant failed"
    });
  }
});

/* ✅ GET ALL OPPORTUNITIES */
app.get("/opportunities", (req, res) => {
  res.json(dataset);
});

/* ✅ MATCH OPPORTUNITIES */
app.post("/match", (req, res) => {
  const profile = {
    degree: req.body.degree,
    year: req.body.year,
    skills: req.body.skills || [],
    interests: req.body.interests || []
  };

  if (!profile.degree || !profile.year) {
    return res.status(400).json({
      error: "Profile data missing"
    });
  }

  const scored = dataset.map(item => {
    const score = calculateMatchScore(profile, item);
    const reasons = getRecommendationReasons(profile, item);

    return {
      ...item,
      matchScore: score,
      confidence: getEligibilityConfidence(score),
      reasons: reasons,
      urgency: getDeadlineUrgency(item.deadline)
    };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  res.json(scored);
});

/* ✅ DEADLINES */
app.get("/deadlines", (req, res) => {
  const sorted = [...dataset].sort(
    (a, b) => new Date(a.deadline) - new Date(b.deadline)
  );

  res.json(sorted);
});

/* ✅ SEARCH */
app.get("/search", (req, res) => {
  const q = req.query.q?.toLowerCase();

  if (!q) {
    return res.status(400).json({
      error: "Search query missing"
    });
  }

  const results = dataset.filter(item => {
    const titleMatch = item.title.toLowerCase().includes(q);

    const fieldMatch = item.fields.some(field =>
      field.toLowerCase().includes(q)
    );

    const skillMatch = item.skills.some(skill =>
      skill.toLowerCase().includes(q)
    );

    const typeMatch = item.type.toLowerCase().includes(q);

    return titleMatch || fieldMatch || skillMatch || typeMatch;
  });

  res.json(results);
});

/* ✅ SERVER START */
app.listen(5000, () => {
  console.log("Backend running on port 5000 🚀");
});