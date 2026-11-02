'use strict'

const test = require('node:test')
const assert = require('node:assert')
const minimatch = require('./index.js')

test('is callable like minimatch 3', () => {
  assert.strictEqual(minimatch('src/a.js', 'src/**/*.js'), true)
  assert.strictEqual(minimatch('src/a.ts', 'src/**/*.js'), false)
  assert.strictEqual(minimatch('.eslintrc', '*', { dot: true }), true)
})

test('exposes the minimatch 3 helpers', () => {
  const mm = new minimatch.Minimatch('**/*.{js,ts}')
  assert.strictEqual(mm.match('a/b.ts'), true)
  assert.strictEqual(mm.negate, false)
  assert.ok(Array.isArray(mm.set))
  assert.deepStrictEqual(['a.js', 'a.css'].filter(minimatch.filter('*.js')), ['a.js'])
  assert.ok(minimatch.makeRe('*.js').test('a.js'))
  assert.deepStrictEqual(minimatch.match(['a.js', 'b.md'], '*.md'), ['b.md'])
  assert.deepStrictEqual(minimatch.braceExpand('{a,b}'), ['a', 'b'])
  assert.strictEqual(minimatch.default, minimatch)
  assert.strictEqual(minimatch.minimatch, minimatch)
})

test('runs the patched minimatch 11', () => {
  assert.strictEqual(require('minimatch/package.json').version, '11.0.3')
})

test('magic segments behave like minimatch 3 RegExps for glob 7', () => {
  const mm = new minimatch.Minimatch('src/*.js')
  const seg = mm.set[0][1]
  assert.ok(seg instanceof RegExp)
  assert.strictEqual(seg._glob, '*.js')
  assert.strictEqual('a.js'.match(seg)[0], 'a.js')
  assert.strictEqual('a.ts'.match(seg), null)
  assert.strictEqual(seg.test('b.js'), true)
  assert.strictEqual(mm.match('src/b.js'), true)
  assert.strictEqual(new minimatch.Minimatch('**').set[0][0], minimatch.GLOBSTAR)
})

test('comments, negation and defaults', () => {
  assert.strictEqual(minimatch('a', '#a'), false)
  assert.strictEqual(minimatch('a.md', '!*.js'), true)
  const dotted = minimatch.defaults({ dot: true })
  assert.strictEqual(dotted('.env', '*'), true)
  assert.strictEqual(minimatch('.env', '*'), false)
})

test('copies of a wrapper RegExp fail closed', () => {
  const re = minimatch.makeRe('*.js')
  assert.strictEqual(new RegExp(re).test('anything'), false)
  assert.strictEqual(new RegExp(re.source).test('a.js'), false)
  assert.strictEqual('a.js'.replace(re, 'X'), 'X')
  assert.strictEqual('a.md'.replace(re, 'X'), 'a.md')
  assert.strictEqual('a.js'.search(re), 0)
  assert.strictEqual('a.md'.search(re), -1)
  assert.strictEqual(minimatch.makeRe('#comment'), false)
  assert.strictEqual(minimatch.makeRe(''), false)
})
