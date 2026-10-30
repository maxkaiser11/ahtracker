import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing environment variable: ${name}`);
    return value;
}

export const env = {
    API_CLIENT: requireEnv('API_CLIENT'),
    CLIENT_SECRET: requireEnv('CLIENT_SECRET'),
};