import { Router } from "express";
import { publicList,publicSnapshot } from "../controllers/matchController.js";
const r=Router();
r.get("/",publicList);
r.get("/:matchId",publicSnapshot);
export default r;
