import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  const { id } = req.query;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
  
  const response = await fetch(`${backendUrl}/challenges/${id}/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.cookie || "",
    },
    body: JSON.stringify(req.body),
    credentials: "include",
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
} 