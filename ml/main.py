from fastapi import FastAPI, Depends, HTTPException, Header
from routers import embed, score, github, leetcode
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Semantic ATS ML Pipeline")

ML_SECRET = os.getenv("ML_SERVICE_SECRET", "dev_secret")

def verify_internal_secret(x_internal_secret: str = Header(...)):
    if x_internal_secret != ML_SECRET:
        raise HTTPException(status_code=403, detail="Invalid internal secret")

# Apply authentication to all routes except health check
@app.get("/health")
def health_check():
    return {"status": "ok"}

app.include_router(embed.router, prefix="/embed", dependencies=[Depends(verify_internal_secret)])
app.include_router(score.router, dependencies=[Depends(verify_internal_secret)])
app.include_router(github.router, prefix="/github", dependencies=[Depends(verify_internal_secret)])
app.include_router(leetcode.router, prefix="/leetcode", dependencies=[Depends(verify_internal_secret)])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
