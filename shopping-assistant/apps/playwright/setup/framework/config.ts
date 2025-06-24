import type { Project } from '@playwright/test';
import type { FrontendFrameworks } from '@setup/types';
import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function getProjects() {
  const frameworkProjects = await resolveFrameworkProjects();
  const frontendFrameworks = getFrontendFrameworks(frameworkProjects);
  const moduleProjects = await resolveModulesProjects(frontendFrameworks);

  return [...frameworkProjects, ...moduleProjects];
}

async function resolveModulesProjects(frameworks: FrontendFrameworks[]) {
  const moduleProjects: Project[] = [];

  const thisDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
  const rootDir = resolve(thisDir, '..', '..');
  const sfModulesDir = resolve(rootDir, 'sf-modules');
  const modulesDir = await stat(sfModulesDir).catch(() => null);

  if (!modulesDir?.isDirectory()) {
    return moduleProjects;
  }

  const modules = await readdir(sfModulesDir);

  for (const module of modules) {
    const fileList = await readdir(resolve(sfModulesDir, module));
    const hasProject = fileList.includes('config.ts');

    if (hasProject) {
      const { default: configFactory } = await import(`../../sf-modules/${module}/config.ts`);
      moduleProjects.push(...configFactory(frameworks));
    }
  }

  return moduleProjects;
}

async function resolveFrameworkProjects() {
  const frameworkProjects = [];

  const thisDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
  const frameworks = await readdir(thisDir);

  for (const framework of frameworks) {
    if (!(await stat(resolve(thisDir, framework))).isDirectory()) {
      continue;
    }

    const fileList = await readdir(resolve(thisDir, framework));
    const hasProject = fileList.includes('config.ts');

    if (hasProject) {
      const { config } = await import(`./${framework}/config.ts`);
      frameworkProjects.push(...config);
    }
  }

  return frameworkProjects;
}

function getFrontendFrameworks(frontendProjects: Project[]): FrontendFrameworks[] {
  return frontendProjects.reduce((frameworks, entry) => {
    if (entry?.use && 'framework' in entry.use) {
      frameworks.push(entry!.use!.framework! as FrontendFrameworks);
    }

    return frameworks;
  }, [] as FrontendFrameworks[]);
}
