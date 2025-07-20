import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

  // Check authentication
  const authResponse = await fetch(`${backendUrl}/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      cookie: req.headers.cookie || "",
    },
    credentials: "include",
  });
  if (authResponse.status === 401) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  if (req.method === "GET") {
    // List all teams
    const response = await fetch(`${backendUrl}/teams`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        cookie: req.headers.cookie || "",
      },
      credentials: "include",
    });
    const data = await response.json();
    res.status(response.status).json(data);
    return;
  }
  if (req.method === "POST") {
    // Create a team
    const response = await fetch(`${backendUrl}/teams`, {
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
    return;
  }
  return res.status(405).json({ error: "Method not allowed" });
} 