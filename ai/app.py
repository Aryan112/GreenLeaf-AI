from fastapi import FastAPI

from routers.recommendation import router

app = FastAPI(
    title="GreenLeaf AI Service"
)

app.include_router(router)


@app.get("/")
def home():
    return {
        "message": "GreenLeaf AI Service is Running 🚀"
    }