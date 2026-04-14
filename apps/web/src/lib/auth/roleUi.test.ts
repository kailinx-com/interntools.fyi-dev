import { metadata as adminLayoutMetadata } from "@/app/admin/layout";
import { metadata as homeMetadata } from "@/app/page";

import {
  ADMIN_DASHBOARD_PATH,
  ROLE_USE_CASE,
  isAdminRole,
} from "./roleUi";
import type { UserRole } from "./types";

describe("roleUi", () => {
  it("reserves a dedicated path for the admin dashboard", () => {
    expect(ADMIN_DASHBOARD_PATH).toBe("/admin");
  });

  it("keeps admin operations on a route separate from the account dashboard", () => {
    expect(ADMIN_DASHBOARD_PATH).not.toBe("/me");
  });

  it("defines ROLE_USE_CASE for every UserRole value", () => {
    const keys = Object.keys(ROLE_USE_CASE) as UserRole[];
    expect(keys.sort()).toEqual(["ADMIN", "STUDENT"]);
  });

  it("describes distinct use cases per role", () => {
    const student = ROLE_USE_CASE.STUDENT;
    const admin = ROLE_USE_CASE.ADMIN;
    expect(student.summary).not.toEqual(admin.summary);
    expect(student.summary.toLowerCase()).toMatch(/offer|paycheck|community|profile/i);
    expect(admin.summary.toLowerCase()).toMatch(/user|role|directory|platform/i);
  });

  it.each<[UserRole | null | undefined, boolean]>([
    ["ADMIN", true],
    ["STUDENT", false],
    [undefined, false],
    [null, false],
  ])("isAdminRole(%j) === %s", (role, expected) => {
    expect(isAdminRole(role)).toBe(expected);
  });

  describe("end-user roles: meaningfully different goals; one primary student UI; admin not a separate marketing experience", () => {
    it("gives STUDENT and ADMIN different labels and non-overlapping primary goals in copy", () => {
      expect(ROLE_USE_CASE.STUDENT.label).toBe("Student");
      expect(ROLE_USE_CASE.ADMIN.label).toBe("Administrator");
      expect(ROLE_USE_CASE.STUDENT.summary).not.toEqual(ROLE_USE_CASE.ADMIN.summary);
      expect(ROLE_USE_CASE.STUDENT.summary.toLowerCase()).not.toMatch(
        /\buser directory\b|\brole management\b|\bplatform operations\b/i,
      );
      expect(ROLE_USE_CASE.ADMIN.summary.toLowerCase()).toMatch(
        /user directory|role management|platform/i,
      );
    });

    it("keeps admin operations on a dedicated back-office path, not the public home", () => {
      expect(ADMIN_DASHBOARD_PATH).toBe("/admin");
      expect(ADMIN_DASHBOARD_PATH).not.toBe("/");
    });

    it("uses home metadata for the intern/student product, not an admin-branded marketing home", () => {
      const title = String(homeMetadata.title ?? "").toLowerCase();
      const desc = String(homeMetadata.description ?? "").toLowerCase();
      expect(title).not.toMatch(/\badmin\b/);
      expect(desc).toMatch(/intern|offer|student|community/);
    });

    it("uses admin layout metadata for back-office only, distinct from the landing title", () => {
      expect(String(adminLayoutMetadata.title ?? "").toLowerCase()).toMatch(/admin/);
      expect(adminLayoutMetadata.title).not.toEqual(homeMetadata.title);
    });
  });
});
