import express from "express";
import client from 'prom-client'

const router = express.Router();

router.get("/", async (req, res) => {
  const metrics = await client.register.metrics();
  res.setHeader("Content-Type", client.register.contentType);
  res.end(metrics);
});

export default router;