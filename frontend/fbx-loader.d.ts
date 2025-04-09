declare module 'three/examples/jsm/loaders/FBXLoader' {
    import { Object3D, LoadingManager } from 'three';
    
    export class FBXLoader {
      constructor(manager?: LoadingManager);
      load(url: string, onLoad: (object: Object3D) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void;
      parse(FBXBuffer: ArrayBuffer | string): Object3D;
    }
  }