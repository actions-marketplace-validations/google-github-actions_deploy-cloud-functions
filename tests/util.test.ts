'use strict';

import 'mocha';
import { expect } from 'chai';

import StreamZip from 'node-stream-zip';
import { randomFilepath } from '@google-github-actions/actions-utils';

import { stringToInt, toEnum, zipDir } from '../src/util';

describe('Util', () => {
  describe('#zipDir', () => {
    const cases = [
      {
        name: 'throws an error if sourceDir does not exist',
        zipDir: '/not/a/real/path',
        error: 'Unable to find',
      },
      {
        name: 'creates a zipfile with correct files without gcloudignore',
        zipDir: 'tests/test-node-func',
        expectedFiles: ['.dotfile', 'index.js', 'package.json'],
        error: 'Unable to find',
      },
      {
        name: 'creates a zipfile with correct files with simple gcloudignore',
        zipDir: 'tests/test-func-ignore',
        expectedFiles: ['index.js', 'package.json'],
        error: 'Unable to find',
      },
      {
        name: 'creates a zipfile with correct files with simple gcloudignore',
        zipDir: 'tests/test-func-ignore-node',
        expectedFiles: [
          '.gcloudignore',
          'foo/data.txt',
          'index.js',
          'notIgnored.txt',
          'package.json',
        ],
        error: 'Unable to find',
      },
    ];

    cases.forEach((tc) => {
      it(tc.name, async () => {
        if (tc.expectedFiles !== undefined) {
          const zf = await zipDir(tc.zipDir, randomFilepath());
          const filesInsideZip = await getFilesInZip(zf);
          expect(filesInsideZip).to.have.members(tc.expectedFiles);
        } else if (tc.error !== undefined) {
          try {
            await zipDir(tc.zipDir, randomFilepath());
            throw new Error(`Should have thrown err: ${tc.error}`);
          } catch (err) {
            expect(`${err}`).to.contain(tc.error);
          }
        }
      });
    });
  });

  describe('#toEnum', () => {
    const cases: {
      name: string;
      str: string;
      exp: string;
    }[] = [
      {
        name: 'empty',
        str: '',
        exp: '',
      },
      {
        name: 'uppers',
        str: 'foo',
        exp: 'FOO',
      },
      {
        name: 'spaces',
        str: 'foo bar',
        exp: 'FOO_BAR',
      },
      {
        name: 'dashes',
        str: 'foo-bar',
        exp: 'FOO_BAR',
      },
      {
        name: 'multiple spaces',
        str: 'foo bar   baz',
        exp: 'FOO_BAR_BAZ',
      },
      {
        name: 'multiple dashes',
        str: 'foo-bar--baz',
        exp: 'FOO_BAR_BAZ',
      },
    ];

    cases.forEach((tc) => {
      it(tc.name, () => {
        const e = toEnum(tc.str);
        expect(e).to.eql(tc.exp);
      });
    });
  });

  describe('#stringToInt', () => {
    const cases: {
      only?: boolean;
      name: string;
      input: string;
      expected?: number | undefined;
      error?: string;
    }[] = [
      {
        name: 'empty',
        input: '',
        expected: undefined,
      },
      {
        name: 'spaces',
        input: ' ',
        expected: undefined,
      },
      {
        name: 'digit',
        input: '1',
        expected: 1,
      },
      {
        name: 'multi-digit',
        input: '123',
        expected: 123,
      },
      {
        name: 'suffix',
        input: '100MB',
        expected: 100,
      },
      {
        name: 'comma',
        input: '1,000',
        expected: 1000,
      },
      {
        name: 'NaN',
        input: 'this is definitely not a number',
        error: 'input "this is definitely not a number" is not a number',
      },
    ];

    cases.forEach((tc) => {
      const fn = tc.only ? it.only : it;
      fn(tc.name, () => {
        if (tc.expected !== undefined) {
          expect(stringToInt(tc.input)).to.eql(tc.expected);
        } else if (tc.error !== undefined) {
          expect(() => {
            stringToInt(tc.input);
          }).to.throw(tc.error);
        }
      });
    });
  });
});

/**
 *
 * @param zipFilePath path to zipfile
 * @returns list of files within zipfile
 */
async function getFilesInZip(zipFilePath: string): Promise<string[]> {
  const uzf = new StreamZip.async({ file: zipFilePath });
  const zipEntries = await uzf.entries();
  const filesInsideZip: string[] = [];
  for (const k in zipEntries) {
    if (zipEntries[k].isFile) {
      filesInsideZip.push(zipEntries[k].name);
    }
  }
  return filesInsideZip;
}
