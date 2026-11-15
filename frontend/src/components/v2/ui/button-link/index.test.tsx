import { strictEqual } from "node:assert";
import test from "node:test";

import * as React from "react";

import { JSDOM } from "jsdom";
import { renderToStaticMarkup } from "react-dom/server";

import { Button } from "@/components/v2/ui/button";

import { ButtonLink } from "./index";

test("button links render as links and share button variant and size styles", () => {
  const button = new JSDOM(
    renderToStaticMarkup(
      <Button variant="secondary" size="sm">
        詳細
      </Button>
    )
  ).window.document.querySelector("button");
  const link = new JSDOM(
    renderToStaticMarkup(
      <ButtonLink href="/season" variant="secondary" size="sm">
        詳細
      </ButtonLink>
    )
  ).window.document.querySelector("a");
  strictEqual(link?.getAttribute("href"), "/season");
  strictEqual(link?.className, button?.className);
  strictEqual(link?.querySelector("button"), null);
});
