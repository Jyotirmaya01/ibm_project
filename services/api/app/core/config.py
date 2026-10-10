import os
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """AnnaSetu API application settings."""
    app_name: str = "AnnaSetu AI Backend"
    environment: str = "development"
    api_host: str = "127.0.0.1"
    api_port: int = 8000
    log_level: str = "info"
    
    # Supabase credentials (optional during initial local tests / healthcheck)
    supabase_url: str = "http://localhost:54321"
    supabase_anon_key: str = "placeholder-anon-key"
    supabase_service_role_key: str = "placeholder-service-key"
    
    # Adapters configuration
    maps_provider: str = "mock"
    notifications_provider: str = "mock"
    llm_provider: str = "mock"
    
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "../../../.env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
