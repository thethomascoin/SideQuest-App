declare const process: {
  env: {
    API_KEY: string;
    [key: string]: string | undefined;
  }
};

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
