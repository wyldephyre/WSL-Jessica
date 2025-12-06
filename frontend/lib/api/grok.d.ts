// Type declarations for Grok API if needed
declare module 'xai-sdk' {
  export class Grok {
    constructor(options: { apiKey: string });
    chat: {
      completions: {
        create(options: any): Promise<any>;
      };
    };
  }
}

