import { Router } from "express";
import { countriesController } from "../controllers/countries.controller";

const router = Router();

router.post("/countries/refresh", countriesController.refreshCountries);
router.get("/status", countriesController.getStatus);
router.get("/countries", countriesController.getCountries);
router.get("/countries/image", countriesController.getImageSummary);
router.get("/countries/:name", countriesController.getCountry);
router.delete("/countries/:name", countriesController.deleteCountry);
export default router;
