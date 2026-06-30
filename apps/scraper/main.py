import os

from dotenv import load_dotenv
from fastapi import FastAPI

from routers.health import router as health_router
from routers.scrape import router as scrape_router

load_dotenv()

app = FastAPI(title="Telegram Analyzer — Python Scraper", version="0.0.0")

app.include_router(health_router)
app.include_router(scrape_router)

if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
