const FORMS_KEY = "test_forms";
const RESPONSES_KEY = "form_responses";

export type FieldType = "text" | "email" | "tel" | "single_choice" | "multiple_choice";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

export interface TestForm {
  id: string;
  testSlug: string;
  title: string;
  fields: FormField[];
  createdAt: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  testSlug: string;
  data: Record<string, string | string[]>;
  createdAt: string;
}

function getForms(): TestForm[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FORMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setForms(data: TestForm[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FORMS_KEY, JSON.stringify(data));
}

function getResponses(): FormResponse[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RESPONSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setResponses(data: FormResponse[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(RESPONSES_KEY, JSON.stringify(data));
}

export function createForm(
  testSlug: string,
  title: string,
  fields: Omit<FormField, "id">[]
): TestForm {
  const forms = getForms();
  const newForm: TestForm = {
    id: crypto.randomUUID(),
    testSlug,
    title,
    fields: fields.map((f) => ({ ...f, id: crypto.randomUUID() })),
    createdAt: new Date().toISOString()
  };
  forms.push(newForm);
  setForms(forms);
  return newForm;
}

export function getFormBySlug(slug: string): TestForm | undefined {
  return getForms().find((f) => f.testSlug === slug);
}

export function getFormsByTestSlug(slug: string): TestForm[] {
  return getForms().filter((f) => f.testSlug === slug);
}

export function submitResponse(
  formId: string,
  testSlug: string,
  data: Record<string, string | string[]>
): FormResponse {
  const responses = getResponses();
  const newResp: FormResponse = {
    id: crypto.randomUUID(),
    formId,
    testSlug,
    data,
    createdAt: new Date().toISOString()
  };
  responses.push(newResp);
  setResponses(responses);
  return newResp;
}

export function getResponsesByTestSlug(slug: string): FormResponse[] {
  return getResponses().filter((r) => r.testSlug === slug);
}

export function getResponsesByFormId(formId: string): FormResponse[] {
  return getResponses().filter((r) => r.formId === formId);
}

export function deleteForm(id: string) {
  setForms(getForms().filter((f) => f.id !== id));
}
