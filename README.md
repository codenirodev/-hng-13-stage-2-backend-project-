# Country Currency & Exchange API

A RESTful API that fetches country data from external APIs, stores it in a MySQL database, and provides CRUD operations with currency exchange rate calculations.

## Features

- Fetch country data from REST Countries API
- Retrieve exchange rates from Open Exchange Rates API
- Calculate estimated GDP using population and exchange rates
- Generate summary images with top countries by GDP
- Support for filtering and sorting countries
- Comprehensive error handling and validation
- MySQL database with automatic schema initialization

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- pnpm package manager

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd stage-2-project
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env` file

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=country_currency_db

# API Configuration
COUNTRIES_API_URL=https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies
EXCHANGE_RATE_API_URL=https://open.er-api.com/v6/latest/USD

# Cache Configuration
CACHE_DIR=cache
IMAGE_FILENAME=summary.png
```

## Database Setup

1. Create a MySQL database:
```sql
CREATE DATABASE country_currency_db;
```

2. The application will automatically create the required tables on first run:
   - `countries` - Stores country data
   - `system_info` - Tracks refresh timestamps

## Running the Application

### Development
```bash
pnpm run dev
```

### Production
```bash
pnpm run build
pnpm start
```

The API will be available at `http://localhost:3000`

## API Endpoints

### 1. Refresh Countries Data

**POST** `/countries/refresh`

Fetches country data and exchange rates from external APIs and caches them in the database.

**Response:**
```json
{
  "message": "Countries data refreshed successfully",
  "updated": 25,
  "inserted": 225,
  "total": 250
}
```

**Error Responses:**
```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from Countries API"
}
```

### 2. Get All Countries

**GET** `/countries`

Retrieves all countries from the database with optional filtering and sorting.

**Query Parameters:**
- `region` - Filter by region (e.g., `Africa`, `Europe`)
- `currency` - Filter by currency code (e.g., `NGN`, `USD`)
- `sort` - Sort results:
  - `name_asc` - Sort by name (A-Z)
  - `name_desc` - Sort by name (Z-A)
  - `population_asc` - Sort by population (lowest first)
  - `population_desc` - Sort by population (highest first)
  - `gdp_asc` - Sort by estimated GDP (lowest first)
  - `gdp_desc` - Sort by estimated GDP (highest first)

**Examples:**
```
GET /countries?region=Africa
GET /countries?currency=NGN
GET /countries?sort=gdp_desc
GET /countries?region=Africa&sort=population_desc
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Nigeria",
    "capital": "Abuja",
    "region": "Africa",
    "population": 206139589,
    "currency_code": "NGN",
    "exchange_rate": 1600.23,
    "estimated_gdp": 25767448125.2,
    "flag_url": "https://flagcdn.com/ng.svg",
    "last_refreshed_at": "2025-01-15T18:00:00Z"
  },
  {
    "id": 2,
    "name": "Ghana",
    "capital": "Accra",
    "region": "Africa",
    "population": 31072940,
    "currency_code": "GHS",
    "exchange_rate": 15.34,
    "estimated_gdp": 3029834520.6,
    "flag_url": "https://flagcdn.com/gh.svg",
    "last_refreshed_at": "2025-01-15T18:00:00Z"
  }
]
```

### 3. Get Single Country

**GET** `/countries/:name`

Retrieves a single country by name (case-insensitive).

**Example:**
```
GET /countries/Nigeria
```

**Response:**
```json
{
  "id": 1,
  "name": "Nigeria",
  "capital": "Abuja",
  "region": "Africa",
  "population": 206139589,
  "currency_code": "NGN",
  "exchange_rate": 1600.23,
  "estimated_gdp": 25767448125.2,
  "flag_url": "https://flagcdn.com/ng.svg",
  "last_refreshed_at": "2025-01-15T18:00:00Z"
}
```

**Error Response:**
```json
{
  "error": "Country not found"
}
```

