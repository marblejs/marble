import * as fs from 'fs';
import * as util from 'util';
import * as http from 'http';
import { HttpStatus } from '@marblejs/core';
import { ApiDocument } from './apiDocument';
import { DocumentData, OneOrMore } from './testing.types';

export const access = (path: string, mode: number): Promise<boolean> =>
  new Promise(resolve => fs.access(path, mode, err => resolve(!err)));

const writeFile = util.promisify(fs.writeFile);

const collect = (body: string): Promise<void> => new Promise((resolve, reject) => {
  const port = process.env.MARBLE_TESTING_PORT;
  if (!port) {
    return;
  }
  const req = http.request({
      method: 'POST',
      hostname: 'localhost',
      port,
      path: '/',
      headers: { 'Content-Type': 'application/json' },
    }, res => res.statusCode !== HttpStatus.OK
    ? reject(new Error(res.statusMessage))
    : resolve()
  );
  req.write(body);
  req.end();
  setTimeout(() => reject(new Error(`Timeout reporting to @marblejs/testing on port ${port}.`)), 1500);
});

export const saveDocumentationChunk = async (location: string, apiDocument: ApiDocument): Promise<void> => {
  const data = JSON.stringify(apiDocument.serialize());
  await collect(data);
};

export const generateDocumentation = async (location: string, chunks: DocumentData[]): Promise<void> => {
  if (!chunks.length) {
    throw new Error('No chunks, can\'t generate documentation');
  }
  const document = ApiDocument.deserialize(...(chunks as OneOrMore<DocumentData>));
  await writeFile(location, JSON.stringify(document.generate(), null, 2), 'utf8');
};
