import type { NextApiRequest, NextApiResponse } from "next";
import axios from "@/lib/axios";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

  try {
    const response = await axios.get(`${backendUrl}/me`, {
      headers: {
        "Content-Type": "application/json",
        Cookie: req.headers.cookie || "",
      },
      withCredentials: true,
    });

    res.status(response.status).json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(
      error.response?.data || {
        error: "Internal Server Error",
      }
    );
  }
}
