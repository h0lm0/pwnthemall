import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  const { category } = req.query;
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
  
  const response = await fetch(`${backendUrl}/challenges/category/${category}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.cookie || "",
    },
    credentials: "include",
  });
  
  const data = await response.json();
  res.status(response.status).json(data);
} 