export interface VisionResponse {
  responses: {
    fullTextAnnotation?: {
      text: string;
    };
  }[];
}

export interface TranslateResponse {
  data: {
    translations: {
      translatedText: string;
    }[];
  };
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}