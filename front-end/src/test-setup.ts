import '@angular/compiler';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

await resolveComponentResources((url: string) => {
  const filePath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    url.startsWith('/') ? `.${url}` : url
  );
  try {
    const content = readFileSync(filePath, 'utf-8');
    return Promise.resolve(content);
  } catch {
    return Promise.resolve('');
  }
});

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  { teardown: { destroyAfterEach: true } }
);