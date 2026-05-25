import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const tmpHome = "/tmp/ao-config-test-home";

vi.mock("node:os", () => ({
  homedir: () => tmpHome,
  tmpdir: () => "/tmp",
}));

import { getGlobalConfigPath } from "../src/global-config.js";
import { migrateGlobalConfigIfNeeded } from "../src/config.js";

describe("getGlobalConfigPath", () => {
  beforeEach(() => {
    rmSync(tmpHome, { recursive: true, force: true });
    mkdirSync(tmpHome, { recursive: true });
    vi.stubEnv("XDG_CONFIG_HOME", "");
    vi.stubEnv("AO_GLOBAL_CONFIG", "");
  });

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it("returns ~/.ao/agent-orchestrator.yaml when it exists", () => {
    const aoDir = join(tmpHome, ".ao");
    mkdirSync(aoDir, { recursive: true });
    writeFileSync(join(aoDir, "agent-orchestrator.yaml"), "projects: {}");

    const result = getGlobalConfigPath();
    expect(result).toBe(join(tmpHome, ".ao", "agent-orchestrator.yaml"));
  });

  it("returns XDG path when ~/.ao/ does not exist but XDG path exists", () => {
    const xdgDir = join(tmpHome, ".config", "agent-orchestrator");
    mkdirSync(xdgDir, { recursive: true });
    writeFileSync(join(xdgDir, "config.yaml"), "projects: {}");
    vi.stubEnv("XDG_CONFIG_HOME", join(tmpHome, ".config"));

    const result = getGlobalConfigPath();
    expect(result).toBe(join(tmpHome, ".config", "agent-orchestrator", "config.yaml"));
  });

  it("returns legacy fallback when neither ~/.ao/ nor XDG path exists", () => {
    const result = getGlobalConfigPath();
    expect(result).toBe(join(tmpHome, ".agent-orchestrator", "config.yaml"));
  });

  it("returns AO_GLOBAL_CONFIG path when set, bypassing filesystem checks", () => {
    vi.stubEnv("AO_GLOBAL_CONFIG", "/custom/path/config.yaml");
    const result = getGlobalConfigPath();
    expect(result).toBe("/custom/path/config.yaml");
  });
});

describe("migrateGlobalConfigIfNeeded", () => {
  beforeEach(() => {
    rmSync(tmpHome, { recursive: true, force: true });
    mkdirSync(tmpHome, { recursive: true });
    vi.stubEnv("XDG_CONFIG_HOME", "");
    vi.stubEnv("AO_GLOBAL_CONFIG", "");
  });

  afterEach(() => {
    rmSync(tmpHome, { recursive: true, force: true });
    vi.unstubAllEnvs();
  });

  it("returns null when AO_GLOBAL_CONFIG is set", () => {
    vi.stubEnv("AO_GLOBAL_CONFIG", "/custom/path/config.yaml");
    const result = migrateGlobalConfigIfNeeded("/some/legacy/path.yaml");
    expect(result).toBeNull();
  });

  it("returns null when ~/.ao/agent-orchestrator.yaml already exists", () => {
    const aoDir = join(tmpHome, ".ao");
    mkdirSync(aoDir, { recursive: true });
    writeFileSync(join(aoDir, "agent-orchestrator.yaml"), "projects: {}");

    const legacyPath = join(tmpHome, ".agent-orchestrator", "config.yaml");
    mkdirSync(dirname(legacyPath), { recursive: true });
    writeFileSync(legacyPath, "projects: {}");

    const result = migrateGlobalConfigIfNeeded(legacyPath);
    expect(result).toBeNull();
  });

  it("copies legacy config to ~/.ao/ when ~/.ao/ does not exist", () => {
    const legacyPath = join(tmpHome, ".agent-orchestrator", "config.yaml");
    mkdirSync(dirname(legacyPath), { recursive: true });
    writeFileSync(legacyPath, "port: 4000\nprojects: {}");

    const expectedNewPath = join(tmpHome, ".ao", "agent-orchestrator.yaml");

    const result = migrateGlobalConfigIfNeeded(legacyPath);
    expect(result).toBe(expectedNewPath);
    expect(existsSync(expectedNewPath)).toBe(true);
  });

  it("returns null when config is not at a legacy path", () => {
    const result = migrateGlobalConfigIfNeeded("/some/other/path.yaml");
    expect(result).toBeNull();
  });
});
