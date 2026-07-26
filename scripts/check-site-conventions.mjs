#!/usr/bin/env node
/**
 * 站点约定检查：确保每个页面都接入共享设计系统，且站点保持完全自包含。
 * 与 check-static-site.mjs 分开，前者管链接与语法，这里管约定。
 */

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'assets/vendor']);
const issues = [];

/** 外部资源会让站点在离线或受限网络下失效，也把访客数据交给第三方。 */
const EXTERNAL_RESOURCE = /(?:src|href)\s*=\s*["'](https?:)?\/\/(?!stardustlc666\.github\.io|github\.com)[^"']+["']/gi;

/** 只允许出现在这些位置的外部地址：说明性链接而非资源加载。 */
const ALLOWED_EXTERNAL_TAGS = new Set(['a', 'link-canonical', 'meta']);

const RETIRED_BRANDS = ['双子星秘境', 'Gemini Sanctuary'];

function relative(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function lineOf(text, index) {
  return text.slice(0, index).split('\n').length;
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name) || ignoredDirectories.has(relative(full))) continue;
      files.push(...await collectFiles(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

/** 加载型标签（script/link/style/img 等）不允许指向站外。 */
function checkSelfContained(file, html) {
  const loaders = /<(script|link|style|iframe)\b([^>]*)>/gi;
  let match;

  while ((match = loaders.exec(html)) !== null) {
    const [, tag, attributes] = match;
    if (tag.toLowerCase() === 'link' && /rel\s*=\s*["'](?:canonical|alternate)["']/i.test(attributes)) continue;

    const external = attributes.match(/(?:src|href)\s*=\s*["'](https?:)?\/\/[^"']+["']/i);
    if (external) {
      issues.push(`${relative(file)}:${lineOf(html, match.index)} 加载了外部资源，站点必须自包含：${external[0]}`);
    }
  }

  const fontImport = html.match(/@import\s+url\(["']?https?:/i);
  if (fontImport) {
    issues.push(`${relative(file)} 使用了外部 @import，站点必须自包含`);
  }
}

function checkSharedShell(file, html) {
  const name = relative(file);
  if (name === '404.html') return;

  if (!html.includes('assets/sanctuary.css')) {
    issues.push(`${name} 未引入 assets/sanctuary.css（共享设计令牌）`);
  }
  if (!html.includes('assets/sanctuary.js')) {
    issues.push(`${name} 未引入 assets/sanctuary.js（共享运行时）`);
  }
  if (name !== 'index.html' && !html.includes('<!-- xq:shared-head:start -->')) {
    issues.push(`${name} 缺少共享 head 区块（meta/og/favicon）`);
  }
  if (!/<meta\s+name=["']description["']/i.test(html)) {
    issues.push(`${name} 缺少 meta description`);
  }
  if (!/<link\s+rel=["']icon["']/i.test(html)) {
    issues.push(`${name} 缺少 favicon 引用`);
  }
}

function checkBranding(file, text) {
  for (const brand of RETIRED_BRANDS) {
    const index = text.indexOf(brand);
    if (index >= 0) {
      issues.push(`${relative(file)}:${lineOf(text, index)} 仍在使用旧站名「${brand}」，应统一为「星穹枢庭」`);
    }
  }
}

/** 明确指向未成年角色的标签不得出现在任何提示词工具中。 */
function checkMinorCodedTags(file, text) {
  const pattern = /(?:^|[^a-z])(loli|lolicon|shotacon|toddlercon)(?![a-z])/gi;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    issues.push(`${relative(file)}:${lineOf(text, match.index)} 含有指向未成年角色的标签「${match[1]}」，必须移除`);
  }
}

const files = await collectFiles(root);
const htmlFiles = files.filter((file) => file.toLowerCase().endsWith('.html'));
const textFiles = files.filter((file) => /\.(?:html|js|mjs|md|json|txt)$/i.test(file)
  && !relative(file).startsWith('assets/vendor/')
  && !relative(file).startsWith('scripts/check-site-conventions'));

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  checkSelfContained(file, html);
  checkSharedShell(file, html);
}

for (const file of textFiles) {
  const text = await readFile(file, 'utf8');
  checkBranding(file, text);
  checkMinorCodedTags(file, text);
}

if (issues.length > 0) {
  console.error(`站点约定检查失败，共 ${issues.length} 项：`);
  for (const issue of issues) console.error(`\n- ${issue}`);
  process.exit(1);
}

console.log('站点约定检查通过：');
console.log(`- 自包含：${htmlFiles.length} 个页面无外部资源加载`);
console.log(`- 共享外壳：全部页面已接入 sanctuary.css / sanctuary.js`);
console.log(`- 命名与内容：${textFiles.length} 个文本文件通过品牌与标签检查`);
