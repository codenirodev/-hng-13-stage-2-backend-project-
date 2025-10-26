import { Prisma } from "../../generated/prisma/client";
export type Country = {
  name: string;
  capital: string;
  region: string;
  population: number;
  currencies: Currency[];
  flag: string;
};

export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type CountryInsert = Prisma.CountryCreateInput;

export type ExchangeRates = {
  [code: string]: number;
};
