import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./digital_twin_lms.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "insecure-dev-secret-change-me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )
    FRONTEND_ORIGIN: str = os.getenv(
        "FRONTEND_ORIGIN", "http://localhost:5173"
    )

    MODEL_PATH: str = os.path.join(
        BASE_DIR, "app", "ml", "artifacts", "model.pkl"
    )
    SCALER_PATH: str = os.path.join(
        BASE_DIR, "app", "ml", "artifacts", "scaler.pkl"
    )

    # OpenRouter AI
    OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
    OPENROUTER_MODEL: str = os.getenv(
        "OPENROUTER_MODEL",
        "openrouter/free"
    )


settings = Settings()