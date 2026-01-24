import * as dotenv from 'dotenv'

// Update environment from argument
const mode = Bun.argv[2] ?? "test";
dotenv.config({ path: `.env.${mode}`, override: true, quiet: true });

const folder = import.meta.env.DEPLOYMENT_FOLDER ?? "spack_test";
const deployCommand = import.meta.env.DEPLOYMENT_SERVER ?? "echo Set your deploy command in DEPLOYMENT_SERVER"

console.info("Building:", mode, "for", folder);

// Build into {folder}
await Bun.spawn(["npm", "run", "build", "--", "--mode", mode, "--outDir", folder]).exited;

// Kill the process with SIGKILL after 30 seconds
const subprocess = Bun.spawn({
  cmd: deployCommand.split(" "),
  timeout: 30000,
  killSignal: "SIGKILL",
});

// Show deploy command result
const decoder = new TextDecoder();
for await (const chunk of subprocess.stdout) {
  console.info(decoder.decode(chunk));
}

console.info("done");