### 4. Delete Country

**DELETE** `/countries/:name`

Deletes a country record by name (case-insensitive).

**Example:**
```
DELETE /countries/Nigeria
```

**Response:**
```json
{
  "message": "Country deleted successfully"
}
```

**Error Response:**
```json
{
  "error": "Country not found"
}
```

### 5. Get System Status

**GET** `/status`

Returns the total number of countries and last refresh timestamp.

**Response:**
```json
{
  "total_countries": 250,
  "last_refreshed_at": "2025-01-15T18:00:00Z"
}
```

### 6. Get Summary Image

**GET** `/countries/image`

Serves the generated summary image containing:
- Total number of countries
- Top 5 countries by estimated GDP
- Last refresh timestamp

**Response:** PNG image file

**Error Response:**
```json
{
  "error": "Summary image not found"
}
```

## Data Processing Logic

### Currency Handling
- If a country has multiple currencies, only the first currency code is stored
- If no currencies exist:
  - `currency_code` is set to `null`
  - `exchange_rate` is set to `null`
  - `estimated_gdp` is set to `0`
- If currency is not found in exchange rates API:
  - `exchange_rate` is set to `null`
  - `estimated_gdp` is set to `null`

### GDP Calculation
```
estimated_gdp = population × random(1000-2000) ÷ exchange_rate
```

### Update vs Insert Logic
- Countries are matched by name (case-insensitive)
- Existing countries are updated with new data
- New countries are inserted
- Random GDP multiplier is regenerated on each refresh

## Error Handling

The API returns consistent JSON error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": {
    "currency_code": "is required"
  }
}
```

### 404 Not Found
```json
{
  "error": "Country not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "error": "External data source unavailable",
  "details": "Could not fetch data from Exchange Rates API"
}
```

## Database Schema

### Countries Table
```sql
CREATE TABLE countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  capital VARCHAR(255),
  region VARCHAR(255),
  population BIGINT NOT NULL,
  currency_code VARCHAR(10),
  exchange_rate DECIMAL(15, 6),
  estimated_gdp DECIMAL(20, 2),
  flag_url TEXT,
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### System Info Table
```sql
CREATE TABLE system_info (
  id INT PRIMARY KEY DEFAULT 1,
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  total_countries INT DEFAULT 0
);
```

## Dependencies

### Production Dependencies
- `express` - Web framework
- `mysql2` - MySQL database driver
- `axios` - HTTP client for external APIs
- `canvas` - Image generation
- `dotenv` - Environment configuration
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - Rate limiting
- `pino` - Logging

### Development Dependencies
- `typescript` - Type checking
- `ts-node-dev` - Development server
- `@types/*` - Type definitions

## Deployment

### Railway (Recommended)
1. Create a Railway account
2. Connect your GitHub repository
3. Add environment variables in Railway dashboard
4. Deploy automatically on push

### Heroku
1. Install Heroku CLI
2. Create Heroku app: `heroku create your-app-name`
3. Add MySQL addon: `heroku addons:create jawsdb:kitefin`
4. Set environment variables: `heroku config:set NODE_ENV=production`
5. Deploy: `git push heroku main`

### AWS/DigitalOcean
1. Set up MySQL database
2. Configure environment variables
3. Build and deploy using PM2 or similar process manager

## Testing

Run the test suite:
```bash
pnpm test
```

Test individual endpoints:
```bash
# Refresh countries data
curl -X POST http://localhost:3000/countries/refresh

# Get all countries
curl http://localhost:3000/countries

# Get country by name
curl http://localhost:3000/countries/Nigeria

# Get status
curl http://localhost:3000/status
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the ISC License.

## External APIs Used

- **REST Countries API**: https://restcountries.com/v2/all
- **Open Exchange Rates API**: https://open.er-api.com/v6/latest/USD

## Support

For support or questions, please open an issue in the GitHub repository.