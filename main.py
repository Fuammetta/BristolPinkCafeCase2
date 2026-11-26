from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {"message": "Pink Cafe Backend is running!"}
