import { test, expect } from "@playwright/test";
test("Clerk authentication routes expose real sign-in and sign-up without private data",async({page})=>{
  await page.goto("/sign-in");
  await expect(page.getByRole("heading",{name:"Sign in to Shape Studio",exact:true})).toBeVisible();
  const unconfigured=page.getByText("Clerk is not configured.",{exact:false});
  if(await unconfigured.isVisible()) {
    await expect(page.getByRole("link",{name:"Explore the fictional demo"})).toBeVisible();
  } else {
    await expect(page.locator('.cl-signIn-root')).toBeVisible({timeout:30000});
    await expect(page.getByLabel(/email address|email or username|email or phone/i).first()).toBeVisible();
  }
  await page.goto("/sign-up");
  await expect(page.getByRole("heading",{name:"Create your Shape Studio account",exact:true})).toBeVisible();
  if(!(await unconfigured.isVisible())) await expect(page.locator('.cl-signUp-root')).toBeVisible({timeout:30000});
  const response=await page.request.get("/api/projects");
  expect([401,503]).toContain(response.status());
  const body=await response.json();
  expect(body.ok).toBe(false);
});
