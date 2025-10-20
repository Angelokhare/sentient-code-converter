export type UploadedFile = {
    path: string;    // relative path including directories (e.g. src/App.tsx)
    content: string; // file text
    name: string;
  };
  export type ConvertedFile = {
    path: string;
    content: string;
  };