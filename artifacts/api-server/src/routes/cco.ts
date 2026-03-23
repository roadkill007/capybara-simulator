import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";

// --- In-memory CCO store ---
interface CCOState {
  id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  state: string;
  data: Record<string, unknown>;
  updatedAt: string;
}

const ccoStore = new Map<string, CCOState>();

// --- API key auth middleware ---
function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = process.env["CCO_API_KEY"];

  // If no key is configured, skip auth (dev mode)
  if (!apiKey) {
    next();
    return;
  }

  const provided = req.headers["x-api-key"];
  if (!provided || provided !== apiKey) {
    res.status(401).json({ error: "Unauthorized: invalid or missing API key" });
    return;
  }
  next();
}

const router: IRouter = Router();

// GET /api/cco — list all CCOs
router.get("/cco", (_req, res) => {
  res.json({
    count: ccoStore.size,
    objects: Array.from(ccoStore.values()),
  });
});

// GET /api/cco/:id — get a single CCO
router.get("/cco/:id", (req, res) => {
  const obj = ccoStore.get(req.params.id);
  if (!obj) {
    res.status(404).json({ error: `CCO '${req.params.id}' not found` });
    return;
  }
  res.json(obj);
});

// POST /api/cco/:id — create or update a CCO (auth required)
router.post("/cco/:id", requireApiKey, (req, res) => {
  const { id } = req.params;
  const body = req.body as Partial<CCOState>;

  const existing = ccoStore.get(id);
  const updated: CCOState = {
    id,
    position: body.position ?? existing?.position ?? { x: 0, y: 0, z: 0 },
    rotation: body.rotation ?? existing?.rotation ?? { x: 0, y: 0, z: 0 },
    state: body.state ?? existing?.state ?? "idle",
    data: body.data ?? existing?.data ?? {},
    updatedAt: new Date().toISOString(),
  };

  ccoStore.set(id, updated);
  res.status(200).json({ success: true, object: updated });
});

// DELETE /api/cco/:id — remove a CCO (auth required)
router.delete("/cco/:id", requireApiKey, (req, res) => {
  const { id } = req.params;
  if (!ccoStore.has(id)) {
    res.status(404).json({ error: `CCO '${id}' not found` });
    return;
  }
  ccoStore.delete(id);
  res.json({ success: true, deleted: id });
});

// DELETE /api/cco — clear all CCOs (auth required)
router.delete("/cco", requireApiKey, (_req, res) => {
  const count = ccoStore.size;
  ccoStore.clear();
  res.json({ success: true, deleted: count });
});

export default router;
