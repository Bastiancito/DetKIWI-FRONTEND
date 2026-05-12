interface ApiConfig {
  baseURL: string;
  environment: 'local' | 'production';
}

const config: ApiConfig = {
  environment: 'local',
  baseURL: 'http://localhost:5000'
};

const environments = {
  local: 'http://localhost:5000/api',
  production: 'https://your-production-api.com/api'
};

export const getBaseURL = (): string => {
  return environments[config.environment];
};

export const setEnvironment = (env: 'local' | 'production'): void => {
  config.environment = env;
};

export const getConfig = (): ApiConfig => {
  return {
    ...config,
    baseURL: getBaseURL()
  };
};

export default config;