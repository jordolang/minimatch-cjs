'use strict'

// minimatch 3 and 5 export the matcher function itself, compile magic path
// segments to RegExps with a `_glob` property, and have `makeRe`. minimatch 11
// exports an object, uses non-RegExp matchers and has no `makeRe`. This adapts
// minimatch 11 to the old shape so callers such as glob 7 keep working.
const mm11 = require('minimatch')

// A RegExp that defers to a minimatch 11 matcher, so `str.match(re)`,
// `re.test(str)` and `re._glob` behave as they did with minimatch 3.
class MatcherRegExp extends RegExp {
  constructor (test, glob, matcher) {
    super('(?:)')
    this._test = test
    this._glob = glob
    this._matcher = matcher
  }

  get pattern () { return this._matcher ? this._matcher.pattern : this._glob }
  get options () { return this._matcher && this._matcher.options }

  test (str) { return this._test(String(str)) }
  testUnchecked (str) { return this._matcher ? this._matcher.testUnchecked(str) : this._test(str) }

  exec (str) {
    const s = String(str)
    if (!this._test(s)) return null
    const result = [s]
    result.index = 0
    result.input = s
    return result
  }

  [Symbol.match] (str) { return this.exec(str) }
}

const wrapSegment = (part) => {
  if (typeof part === 'string' || part === mm11.GLOBSTAR || typeof part.testUnchecked !== 'function') return part
  return new MatcherRegExp((s) => part.test(s), part.pattern, part)
}

class Minimatch extends mm11.Minimatch {
  constructor (pattern, options) {
    super(pattern, options || {})
    this.set = this.set.map((row) => row.map(wrapSegment))
  }

  makeRe () {
    return new MatcherRegExp((s) => this.match(s), this.pattern)
  }
}

function minimatch (path, pattern, options) {
  options = options || {}
  if (typeof pattern !== 'string') throw new TypeError('glob pattern string required')
  if (!options.nocomment && pattern.charAt(0) === '#') return false
  return new Minimatch(pattern, options).match(path)
}

minimatch.Minimatch = Minimatch
minimatch.GLOBSTAR = mm11.GLOBSTAR
minimatch.sep = mm11.sep
minimatch.escape = mm11.escape
minimatch.unescape = mm11.unescape
minimatch.braceExpand = mm11.braceExpand
minimatch.filter = (pattern, options) => (p) => minimatch(p, pattern, options)
minimatch.match = (list, pattern, options) => {
  options = options || {}
  const mm = new Minimatch(pattern, options)
  const matched = list.filter((f) => mm.match(f))
  if (options.nonull && !matched.length) matched.push(pattern)
  return matched
}
minimatch.makeRe = (pattern, options) => new Minimatch(pattern, options).makeRe()
minimatch.defaults = (def) => {
  if (!def || typeof def !== 'object' || !Object.keys(def).length) return minimatch
  const orig = minimatch
  const m = (p, pattern, options) => orig(p, pattern, Object.assign({}, def, options))
  return Object.assign(m, orig, {
    Minimatch: class extends orig.Minimatch {
      constructor (pattern, options) { super(pattern, Object.assign({}, def, options)) }
    },
    filter: (pattern, options) => orig.filter(pattern, Object.assign({}, def, options)),
    match: (list, pattern, options) => orig.match(list, pattern, Object.assign({}, def, options)),
    makeRe: (pattern, options) => orig.makeRe(pattern, Object.assign({}, def, options)),
    defaults: (options) => orig.defaults(Object.assign({}, def, options))
  })
}
minimatch.minimatch = minimatch
minimatch.default = minimatch

module.exports = minimatch
