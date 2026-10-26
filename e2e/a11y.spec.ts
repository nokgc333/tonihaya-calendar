import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./helpers";

const KNOWN_UNTIL_FIXED: Readonly<Record<string, string>> = {
  "aria-allowed-role": "TC-16",
  "nested-interactive": "TC-16",
  "label-content-name-mismatch": "TC-16",
  "scrollable-region-focusable": "TC-16",
};

const views = [
  ["the year", ""],
  ["the month", "?y=2026&m=7"],
  ["the week", "?y=2026&m=7&d=15&v=week"],
  ["the day", "?y=2026&m=7&d=15&v=day"],
] as const;

const COLORS = [
  "blue",
  "green",
  "teal",
  "purple",
  "pink",
  "amber",
  "slate",
  "rose",
];

const seededEvents = COLORS.flatMap((colorKey, i) => [
  {
    id: `all-${colorKey}`,
    title: `All day ${colorKey}`,
    allDay: true,
    start: { date: { year: 2026, month: 7, day: 15 } },
    end: { date: { year: 2026, month: 7, day: 15 } },
    colorKey,
    priority: "normal",
    createdAt: i,
    updatedAt: i,
  },
  {
    id: `timed-${colorKey}`,
    title: `Timed ${colorKey}`,
    allDay: false,
    start: {
      date: { year: 2026, month: 7, day: 15 },
      time: { hour: 8 + i, minute: 0 },
    },
    end: {
      date: { year: 2026, month: 7, day: 15 },
      time: { hour: 9 + i, minute: 0 },
    },
    colorKey,
    priority: "normal",
    createdAt: i,
    updatedAt: i,
  },
]);

async function newViolations(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations
    .filter((v) => !(v.id in KNOWN_UNTIL_FIXED))
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
    );
}

for (const scheme of ["light", "dark"] as const) {
  for (const [name, search] of views) {
    test(`has no new accessibility violation on ${name} in the ${scheme} theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await openApp(page, search);
      expect(await newViolations(page)).toEqual([]);
    });
  }
}

test("has no new accessibility violation in the event form", async ({
  page,
}) => {
  await openApp(page, "?y=2026&m=7");
  await page.getByRole("button", { name: "予定を作成" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(await newViolations(page)).toEqual([]);
});

test("has no new accessibility violation with the settings menu open", async ({
  page,
}) => {
  await openApp(page);
  await page.getByRole("button", { name: "設定" }).click();
  await expect(page.getByRole("dialog", { name: "設定" })).toBeVisible();
  expect(await newViolations(page)).toEqual([]);
});

test("lists every accepted violation with the task that removes it", () => {
  for (const [rule, task] of Object.entries(KNOWN_UNTIL_FIXED)) {
    expect(task, rule).toMatch(/^TC-\d+$/);
  }
});

for (const scheme of ["light", "dark"] as const) {
  for (const [name, search] of views) {
    test(`has no accessibility violation on ${name} with events of every color in the ${scheme} theme`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.addInitScript((events) => {
        localStorage.setItem("tonihaya.events", JSON.stringify(events));
      }, seededEvents);
      await openApp(page, search);
      await expect(
        page
          .getByTitle("All day blue")
          .or(page.getByText("2026年").first())
          .first(),
      ).toBeVisible();
      expect(await newViolations(page)).toEqual([]);
    });
  }
}

test("has no color contrast violation on any view, in either theme, on a wide screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1700, height: 1000 });
  for (const scheme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const [, search] of views) {
      await openApp(page, search);
      const { violations } = await new AxeBuilder({ page })
        .withRules(["color-contrast"])
        .analyze();
      expect(
        violations.map((v) => v.nodes.map((n) => n.html.slice(0, 80))),
        `${scheme} ${search}`,
      ).toEqual([]);
    }
  }
});
