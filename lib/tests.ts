const STORAGE_KEY = "test_urls";

export interface TestUrl {
  id: string;
  slug: string;
  url: string;
}

function getDomain() {
  return typeof window !== "undefined" ? window.location.hostname : "";
}

export function getTests(): TestUrl[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setTests(data: TestUrl[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function createTest(slug: string): TestUrl {
  const domain = getDomain();
  const url = domain ? `${slug}.${domain}` : slug;
  const tests = getTests();
  const newOne: TestUrl = { id: crypto.randomUUID(), slug, url };
  tests.push(newOne);
  setTests(tests);
  return newOne;
}

export function updateTest(id: string, slug: string): TestUrl | null {
  const domain = getDomain();
  const url = domain ? `${slug}.${domain}` : slug;
  const tests = getTests();
  const idx = tests.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tests[idx] = { ...tests[idx], slug, url };
  setTests(tests);
  return tests[idx];
}

export function deleteTest(id: string) {
  setTests(getTests().filter((t) => t.id !== id));
}
