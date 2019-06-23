import { Observable } from 'rxjs';

export interface File {
  destination?: any;
  buffer?: Buffer;
  size?: number;
  encoding: string;
  mimetype: string;
  filename?: string;
  fieldname: string;
}

export interface FileIncomingData {
  file: NodeJS.ReadableStream;
  filename: string;
  fieldname: string;
  encoding: string;
  mimetype: string;
};

export interface WithFile<T extends string = string> {
  file: Record<T, File>;
}

interface StreamHandlerOutput {
  destination: any;
  size?: number;
}

export interface StreamHandler {
  (opts: FileIncomingData): Promise<StreamHandlerOutput> | Observable<StreamHandlerOutput>;
}

export interface ParserOpts {
  files?: string[];
  stream?: StreamHandler;
  maxFileSize?: number;
  maxFileCount?: number;
  maxFieldSize?: number;
  maxFieldCount?: number;
}
