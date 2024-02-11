
import { $ } from 'bun'
import { readdir, exists } from 'node:fs/promises';
import path from "path";
import packageMetadata from "./package.json"

async function update(cwd: string) {
  console.info("Pulling images")

  try {
    await $`docker compose pull`.cwd(cwd).quiet()
  } catch (error) {
    console.error("Error Pulling images\n")
    return;
  }

  console.info("Updating container")
  try {
    await $`docker compose up -d`.cwd(cwd).quiet()
  } catch {
    console.error("Error Updating Container")
  }
  console.info("\n")
}

async function main() {

  const baseDir = process.argv[2] ?? process.cwd();
  const filesAndDirs = await readdir(baseDir, { withFileTypes: true })
  const dirs = filesAndDirs.filter(fileOrDir => fileOrDir.isDirectory()).map(dir => dir.name);

  for (const dir of dirs) {
    const cwd = path.join(baseDir, dir)
    if (!await dockerComposeExists(cwd)) continue;

    console.info(`💽 Updating ${dir}`);
    await update(cwd);
  }

  await purgeImages();
}

(function init() {
  console.info(`🔥 Update Docker Services Tool - ${packageMetadata.version}\n`)
  main()
})()

async function dockerComposeExists(cwd: string) {
  return await exists(path.join(cwd, "docker-compose.yml"))
    || await exists(path.join(cwd, "docker-compose.yaml"))
    || await exists(path.join(cwd, "DOCKER-COMPOSE.yml"))
    || await exists(path.join(cwd, "DOCKER-COMPOSE.yaml"))
}
async function purgeImages() {
  console.info("🗑️ Purging Docker Images")
  const output = await $`docker image prune -f`.text();
  console.info(`> ${output}`)
}

