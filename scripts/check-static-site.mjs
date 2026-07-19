#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(process.argv[2] ?? path.join(scriptDirectory, '..'));
const ignoredDirectories = new Set(['.git', 'node_modules']);
const repositoryBasePath = `/${path.basename(root)}/`;
const issues = [];

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function lineNumber(text, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function decodeEntities(value) {
  const named = new Map([
    ['amp', '&'],
    ['apos', "'"],
    ['gt', '>'],
    ['lt', '<'],
    ['quot', '"'],
  ]);

  return value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi, (match, decimal, hex, name) => {
    if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
    if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
    return named.get(name.toLowerCase()) ?? match;
  });
}

function parseAttributes(source) {
  const attributes = new Map();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    attributes.set(match[1].toLowerCase(), decodeEntities(match[2] ?? match[3] ?? match[4] ?? ''));
  }

  return attributes;
}

function maskContent(value) {
  return value.replace(/[^\r\n]/g, ' ');
}

function markupWithoutRawText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, maskContent)
    .replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script\s*>)/gi, (_, open, body, close) => open + maskContent(body) + close)
    .replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style\s*>)/gi, (_, open, body, close) => open + maskContent(body) + close);
}

function parseHtml(file, html) {
  const ids = new Set();
  const references = [];
  const markup = markupWithoutRawText(html);
  const tagPattern = /<([a-z][\w:-]*)\b([^>]*)>/gi;
  let match;

  while ((match = tagPattern.exec(markup)) !== null) {
    const tag = match[1].toLowerCase();
    const attributes = parseAttributes(match[2]);
    const line = lineNumber(html, match.index);

    if (attributes.has('id')) ids.add(attributes.get('id'));
    if (tag === 'a' && attributes.has('name')) ids.add(attributes.get('name'));

    for (const attribute of ['href', 'src', 'poster']) {
      if (attributes.has(attribute)) {
        references.push({ attribute, line, tag, value: attributes.get(attribute) });
      }
    }
  }

  return { file, html, ids, references };
}

async function collectFiles(directory) {
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.' || entry.name === '..') continue;
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...await collectFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

function isExternalReference(value) {
  return value.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(value);
}

function decodeUrlPart(value, source, line) {
  try {
    return decodeURIComponent(value);
  } catch {
    issues.push(`${relative(source)}:${line} contains an invalid URL escape: ${value}`);
    return null;
  }
}

function resolveLocalPath(source, urlPath, line) {
  const decoded = decodeUrlPart(urlPath, source, line);
  if (decoded === null) return null;
  if (!decoded) return source;

  if (decoded.startsWith('/')) {
    const baseWithoutTrailingSlash = repositoryBasePath.slice(0, -1);
    if (decoded !== baseWithoutTrailingSlash && !decoded.startsWith(repositoryBasePath)) {
      issues.push(
        `${relative(source)}:${line} uses a root path outside ${repositoryBasePath}: ${decoded}`,
      );
      return null;
    }

    const repositoryRelativePath = decoded.slice(baseWithoutTrailingSlash.length).replace(/^\/+/, '');
    return path.resolve(root, repositoryRelativePath);
  }

  return path.resolve(path.dirname(source), decoded);
}

function staysInsideRoot(target) {
  const candidate = path.relative(root, target);
  return candidate === '' || (!candidate.startsWith(`..${path.sep}`) && candidate !== '..' && !path.isAbsolute(candidate));
}

async function validateReferences(documents) {
  const documentsByPath = new Map(documents.map((document) => [path.resolve(document.file), document]));
  let checked = 0;

  for (const document of documents) {
    for (const reference of document.references) {
      const raw = reference.value.trim();
      if (!raw || isExternalReference(raw)) continue;
      if (raw.startsWith('data:') || raw.startsWith('javascript:') || raw.startsWith('blob:')) continue;

      checked += 1;
      const hashIndex = raw.indexOf('#');
      const beforeHash = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
      const fragmentSource = hashIndex >= 0 ? raw.slice(hashIndex + 1) : '';
      const queryIndex = beforeHash.indexOf('?');
      const urlPath = queryIndex >= 0 ? beforeHash.slice(0, queryIndex) : beforeHash;
      let target = resolveLocalPath(document.file, urlPath, reference.line);
      if (!target) continue;

      if (!staysInsideRoot(target)) {
        issues.push(`${relative(document.file)}:${reference.line} points outside the repository: ${raw}`);
        continue;
      }

      if (!existsSync(target)) {
        issues.push(`${relative(document.file)}:${reference.line} has a missing local target: ${raw}`);
        continue;
      }

      const targetStats = await stat(target);
      if (targetStats.isDirectory()) target = path.join(target, 'index.html');

      if (!existsSync(target)) {
        issues.push(`${relative(document.file)}:${reference.line} has no index.html at: ${raw}`);
        continue;
      }

      if (fragmentSource) {
        const fragment = decodeUrlPart(fragmentSource, document.file, reference.line);
        if (fragment === null) continue;
        const targetDocument = documentsByPath.get(path.resolve(target));

        if (targetDocument && !targetDocument.ids.has(fragment)) {
          issues.push(`${relative(document.file)}:${reference.line} has a missing fragment #${fragment} in ${relative(target)}`);
        }
      }
    }
  }

  return checked;
}

function runNodeSyntaxCheck({ args, code, label }) {
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    input: code,
    maxBuffer: 16 * 1024 * 1024,
  });

  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || 'unknown syntax error').trim();
    issues.push(`${label} failed JavaScript syntax validation:\n${detail}`);
  }
}

