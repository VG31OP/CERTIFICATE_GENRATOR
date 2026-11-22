#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT_DIR = fs.existsSync('CERTIFICATE_GENRATOR') ? path.resolve('CERTIFICATE_GENRATOR') : process.cwd();

let hasError = false;
let totalChecks = 0;
let passedChecks = 0;

function check(desc, condition, details = '') {
  totalChecks++;
  if (condition) {
    console.log(`  \x1b[32m✔ PASS\x1b[0m: ${desc}`);
    passedChecks++;
  } else {
    console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${desc} ${details ? `(${details})` : ''}`);
    hasError = true;
  }
}

console.log('\n======================================================');
console.log('  VG CERTIFICATE STUDIO — SEO & ECOSYSTEM VALIDATION');
console.log('======================================================\n');

// 1. Validate index.html
console.log('\x1b[1m1. Checking index.html Head Metadata & Structured Data\x1b[0m');
const indexPath = path.join(ROOT_DIR, 'index.html');
check('index.html exists', fs.existsSync(indexPath));

if (fs.existsSync(indexPath)) {
  const html = fs.readFileSync(indexPath, 'utf8');

  // Title & Canonical
  check('Title tag contains descriptive value proposition and author branding', html.includes('VG Certificate Studio') && html.includes('By Vraj Shiroya'));
  check('Canonical URL points strictly to https://certificate.shiroya.in/', html.includes('<link rel="canonical" href="https://certificate.shiroya.in/" />'));
  check('Meta description present and non-empty', html.includes('<meta name="description" content="') && html.includes('Vraj Shiroya'));
  check('Meta author attributes Vraj Shiroya', html.includes('<meta name="author" content="Vraj Shiroya" />'));

  // Open Graph & Twitter Cards
  check('OpenGraph og:title defined', html.includes('property="og:title"'));
  check('OpenGraph og:url matches canonical', html.includes('property="og:url" content="https://certificate.shiroya.in/"'));
  check('OpenGraph og:site_name set to Shiroya Tool Lab', html.includes('property="og:site_name" content="Shiroya Tool Lab"'));
  check('Twitter card set to summary_large_image', html.includes('name="twitter:card" content="summary_large_image"'));
  check('Twitter creator attributes @VG31OP', html.includes('name="twitter:creator" content="@VG31OP"'));

  // JSON-LD Structured Data
  const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check('JSON-LD script block found', !!jsonLdMatch);

  if (jsonLdMatch) {
    try {
      const schemaData = JSON.parse(jsonLdMatch[1]);
      check('JSON-LD context is https://schema.org', schemaData['@context'] === 'https://schema.org');

      const graph = schemaData['@graph'] || [];
      check('JSON-LD root is a valid @graph array', Array.isArray(graph) && graph.length > 0);

      // Verify zero duplicate @id references
      const ids = graph.map(e => e['@id']).filter(Boolean);
      const uniqueIds = new Set(ids);
      check('Zero duplicate @id values across graph', ids.length === uniqueIds.size);

      // Verify WebApplication
      const webApp = graph.find(e => e['@type'] === 'WebApplication');
      check('WebApplication entity exists', !!webApp);
      if (webApp) {
        check('WebApplication @id is https://certificate.shiroya.in/#webapp', webApp['@id'] === 'https://certificate.shiroya.in/#webapp');
        check('WebApplication author anchored to https://vraj.shiroya.in/#person', webApp.author?.['@id'] === 'https://vraj.shiroya.in/#person');
        check('WebApplication creator anchored to https://vraj.shiroya.in/#person', webApp.creator?.['@id'] === 'https://vraj.shiroya.in/#person');
        check('WebApplication links to verified codeRepository', webApp.codeRepository === 'https://github.com/VG31OP/CERTIFICATE_GENRATOR');
      }

      // Verify Person
      const person = graph.find(e => e['@type'] === 'Person');
      check('Person entity exists for master identity', !!person);
      if (person) {
        check('Person @id is https://vraj.shiroya.in/#person', person['@id'] === 'https://vraj.shiroya.in/#person');
        check('Person name is Vraj Shiroya', person.name === 'Vraj Shiroya');
        check('Person sameAs contains GitHub and LinkedIn', 
          person.sameAs?.includes('https://github.com/VG31OP') && 
          person.sameAs?.includes('https://www.linkedin.com/in/vrajshiroya')
        );
        const hasBadSameAs = person.sameAs?.some(u => u.includes('shiroya.in'));
        check('Person sameAs strictly avoids product websites (entity hygiene)', !hasBadSameAs);
      }
    } catch (e) {
      check('JSON-LD parses as valid JSON', false, e.message);
    }
  }

  // Noscript Crawlable Outline
  check('Noscript crawlable outline present for non-JS bots', html.includes('<noscript>') && html.includes('VG Certificate Studio'));
  check('Noscript attributes Vraj Shiroya and links to portfolio', html.includes('https://vraj.shiroya.in/'));
  check('Noscript links to GitHub repository', html.includes('https://github.com/VG31OP/CERTIFICATE_GENRATOR'));
}

// 2. Validate robots.txt
console.log('\n\x1b[1m2. Checking robots.txt Directives\x1b[0m');
const robotsPath = path.join(ROOT_DIR, 'robots.txt');
check('robots.txt exists', fs.existsSync(robotsPath));

if (fs.existsSync(robotsPath)) {
  const robots = fs.readFileSync(robotsPath, 'utf8');
  check('robots.txt specifies correct sitemap', robots.includes('Sitemap: https://certificate.shiroya.in/sitemap.xml'));
  check('robots.txt explicitly allows GPTBot', robots.includes('User-agent: GPTBot') && robots.includes('Allow: /'));
  check('robots.txt explicitly allows ClaudeBot', robots.includes('User-agent: ClaudeBot') && robots.includes('Allow: /'));
  check('robots.txt explicitly allows PerplexityBot', robots.includes('User-agent: PerplexityBot') && robots.includes('Allow: /'));
  check('robots.txt explicitly blocks Bytespider scraper', robots.includes('User-agent: Bytespider') && robots.includes('Disallow: /'));
}

// 3. Validate sitemap.xml
console.log('\n\x1b[1m3. Checking sitemap.xml\x1b[0m');
const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
check('sitemap.xml exists', fs.existsSync(sitemapPath));

if (fs.existsSync(sitemapPath)) {
  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  check('sitemap.xml references canonical URL https://certificate.shiroya.in/', sitemap.includes('<loc>https://certificate.shiroya.in/</loc>'));
}

// 4. Validate AI and LLM Assets
console.log('\n\x1b[1m4. Checking AI & LLM Discovery Assets\x1b[0m');
const llmsPath = path.join(ROOT_DIR, 'llms.txt');
check('llms.txt exists', fs.existsSync(llmsPath));

if (fs.existsSync(llmsPath)) {
  const llms = fs.readFileSync(llmsPath, 'utf8');
  check('llms.txt references canonical URL', llms.includes('https://certificate.shiroya.in/'));
  check('llms.txt attributes Vraj Shiroya and links to portfolio', llms.includes('https://vraj.shiroya.in/'));
  check('llms.txt links to GitHub repo', llms.includes('https://github.com/VG31OP/CERTIFICATE_GENRATOR'));
}

const llmsFullPath = path.join(ROOT_DIR, 'llms-full.txt');
check('llms-full.txt exists', fs.existsSync(llmsFullPath));

// 5. Security & Attribution
console.log('\n\x1b[1m5. Checking Security & Attribution Files\x1b[0m');
check('.well-known/security.txt exists', fs.existsSync(path.join(ROOT_DIR, '.well-known/security.txt')));
check('humans.txt exists', fs.existsSync(path.join(ROOT_DIR, 'humans.txt')));

console.log('\n======================================================');
console.log(`  VALIDATION RESULTS: ${passedChecks}/${totalChecks} PASSED (${hasError ? 'FAILURES DETECTED' : '100% CLEAN'})`);
console.log('======================================================\n');

if (hasError) {
  process.exit(1);
} else {
  console.log('\x1b[32m✔ All Master SEO & Knowledge Graph validations passed successfully!\x1b[0m\n');
}
