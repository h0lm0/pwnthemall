import type { NextApiRequest, NextApiResponse } from "next";
import axios from "@/lib/axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

  try {
    // Check authentication
    const authResponse = await axios.get(`${backendUrl}/me`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },
      withCredentials: true,
    });

    if (authResponse.status === 401) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (req.method === "GET") {
      // List all teams
      const response = await axios.get(`${backendUrl}/teams`, {
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.cookie || "",
        },
        withCredentials: true,
      });
      res.status(response.status).json(response.data);
      return;
    }

    if (req.method === "POST") {
      // Create a team
      const response = await axios.post(`${backendUrl}/teams`, req.body, {
        headers: {
          "Content-Type": "application/json",
          Cookie: req.headers.cookie || "",
        },
        withCredentials: true,
      });
      res.status(response.status).json(response.data);
      return;
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    // Handle errors from Axios requests
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        error: "Internal Server Error",
      }
    );
  }
}