async function validateJavaScript(files, documents) {
  const javaScriptFiles = files.filter((file) => /\.(?:cjs|js|mjs)$/i.test(file)).sort();
  let inlineScripts = 0;

  for (const file of javaScriptFiles) {
    const extension = path.extname(file).toLowerCase();
    const source = await readFile(file, 'utf8');
    const looksLikeModule = extension === '.mjs'
      || path.basename(file).includes('.module.')
      || /(^|\n)\s*(?:import|export)\b/m.test(source);

    if (looksLikeModule) {
      runNodeSyntaxCheck({
        args: ['--input-type=module', '--check'],
        code: source,
        label: relative(file),
      });
    } else {
      runNodeSyntaxCheck({ args: ['--check', file], label: relative(file) });
    }
  }

  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  for (const document of documents) {
    let match;
    while ((match = scriptPattern.exec(document.html)) !== null) {
      const attributes = parseAttributes(match[1]);
      if (attributes.has('src')) continue;

      const type = (attributes.get('type') ?? '').trim().toLowerCase();
      const isModule = type === 'module';
      if (type && !isModule && !['text/javascript', 'application/javascript'].includes(type)) continue;
      if (!match[2].trim()) continue;

      inlineScripts += 1;
      const line = lineNumber(document.html, match.index);
      runNodeSyntaxCheck({
        args: isModule ? ['--input-type=module', '--check'] : ['--check'],
        code: match[2],
        label: `${relative(document.file)}:${line} inline script`,
      });
    }
  }

  return { files: javaScriptFiles.length, inlineScripts };
}

async function validateJson(files) {
  const jsonFiles = files.filter((file) => path.extname(file).toLowerCase() === '.json').sort();

  for (const file of jsonFiles) {
    try {
      const content = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '');
      JSON.parse(content);
    } catch (error) {
      issues.push(`${relative(file)} is invalid JSON: ${error.message}`);
    }
  }

  return jsonFiles.length;
}

if (!existsSync(root)) {
  console.error(`Repository root does not exist: ${root}`);
  process.exit(1);
}

const files = (await collectFiles(root)).sort();
const htmlFiles = files.filter((file) => path.extname(file).toLowerCase() === '.html');
const documents = [];

for (const file of htmlFiles) {
  const html = (await readFile(file, 'utf8')).replace(/^\uFEFF/, '');
  documents.push(parseHtml(file, html));
}

const checkedReferences = await validateReferences(documents);
const javaScript = await validateJavaScript(files, documents);
const jsonFiles = await validateJson(files);

if (issues.length > 0) {
  console.error(`Static site checks failed with ${issues.length} issue(s):`);
  for (const issue of issues) console.error(`\n- ${issue}`);
  process.exit(1);
}

console.log(`Static site checks passed for ${relative(root) || path.basename(root)}:`);
console.log(`- HTML: ${htmlFiles.length} files, ${checkedReferences} local references`);
console.log(`- JavaScript: ${javaScript.files} files, ${javaScript.inlineScripts} inline scripts`);
console.log(`- JSON: ${jsonFiles} files`);
