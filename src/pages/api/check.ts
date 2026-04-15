import type { NextApiRequest, NextApiResponse } from "next";

import { checkFoodByQuery } from "../../lib/check-food";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const condition = typeof req.query.condition === "string" ? req.query.condition : "";
  const dayStage = typeof req.query.dayStage === "string" ? req.query.dayStage : "";
  const query = typeof req.query.query === "string" ? req.query.query : "";

  if (!condition || !dayStage || !query) {
    return res.status(400).json({
      error: "Missing required query parameters",
      required: ["condition", "dayStage", "query"],
    });
  }

  try {
    const result = await checkFoodByQuery({
      conditionSlug: condition,
      dayStageSlug: dayStage,
      query,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Condition not found" || error.message === "Day stage not found") {
        return res.status(404).json({ error: error.message });
      }
    }

    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
