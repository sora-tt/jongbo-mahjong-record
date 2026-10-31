import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const styles = readFileSync(
  new URL("../../app/styles/globals.css", import.meta.url),
  "utf8"
);
const appShell = readFileSync(
  new URL("./app-shell/index.tsx", import.meta.url),
  "utf8"
);
const authFormShell = readFileSync(
  new URL("./auth-form-shell/index.tsx", import.meta.url),
  "utf8"
);
const header = readFileSync(
  new URL("./header/index.tsx", import.meta.url),
  "utf8"
);

const getRule = (className: string) => {
  const rule = styles.match(new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`));
  assert.ok(rule, `Expected .${className} CSS rule`);
  return rule[1];
};

test("app shell respects horizontal and bottom safe areas with dynamic height", () => {
  const rule = getRule("safe-area-app-shell");

  assert.match(appShell, /safe-area-app-shell/);
  assert.match(rule, /min-height:\s*100vh/);
  assert.match(rule, /min-height:\s*100dvh/);
  assert.match(
    rule,
    /padding-inline:\s*env\(safe-area-inset-left\)\s+env\(safe-area-inset-right\)/
  );
  assert.match(rule, /padding-bottom:\s*env\(safe-area-inset-bottom\)/);
});

test("auth shell adds safe area insets to its existing minimum spacing", () => {
  const rule = getRule("safe-area-auth-shell");

  assert.match(authFormShell, /safe-area-auth-shell/);
  assert.match(
    rule,
    /padding-top:\s*calc\(2\.5rem \+ env\(safe-area-inset-top\)\)/
  );
  assert.match(
    rule,
    /padding-right:\s*calc\(1rem \+ env\(safe-area-inset-right\)\)/
  );
  assert.match(
    rule,
    /padding-bottom:\s*calc\(2\.5rem \+ env\(safe-area-inset-bottom\)\)/
  );
  assert.match(
    rule,
    /padding-left:\s*calc\(1rem \+ env\(safe-area-inset-left\)\)/
  );
});

test("sticky header and fixed drawer keep their controls inside vertical safe areas", () => {
  const headerRule = getRule("safe-area-header-content");
  const drawerRule = getRule("safe-area-mobile-drawer");

  assert.match(header, /<header className="sticky top-0[^\"]*bg-white\/95/);
  assert.match(header, /safe-area-header-content/);
  assert.match(headerRule, /padding-top:\s*env\(safe-area-inset-top\)/);
  assert.match(header, /fixed inset-y-0[^\"]*safe-area-mobile-drawer/);
  assert.match(drawerRule, /padding-top:\s*env\(safe-area-inset-top\)/);
  assert.match(drawerRule, /padding-bottom:\s*env\(safe-area-inset-bottom\)/);
});
