declare global {
  namespace NodeJS {
    interface ProcessEnv {
      SENDGRID_API_KEY: string;
      DATABASE_URL: string;
      DATABASE_TEST_URL: string;
      REDIS_URL: string;
      PORT: string;
      FRONTEND_HOST: string;
      FRONTEND_PORT: string;
      SENDER_EMAIL: string;
      SESSION_SECRET_KEY: string;
      CORS_ORIGIN: string;
      NODE_ENV: string;
    }
  }
}

export {}
