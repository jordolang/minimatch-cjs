# minimatch-cjs

[minimatch](https://github.com/isaacs/minimatch) 11.0.3 behind the callable CommonJS API of minimatch 3 and 5.

Packages such as `eslint-plugin-react`, `eslint-plugin-import`, `eslint-plugin-jsx-a11y`, ESLint 9 and glob 7 still `require('minimatch')` and call the result as a function. minimatch 9 and later export an object instead, and the fix for GHSA-g3hv-75wg-m249 only exists in minimatch 11.0.1+. Overriding those copies with this package runs the patched matcher without breaking their callers:

```json
"overrides": {
  "minimatch@<9.0.0": "github:jordolang/minimatch-cjs#<commit>"
}
```
