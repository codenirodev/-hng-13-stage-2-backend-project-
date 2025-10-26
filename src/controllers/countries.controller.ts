import type { Response, Request, NextFunction } from "express";
import axios, { AxiosError } from "axios";
import fs from "fs";
import path from "path";
import prisma from "../libs/prisma";
import logger from "../libs/logger";
import {
  Country,
  CountryInsert,
  ExchangeRates,
} from "../types/countries.types";
import { generateEstimatedGDP, generateSummaryImage } from "../libs/utils";

const countriesApiUrl =
  "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies";
const exchangeRateApiUrl = "https://open.er-api.com/v6/latest/USD";

class CountriesController {
  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const totalCountries = await prisma.country.count();

      const lastRefreshed = await prisma.country.findFirst({
        orderBy: { last_refreshed_at: "desc" },
        select: { last_refreshed_at: true },
      });
      res.status(200).json({
        total_countries: totalCountries,
        last_refreshed: lastRefreshed?.last_refreshed_at,
      });
    } catch (error) {
      logger.error(error);
      next(error);
    }
  }

  async getImageSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const imagePath = path.join(process.cwd(), "cache", "summary.png");

      // Check if image exists
      if (!fs.existsSync(imagePath)) {
        return res.status(404).json({
          error: "Summary image not found",
        });
      }

      // Set proper headers for image
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

      // Send the image file
      res.sendFile(imagePath);
    } catch (error) {
      console.error("Error serving summary image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async refreshCountries(req: Request, res: Response, next: NextFunction) {
    try {
      const countries: Country[] = (await axios.get(countriesApiUrl)).data;

      const exchangeRates: ExchangeRates = (await axios.get(exchangeRateApiUrl))
        .data.rates;

      const formattedInputCountries: CountryInsert[] = [];
      countries.forEach((country) => {
        const formatted: CountryInsert = {
          name: country.name,
          capital: country.capital,
          region: country.region,
          population: country.population,
          flag_url: country.flag,
        } as CountryInsert;

        if (country?.currencies?.length === 0 || !country?.currencies) {
          formatted.currency_code = null;
          formatted.exchange_rate = null;
          formatted.estimated_gdp = 0;
        } else {
          const countryCurrencyCode = country?.currencies?.[0]?.code;
          if (
            countryCurrencyCode &&
            exchangeRates[countryCurrencyCode] !== undefined
          ) {
            formatted.exchange_rate = exchangeRates[countryCurrencyCode];
            formatted.currency_code = countryCurrencyCode;
            formatted.estimated_gdp = generateEstimatedGDP(
              country.population,
              formatted.exchange_rate,
            );
          } else {
            formatted.currency_code = countryCurrencyCode || null;
            formatted.exchange_rate = null;
            formatted.estimated_gdp = null;
          }
        }

        formattedInputCountries.push(formatted);
      });

      for (const country of formattedInputCountries) {
        await prisma.country.upsert({
          where: { name: country.name },
          update: country,
          create: country,
        });
      }
      await generateSummaryImage();
      res.status(200).json({ message: "Countries refreshed successfully" });
    } catch (error) {
      if (error instanceof AxiosError) {
        res.status(503).json({
          error: "External data source unavailable",
          details: "Could not fetch data from restcountries",
        });
      }
      logger.error(error);
      next(error);
    }
  }
  async getCountries(req: Request, res: Response) {
    try {
      const { region, sort, currency } = req.query;

      const where: any = {};
      if (region) {
        where.region = region;
      }
      if (currency) {
        where.currency_code = currency;
      }

      const orderBy: any = {};
      if (sort === "gdp_desc") {
        orderBy.estimated_gdp = sort === "gdp_desc" ? "asc" : "desc";
      }

      const countries = await prisma.country.findMany({ where, orderBy });
      res.status(200).json(countries);
    } catch (error) {
      logger.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const name = req.params.name as string;
      const country = await prisma.country.findFirst({
        where: {
          name: name,
        },
      });

      if (!country) {
        return res
          .status(404)
          .json({ success: false, error: "County not found!" });
      }

      res.status(200).json(country);
    } catch (error) {
      logger.error(error);
    }
  }

  async deleteCountry(req: Request, res: Response, next: NextFunction) {
    try {
      const name = req.params.name as string;
      const existingCountry = await prisma.country.findFirst({
        where: { name },
      });

      if (!existingCountry) {
        return res.status(404).json({ error: "Country not found" });
      }

      await prisma.country.delete({
        where: {
          id: existingCountry.id,
        },
      });

      res.status(204).json({ message: "Country deleted successfully" });
    } catch (error) {}
  }
}

export const countriesController = new CountriesController();
