interface ApiConfig {
  baseURL: string;
  environment: 'local' | 'production';
}

// Averiguamos si Vite está corriendo en modo desarrollo o producción
const isDev = import.meta.env.MODE === 'development';

const config: ApiConfig = {
  // Se cambia automáticamente según cómo levantaste el proyecto
  environment: isDev ? 'local' : 'production', 
  baseURL: 'http://localhost:5000'
};

const environments = {
  local: 'http://localhost:5000/api',
  production: 'https://det-kiwi-huh9epguabbedva2.brazilsouth-01.azurewebsites.net/api'
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