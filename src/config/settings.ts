export class Settings {
    static OPENAI_API_KEY: string = process.env.OPENAI_API_KEY!;
    static BATCH_SIZE: number = parseInt(process.env.BATCH_SIZE || '2');
    static MAX_RETRIES: number = parseInt(process.env.MAX_RETRIES || '3');
    static MAX_CONCURRENT_PROCESSING: number = parseInt(process.env.MAX_CONCURRENT_PROCESSING || '4');

    static validate() {
        const requiredVars = ['OPENAI_API_KEY'];
        const missing = requiredVars.filter(varName => !process.env[varName]);
        if (missing.length > 0) {
            throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
        }
    }
}
