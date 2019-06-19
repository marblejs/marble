export interface File {
  destination?: any;
  buffer?: Buffer;
  size?: number;
  encoding: string;
  mimetype: string;
  filename: string;
  fieldname: string;
}

export interface WithFile {
  file: Record<string, File>;
}
