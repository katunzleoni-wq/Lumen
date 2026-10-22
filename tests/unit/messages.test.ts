import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import es from "@/messages/es.json";
import fr from "@/messages/fr.json";
import pt from "@/messages/pt.json";

type Nested = { [key: string]: string | Nested };

function flatten(tree: Nested, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") return [path];
    return flatten(value, path);
  });
}

function emptyValues(tree: Nested, prefix = ""): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") return value.trim() ? [] : [path];
    return emptyValues(value, path);
  });
}

describe("message catalogues", () => {
  const base = flatten(pt as Nested).sort();

  it.each([
    ["en", en],
    ["es", es],
    ["fr", fr],
  ])("%s has exactly the same keys as pt", (_locale, catalogue) => {
    expect(flatten(catalogue as Nested).sort()).toEqual(base);
  });

  it.each([
    ["pt", pt],
    ["en", en],
    ["es", es],
    ["fr", fr],
  ])("%s has no empty translations", (_locale, catalogue) => {
    expect(emptyValues(catalogue as Nested)).toEqual([]);
  });
});
