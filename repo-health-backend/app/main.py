from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import timeline, graph, diff, premerge

app = FastAPI(title="Repository Risk Intelligence API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Repository Risk Intelligence API"}

# Include routers
app.include_router(timeline.router, prefix="/api", tags=["Timeline"])
app.include_router(graph.router, prefix="/api", tags=["Graph"])
app.include_router(diff.router, prefix="/api", tags=["Diff"])
app.include_router(premerge.router, prefix="/api", tags=["Premerge"])
